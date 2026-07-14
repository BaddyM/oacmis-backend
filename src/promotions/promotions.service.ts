import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { BaseCrudService } from 'src/common/base-crud.service';
import { PromotionEntryDto, PromotionOutcome, RunPromotionDto } from './promotions.dto';

export interface RosterEntry {
    studentId: string;
    studentName: string;
    admissionNo: string;
    className: string;
    /** Unpaid fees across every term. Schools weigh this when promoting. */
    balance: number;
}

export interface PromotionResult {
    fromClass: string;
    toClass: string | null;
    fromYear: number;
    toYear: number;
    promoted: number;
    repeated: number;
    transferred: number;
    graduated: number;
    total: number;
}

@Injectable()
export class PromotionsService extends BaseCrudService {
    protected delegate = this.prisma.promotionRecord;
    protected entity = 'PromotionRecord';
    protected searchFields = ['studentName', 'fromClass', 'toClass', 'outcome'];
    protected defaultLimit = 200;

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }

    /** The active pupils of a class, each with their outstanding fee balance. */
    async roster(className: string): Promise<{ data: RosterEntry[]; total: number; totalPages: number }> {
        const students = await this.prisma.student.findMany({
            where: { className, status: 'active' },
            select: { id: true, firstName: true, lastName: true, admissionNo: true, className: true },
            orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
        });
        if (students.length === 0) return { data: [], total: 0, totalPages: 1 };

        // One grouped query rather than a balance lookup per pupil.
        const fees = await this.prisma.feeRecord.groupBy({
            by: ['studentId'],
            where: { studentId: { in: students.map((s) => s.id) } },
            _sum: { amount: true, paidAmount: true },
        });
        const balances = new Map(
            fees.map((f) => [f.studentId, Math.max(0, (f._sum.amount || 0) - (f._sum.paidAmount || 0))]),
        );

        const data = students.map((s) => ({
            studentId: s.id,
            studentName: `${s.firstName} ${s.lastName}`,
            admissionNo: s.admissionNo,
            className: s.className,
            balance: balances.get(s.id) ?? 0,
        }));
        return { data, total: data.length, totalPages: 1 };
    }

    /**
     * Apply end-of-year outcomes to a whole class in one transaction.
     *
     * All-or-nothing on purpose: a half-promoted class — some pupils moved, some
     * not, with no record of which — is far harder to unpick than a failed run.
     * Every pupil also gets a PromotionRecord, so a wrong promotion can be
     * traced back to where they came from.
     */
    async run(dto: RunPromotionDto): Promise<PromotionResult> {
        const { fromClass, toClass, fromYear, toYear, entries } = dto;

        const needsTarget = entries.some((e) => e.outcome === 'promoted');
        if (needsTarget && !toClass) {
            throw new BadRequestException('toClass is required when any pupil is being promoted');
        }
        if (toClass && toClass === fromClass) {
            throw new BadRequestException('toClass must differ from fromClass — use "repeated" to hold a pupil back');
        }

        // Every id must be a live pupil of fromClass. Guards against a stale page
        // promoting someone who has already moved, graduated or left.
        const students = await this.prisma.student.findMany({
            where: { id: { in: entries.map((e) => e.studentId) }, className: fromClass, status: 'active' },
            select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        });
        if (students.length !== entries.length) {
            const found = new Set(students.map((s) => s.id));
            const missing = entries.filter((e) => !found.has(e.studentId)).map((e) => e.studentId);
            throw new BadRequestException(
                `${missing.length} pupil(s) are not active members of ${fromClass} — reload the roster and try again`,
            );
        }
        const byId = new Map(students.map((s) => [s.id, s]));

        const ops: any[] = [];
        const counts: Record<PromotionOutcome, number> = { promoted: 0, repeated: 0, transferred: 0, graduated: 0 };

        for (const entry of entries) {
            const s = byId.get(entry.studentId)!;
            const studentName = `${s.firstName} ${s.lastName}`;
            counts[entry.outcome]++;

            ops.push(
                this.prisma.promotionRecord.create({
                    data: {
                        studentId: entry.studentId,
                        studentName,
                        fromClass,
                        toClass: entry.outcome === 'promoted' ? toClass : entry.outcome === 'repeated' ? fromClass : null,
                        outcome: entry.outcome,
                        fromYear,
                        toYear,
                        note: entry.note,
                    },
                }),
            );

            ops.push(...this.applyOutcome(entry, s, studentName, toClass, toYear));
        }

        await this.prisma.$transaction(ops);

        const result: PromotionResult = {
            fromClass,
            toClass: toClass ?? null,
            fromYear,
            toYear,
            ...counts,
            total: entries.length,
        };
        await this.audit.log({
            action: 'PROMOTION_RUN',
            entity: this.entity,
            entityId: `${fromClass}-${fromYear}`,
            after: result,
        });
        return result;
    }

    // The record-mutating half of a single pupil's outcome.
    private applyOutcome(
        entry: PromotionEntryDto,
        student: { id: string; email: string | null; phone: string | null },
        studentName: string,
        toClass: string | undefined,
        toYear: number,
    ) {
        switch (entry.outcome) {
            case 'promoted':
                return [
                    this.prisma.student.update({
                        where: { id: student.id },
                        data: { className: toClass },
                    }),
                ];
            case 'repeated':
                // Nothing to change: they stay in the same class. The
                // PromotionRecord is what makes the decision visible.
                return [];
            case 'transferred':
                return [
                    this.prisma.student.update({
                        where: { id: student.id },
                        data: { status: 'transferred' },
                    }),
                ];
            case 'graduated':
                return [
                    this.prisma.student.update({
                        where: { id: student.id },
                        data: { status: 'graduated' },
                    }),
                    this.prisma.alumnus.create({
                        data: {
                            fullName: studentName,
                            graduationYear: toYear,
                            email: student.email,
                            phone: student.phone,
                        },
                    }),
                ];
        }
    }
}
