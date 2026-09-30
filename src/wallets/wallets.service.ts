import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type Wallet } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { BaseCrudService, FilterSpec, SummarySpec } from 'src/common/base-crud.service';
import { SmsService } from 'src/sms/sms.service';
import { DepositDto, SpendDto, UpdateWalletDto } from './wallets.dto';

type Tx = Prisma.TransactionClient;

// Uganda is UTC+3 all year (no daylight saving), so "today" for a daily
// spending limit is a fixed offset from UTC regardless of the server's zone.
const KAMPALA_OFFSET_MS = 3 * 60 * 60 * 1000;

export function startOfKampalaDay(now = new Date()): Date {
    const local = new Date(now.getTime() + KAMPALA_OFFSET_MS);
    local.setUTCHours(0, 0, 0, 0);
    return new Date(local.getTime() - KAMPALA_OFFSET_MS);
}

const ugx = (n: number) => `UGX ${Math.round(n).toLocaleString('en-US')}`;

/**
 * Pocket money / canteen wallets.
 *
 * Every balance change goes through `move()`, which locks the wallet row,
 * checks the rules, updates the balance and writes the ledger entry in one
 * transaction — so two tills charging the same card at once can't overdraw
 * it, and the ledger always adds up to the balance. Ledger rows are never
 * edited or deleted; a mistake is undone with a reversal entry.
 */
@Injectable()
export class WalletsService extends BaseCrudService {
    protected delegate = this.prisma.wallet;
    protected entity = 'Wallet';
    protected searchFields = ['studentName', 'className', 'rfidTag'];

    protected filterSpec: Record<string, FilterSpec> = {
        className: { field: 'className', op: 'equals' },
        status: { field: 'status', op: 'equals' },
        lowBalance: (value: string) => {
            const n = Number(value);
            return Number.isNaN(n) ? undefined : { balance: { lt: n } };
        },
    };

    protected summarySpec: Record<string, SummarySpec> = {
        total: { kind: 'count' },
        totalBalance: { kind: 'sum', field: 'balance' },
        frozen: { kind: 'countWhere', where: { status: 'frozen' } },
    };

    constructor(
        prisma: PrismaService,
        audit: AuditService,
        private readonly sms: SmsService,
    ) {
        super(prisma, audit);
    }

    private async userName(userId?: string) {
        if (!userId) return null;
        const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
        return user?.name ?? null;
    }

    /** Net canteen spend today (reversed purchases don't count). */
    private async spentToday(tx: Tx | PrismaService, walletId: string) {
        const agg = await tx.walletTransaction.aggregate({
            where: {
                walletId,
                type: 'purchase',
                reversedById: null,
                createdAt: { gte: startOfKampalaDay() },
            },
            _sum: { amount: true },
        });
        return Math.abs(agg._sum.amount ?? 0);
    }

    /** Wallet for a pupil, opening one on first use and refreshing name/class. */
    private async ensureWallet(tx: Tx, studentId: string) {
        const student = await tx.student.findUnique({
            where: { id: studentId },
            select: { firstName: true, lastName: true, className: true },
        });
        if (!student) throw new NotFoundException('Pupil not found');
        const studentName = `${student.firstName} ${student.lastName}`.trim();
        return tx.wallet.upsert({
            where: { studentId },
            create: { studentId, studentName, className: student.className },
            update: { studentName, className: student.className },
        });
    }

    /**
     * Apply a signed amount to a wallet and record it. The row lock
     * (SELECT … FOR UPDATE) serialises concurrent moves on the same wallet
     * until this transaction commits.
     */
    private async move(
        tx: Tx,
        walletId: string,
        entry: {
            type: 'deposit' | 'purchase' | 'withdrawal' | 'reversal';
            amount: number;
            method?: string | null;
            reference?: string | null;
            description?: string | null;
            reversesId?: string | null;
            recordedBy?: string | null;
        },
    ) {
        await tx.$queryRaw`SELECT id FROM Wallet WHERE id = ${walletId} FOR UPDATE`;
        const wallet = await tx.wallet.findUnique({ where: { id: walletId } });
        if (!wallet) throw new NotFoundException('Wallet not found');

        if (entry.type === 'purchase' || entry.type === 'withdrawal') {
            if (wallet.status === 'frozen') {
                throw new BadRequestException(`${wallet.studentName}'s wallet is frozen`);
            }
        }
        if (entry.type === 'purchase' && wallet.dailyLimit != null) {
            const spent = await this.spentToday(tx, walletId);
            const left = wallet.dailyLimit - spent;
            if (-entry.amount > left) {
                throw new BadRequestException(
                    `Daily limit reached: ${ugx(Math.max(left, 0))} left of ${ugx(wallet.dailyLimit)} today`,
                );
            }
        }

        const balanceAfter = wallet.balance + entry.amount;
        if (balanceAfter < 0) {
            throw new BadRequestException(
                entry.type === 'reversal'
                    ? `Cannot reverse: ${wallet.studentName}'s balance (${ugx(wallet.balance)}) is too low`
                    : `Insufficient balance: ${wallet.studentName} has ${ugx(wallet.balance)}`,
            );
        }

        const updated = await tx.wallet.update({ where: { id: walletId }, data: { balance: balanceAfter } });
        const transaction = await tx.walletTransaction.create({
            data: {
                walletId,
                studentId: wallet.studentId,
                studentName: wallet.studentName,
                type: entry.type,
                amount: entry.amount,
                balanceAfter,
                method: entry.method ?? null,
                reference: entry.reference ?? null,
                description: entry.description ?? null,
                reversesId: entry.reversesId ?? null,
                recordedBy: entry.recordedBy ?? null,
            },
        });
        return { wallet: updated, transaction };
    }

