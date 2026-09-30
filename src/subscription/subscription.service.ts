import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import type { Subscription } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { GrantSubscriptionDto, SubscriptionPlan, UpdateSubscriptionDto } from './subscription.dto';

export type SubscriptionState = 'active' | 'expired' | 'revoked' | 'none';

export interface SubscriptionStatus {
    active: boolean;
    state: SubscriptionState;
    /** The period in force now, if any. */
    current: Subscription | null;
    /** When paid time runs out, counting periods already queued after this one. */
    paidUntil: string | null;
    /** Whole days left until paidUntil (0 on the last day). */
    daysLeft: number | null;
    checkedAt: string;
}

// The status is read on every write request while the system is locked, and
// polled by every open browser tab. A short cache keeps that off the database;
// every grant/edit/revoke clears it so changes apply immediately.
const STATUS_TTL_MS = 15_000;

const DAY_MS = 86_400_000;

/** End of a period of `quantity` plans starting at `start`. */
export function periodEnd(start: Date, plan: SubscriptionPlan, quantity: number): Date {
    const end = new Date(start);
    if (plan === 'annual') end.setUTCFullYear(end.getUTCFullYear() + quantity);
    else if (plan === 'weekly') end.setTime(end.getTime() + quantity * 7 * DAY_MS);
    else end.setTime(end.getTime() + quantity * DAY_MS); // daily, trial
    return end;
}

@Injectable()
export class SubscriptionService implements OnModuleInit {
    private readonly logger = new Logger(SubscriptionService.name);
    private cached: { at: number; status: SubscriptionStatus } | null = null;

    constructor(
        private readonly prisma: PrismaService,
        private readonly audit: AuditService,
    ) { }

    /**
     * First-start housekeeping:
     *  - mark the vendor's Administrator account as the system owner if no
     *    account carries the flag yet (SYSTEM_OWNER_EMAIL, else the seed admin);
     *  - give a brand-new install a trial, so deploying this feature doesn't
     *    lock a school out before the owner has granted anything.
     */
    async onModuleInit() {
        try {
            const owner = await this.prisma.user.findFirst({ where: { isSystemOwner: true }, select: { id: true } });
            if (!owner) {
                const email = process.env.SYSTEM_OWNER_EMAIL || process.env.SEED_ADMIN_EMAIL || 'arnoldhenry958@gmail.com';
                const user = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
                if (user) {
                    await this.prisma.user.update({
                        where: { id: user.id },
                        data: { isSystemOwner: true, role: 'admin', isActive: true },
                    });
                    this.logger.log(`Marked ${email} as the system owner (Administrator) account`);
                } else {
                    this.logger.warn(`No system owner account: ${email} does not exist. Set SYSTEM_OWNER_EMAIL.`);
                }
            }

            if ((await this.prisma.subscription.count()) === 0) {
                const days = Math.max(1, Number(process.env.SUBSCRIPTION_TRIAL_DAYS) || 14);
                const startsAt = new Date();
                await this.prisma.subscription.create({
                    data: {
                        plan: 'trial',
                        quantity: days,
                        startsAt,
                        endsAt: periodEnd(startsAt, 'trial', days),
                        notes: `Automatic ${days}-day trial on first start`,
                        createdBy: 'system',
                    },
                });
                this.logger.log(`Started a ${days}-day trial subscription`);
            }
        } catch (err) {
            // Never block startup over this; the guard fails closed on its own.
            this.logger.error(`Subscription start-up check failed: ${err instanceof Error ? err.message : err}`);
        }
    }

    private invalidate() {
        this.cached = null;
    }

    async status(): Promise<SubscriptionStatus> {
        if (this.cached && Date.now() - this.cached.at < STATUS_TTL_MS) return this.cached.status;

        const now = new Date();
        const current = await this.prisma.subscription.findFirst({
            where: { status: 'active', startsAt: { lte: now }, endsAt: { gt: now } },
            orderBy: { endsAt: 'desc' },
        });

        let state: SubscriptionState = 'active';
        let paidUntil: Date | null = null;
        if (current) {
            // Follow queued periods that start before (or right when) the
            // previous one ends, to report the real end of paid time.
            paidUntil = current.endsAt;
            const queued = await this.prisma.subscription.findMany({
                where: { status: 'active', startsAt: { gt: now } },
                orderBy: { startsAt: 'asc' },
            });
            for (const q of queued) {
                if (q.startsAt.getTime() > paidUntil.getTime()) break;
                if (q.endsAt > paidUntil) paidUntil = q.endsAt;
            }
        } else {
            // Explain the lock by whichever period stopped applying most
            // recently: a revoked one stopped at revokedAt, others at endsAt.
            const recent = await this.prisma.subscription.findMany({
                where: { startsAt: { lte: now } },
                orderBy: { startsAt: 'desc' },
                take: 20,
            });
            const stoppedAt = (s: Subscription) =>
                s.status === 'revoked' && s.revokedAt && s.revokedAt < s.endsAt ? s.revokedAt : s.endsAt;
            const last = recent.sort((a, b) => stoppedAt(b).getTime() - stoppedAt(a).getTime())[0];
            state = !last ? 'none' : last.status === 'revoked' && last.endsAt > now ? 'revoked' : 'expired';
        }

        const status: SubscriptionStatus = {
            active: !!current,
            state,
            current,
            paidUntil: paidUntil?.toISOString() ?? null,
            daysLeft: paidUntil ? Math.max(0, Math.floor((paidUntil.getTime() - now.getTime()) / DAY_MS)) : null,
            checkedAt: now.toISOString(),
        };
        this.cached = { at: Date.now(), status };
        return status;
    }

