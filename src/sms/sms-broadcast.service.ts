import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { normaliseUgPhone, SmsService } from './sms.service';
import { SMS_AUDIENCES, SendSmsDto, SmsAudience } from './sms.dto';

// One person to text, with the values their message placeholders resolve to.
interface Recipient {
    phone: string;
    vars: Record<string, string>;
}

// Placeholders a message may use: {parent} {student} {class} {name}.
const PLACEHOLDER = /\{(parent|student|class|name)\}/g;

const fill = (template: string, vars: Record<string, string>) =>
    template.replace(PLACEHOLDER, (_, key: string) => vars[key] ?? '');

@Injectable()
export class SmsBroadcastService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly sms: SmsService,
        private readonly audit: AuditService,
    ) { }

    private async resolve(audience: SmsAudience, className?: string, numbers?: string): Promise<Recipient[]> {
        if (audience === 'Custom Numbers') {
            return (numbers ?? '')
                .split(/[\s,;]+/)
                .filter(Boolean)
                .map((phone) => ({ phone, vars: { name: '', parent: '', student: '', class: '' } }));
        }

        if (audience === 'All Teachers') {
            const staff = await this.prisma.staff.findMany({
                where: { isActive: true, phone: { not: null } },
                select: { firstName: true, lastName: true, phone: true },
            });
            return staff.map((s) => ({
                phone: s.phone!,
                vars: { name: `${s.firstName} ${s.lastName}`.trim(), parent: '', student: '', class: '' },
            }));
        }

        if (audience === 'Class Parents' && !className) {
            throw new BadRequestException('Choose the class whose parents should receive this message');
        }

        const students = await this.prisma.student.findMany({
            where: {
                status: 'active',
                ...(audience === 'Class Parents' ? { className } : {}),
            },
            select: {
                firstName: true, lastName: true, className: true,
                phone: true, parentPhone: true, parentName: true,
            },
            orderBy: [{ className: 'asc' }, { firstName: 'asc' }],
        });

        return students
            .map((s) => {
                const student = `${s.firstName} ${s.lastName}`.trim();
                const phone = audience === 'All Students' ? s.phone : s.parentPhone;
                const parent = s.parentName || 'Parent';
                return {
                    phone: phone ?? '',
                    vars: {
                        student,
                        class: s.className,
                        parent,
                        name: audience === 'All Students' ? student : parent,
                    },
                };
            })
            .filter((r) => r.phone);
    }

    /**
     * Drop repeat numbers. A parent with three children would otherwise get
     * the same announcement three times — unless the message names the pupil,
     * in which case each child's message is genuinely different.
     */
    private dedupe(recipients: Recipient[], template: string): Recipient[] {
        const perPupil = /\{(student|class)\}/.test(template);
        const seen = new Set<string>();
        return recipients.filter((r) => {
            const phone = normaliseUgPhone(r.phone) ?? r.phone;
            const key = perPupil ? `${phone}|${r.vars.student}` : phone;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    /** How many valid numbers a send would reach, for the compose screen. */
    async count(audience: string, className?: string, numbers?: string, message = '') {
        if (!(SMS_AUDIENCES as readonly string[]).includes(audience)) {
            throw new BadRequestException('Unknown audience');
        }
        const recipients = this.dedupe(await this.resolve(audience as SmsAudience, className, numbers), message);
        const valid = recipients.filter((r) => normaliseUgPhone(r.phone)).length;
        return { count: valid, invalid: recipients.length - valid };
    }

    async send(dto: SendSmsDto, userId?: string) {
        const recipients = this.dedupe(await this.resolve(dto.audience, dto.className, dto.numbers), dto.message);
        if (!recipients.length) {
            throw new BadRequestException('No recipients with a phone number were found for this audience');
        }

        const audience = dto.audience === 'Class Parents' ? `Parents of ${dto.className}` : dto.audience;
        const blast = await this.prisma.blast.create({
            data: {
                channel: 'SMS',
                audience,
                subject: dto.subject,
                body: dto.message,
                recipients: 0,
                sentAt: new Date().toISOString(),
                status: 'sending',
            },
        });

        const result = await this.sms.send(
            recipients.map((r) => ({ phone: r.phone, message: fill(dto.message, r.vars) })),
            'blast',
            blast.id,
        );

        const status = result.failed === 0 ? 'sent' : result.sent === 0 ? 'failed' : 'partial';
        const updated = await this.prisma.blast.update({
            where: { id: blast.id },
            data: {
                recipients: result.sent,
                failed: result.failed + result.invalid.length,
                cost: result.cost,
                status,
                error: [
                    ...result.errors,
                    ...(result.invalid.length ? [`${result.invalid.length} invalid number(s) skipped`] : []),
                ].join('; ') || null,
            },
        });

        await this.audit.log({
            userId,
            action: 'SMS_BLAST_SENT',
            entity: 'Blast',
            entityId: blast.id,
            after: updated,
        });

        return { blast: updated, ...result };
    }
}