    private async logMove(userId: string | undefined, result: { wallet: { id: string }; transaction: unknown }) {
        const tx = result.transaction as { type: string };
        await this.audit.log({
            userId,
            action: `WALLET_${tx.type.toUpperCase()}`,
            entity: this.entity,
            entityId: result.wallet.id,
            after: result.transaction,
        });
    }

    async deposit(dto: DepositDto, userId?: string) {
        const recordedBy = await this.userName(userId);
        const result = await this.prisma.$transaction(async (tx) => {
            const wallet = await this.ensureWallet(tx, dto.studentId);
            return this.move(tx, wallet.id, {
                type: 'deposit',
                amount: dto.amount,
                method: dto.method || 'Cash',
                reference: dto.reference,
                description: dto.description || 'Pocket money deposit',
                recordedBy,
            });
        });
        await this.logMove(userId, result);

        if (!dto.notifyParent) return result;
        // The money is in; a failed receipt text is reported, not fatal.
        try {
            const student = await this.prisma.student.findUnique({
                where: { id: dto.studentId },
                select: { parentName: true, parentPhone: true },
            });
            if (!student?.parentPhone) return { ...result, smsError: 'No parent phone number saved for this pupil' };
            const message =
                `Dear ${student.parentName || 'Parent'}, ${ugx(dto.amount)} has been deposited to ` +
                `${result.wallet.studentName}'s pocket money. New balance: ${ugx(result.wallet.balance)}. ` +
                `- ${await this.sms.schoolName()}`;
            const sms = await this.sms.send([{ phone: student.parentPhone, message }], 'wallet', result.transaction.id);
            if (!sms.sent) {
                return { ...result, smsError: sms.invalid.length ? 'Parent number is not a valid Ugandan mobile' : sms.errors[0] || 'SMS failed' };
            }
            return { ...result, smsSent: true };
        } catch (err) {
            return { ...result, smsError: err instanceof Error ? err.message : 'SMS failed' };
        }
    }

    async spend(walletId: string, type: 'purchase' | 'withdrawal', dto: SpendDto, userId?: string) {
        const recordedBy = await this.userName(userId);
        const result = await this.prisma.$transaction((tx) =>
            this.move(tx, walletId, {
                type,
                amount: -dto.amount,
                description: dto.description || (type === 'purchase' ? 'Canteen purchase' : 'Cash withdrawal'),
                recordedBy,
            }),
        );
        await this.logMove(userId, result);
        return result;
    }

    async reverse(transactionId: string, reason: string, userId?: string) {
        const recordedBy = await this.userName(userId);
        const result = await this.prisma.$transaction(async (tx) => {
            const original = await tx.walletTransaction.findUnique({ where: { id: transactionId } });
            if (!original) throw new NotFoundException('Transaction not found');
            if (original.type === 'reversal') throw new BadRequestException('A reversal cannot itself be reversed');
            if (original.reversedById) throw new ConflictException('This transaction has already been reversed');

            const moved = await this.move(tx, original.walletId, {
                type: 'reversal',
                amount: -original.amount,
                description: `Reversal: ${reason}`,
                reversesId: original.id,
                recordedBy,
            });

            // Conditional on still being unreversed, so two people reversing
            // the same entry at once can't both succeed (the loser rolls back).
            const marked = await tx.walletTransaction.updateMany({
                where: { id: original.id, reversedById: null },
                data: { reversedById: moved.transaction.id },
            });
            if (marked.count === 0) throw new ConflictException('This transaction has already been reversed');
            return moved;
        });
        await this.logMove(userId, result);
        return result;
    }

    async updateSettings(id: string, dto: UpdateWalletDto) {
        const data: Prisma.WalletUpdateInput = {};
        if (dto.dailyLimit !== undefined) data.dailyLimit = dto.dailyLimit;
        if (dto.status !== undefined) data.status = dto.status;
        if (dto.rfidTag !== undefined) data.rfidTag = dto.rfidTag?.trim() || null;
        try {
            return (await this.update(id, data)) as Wallet;
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
                throw new ConflictException('That card is already assigned to another pupil');
            }
            throw err;
        }
    }

    /**
     * Find a pupil's wallet for the canteen till or the deposit screen — by
     * scanned card tag, admission number or student number (`q`), or directly
     * by `studentId`. A pupil without a wallet yet comes back with wallet null.
     */
    async lookup(q?: string, studentId?: string) {
        let wallet: Wallet | null = null;
        let sid = studentId;

        const code = q?.trim();
        if (!sid && code) {
            wallet = await this.prisma.wallet.findUnique({ where: { rfidTag: code } });
            if (wallet) {
                sid = wallet.studentId;
            } else {
                const student = await this.prisma.student.findFirst({
                    where: { OR: [{ admissionNo: code }, { studentNumber: code }] },
                    select: { id: true },
                });
                sid = student?.id;
            }
        }
        if (!sid) throw new NotFoundException(`No pupil or card matches "${code ?? ''}"`);

        const student = await this.prisma.student.findUnique({
            where: { id: sid },
            select: { id: true, firstName: true, lastName: true, className: true, admissionNo: true, passportPhoto: true, status: true },
        });
        if (!student) throw new NotFoundException('Pupil not found');
        wallet ??= await this.prisma.wallet.findUnique({ where: { studentId: sid } });

        const spentToday = wallet ? await this.spentToday(this.prisma, wallet.id) : 0;
        return {
            student: { ...student, name: `${student.firstName} ${student.lastName}`.trim() },
            wallet,
            spentToday,
            remainingToday: wallet?.dailyLimit != null ? Math.max(wallet.dailyLimit - spentToday, 0) : null,
        };
    }
}