    list() {
        return this.prisma.subscription.findMany({ orderBy: [{ startsAt: 'desc' }, { createdAt: 'desc' }], take: 200 });
    }

    /** Throws unless `userId` is the system owner (Administrator) account. */
    async assertOwner(userId?: string) {
        const user = userId
            ? await this.prisma.user.findUnique({ where: { id: userId }, select: { isSystemOwner: true } })
            : null;
        if (!user?.isSystemOwner) {
            throw new ForbiddenException('Only the Administrator account can manage subscriptions');
        }
    }

    async grant(dto: GrantSubscriptionDto, userId: string) {
        await this.assertOwner(userId);
        const quantity = dto.quantity ?? 1;

        let startsAt: Date;
        if (dto.startsAt) {
            startsAt = new Date(dto.startsAt);
        } else {
            // Stack onto whatever paid time is still to run (current or queued).
            const latest = await this.prisma.subscription.findFirst({
                where: { status: 'active', endsAt: { gt: new Date() } },
                orderBy: { endsAt: 'desc' },
            });
            startsAt = latest?.endsAt ?? new Date();
        }

        const row = await this.prisma.subscription.create({
            data: {
                plan: dto.plan,
                quantity,
                startsAt,
                endsAt: periodEnd(startsAt, dto.plan, quantity),
                amount: dto.amount ?? null,
                notes: dto.notes ?? null,
                createdBy: userId,
            },
        });
        this.invalidate();
        await this.audit.log({ userId, action: 'SUBSCRIPTION_GRANTED', entity: 'Subscription', entityId: row.id, after: row });
        return row;
    }

    async update(id: string, dto: UpdateSubscriptionDto, userId: string) {
        await this.assertOwner(userId);
        const before = await this.prisma.subscription.findUnique({ where: { id } });
        if (!before) throw new NotFoundException('Subscription not found');
        if (before.status === 'revoked') throw new BadRequestException('A revoked subscription cannot be edited; grant a new one');

        const plan = (dto.plan ?? before.plan) as SubscriptionPlan;
        const quantity = dto.quantity ?? before.quantity;
        const startsAt = dto.startsAt ? new Date(dto.startsAt) : before.startsAt;
        // An explicit end date wins; otherwise recompute if plan/length/start moved.
        const endsAt = dto.endsAt
            ? new Date(dto.endsAt)
            : dto.plan || dto.quantity || dto.startsAt
                ? periodEnd(startsAt, plan, quantity)
                : before.endsAt;
        if (endsAt <= startsAt) throw new BadRequestException('The end must be after the start');

        const row = await this.prisma.subscription.update({
            where: { id },
            data: {
                plan,
                quantity,
                startsAt,
                endsAt,
                ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
                ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
            },
        });
        this.invalidate();
        await this.audit.log({ userId, action: 'SUBSCRIPTION_UPDATED', entity: 'Subscription', entityId: id, before, after: row });
        return row;
    }

    async revoke(id: string, reason: string | undefined, userId: string) {
        await this.assertOwner(userId);
        const before = await this.prisma.subscription.findUnique({ where: { id } });
        if (!before) throw new NotFoundException('Subscription not found');
        if (before.status === 'revoked') throw new BadRequestException('Already revoked');

        const row = await this.prisma.subscription.update({
            where: { id },
            data: { status: 'revoked', revokedAt: new Date(), revokedBy: userId, revokeReason: reason ?? null },
        });
        this.invalidate();
        await this.audit.log({ userId, action: 'SUBSCRIPTION_REVOKED', entity: 'Subscription', entityId: id, before, after: row });
        return row;
    }
}
