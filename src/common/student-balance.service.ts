import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

export interface FeeSummary {
    billed: number;
    paid: number;
    outstanding: number;
    /** True when nothing is owed — the condition for releasing gated sections. */
    cleared: boolean;
}

/**
 * One place that answers "what does this pupil owe?".
 *
 * Shared by the pupil's own fee statement, their results, and FeesClearedGuard.
 * Keeping a single implementation matters here: if the guard and the statement
 * ever disagreed, a pupil would be told they owe nothing while being locked out
 * of their work — or the reverse.
 */
@Injectable()
export class StudentBalanceService {
    constructor(private readonly prisma: PrismaService) { }

    /** Fee rows belonging to a pupil, by id where set and by name otherwise. */
    feeWhere(studentId: string, studentName: string): Prisma.FeeRecordWhereInput {
        return {
            OR: [
                { studentId },
                // Rows entered before fee records carried a studentId.
                { studentId: null, studentName },
            ],
        };
    }

    summarise(records: { amount: number; paidAmount: number | null }[]): FeeSummary {
        const billed = records.reduce((sum, r) => sum + (r.amount || 0), 0);
        const paid = records.reduce((sum, r) => sum + (r.paidAmount || 0), 0);
        // Per record, so an overpayment on one bill cannot mask a debt on another.
        const outstanding = records.reduce(
            (sum, r) => sum + Math.max(0, (r.amount || 0) - (r.paidAmount || 0)),
            0,
        );
        return {
            billed,
            paid,
            outstanding,
            // Rounded to the cent so floating-point dust never withholds anything.
            cleared: Math.round(outstanding * 100) / 100 <= 0,
        };
    }

    /**
     * The pupil record behind a login. Auto-provisioned accounts carry an
     * explicit link; accounts made by hand before that existed are matched on
     * email so they keep working. Returns null when the login is not a pupil.
     */
    async resolveStudent(userId: string) {
        const account = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { studentId: true, email: true },
        });
        if (!account) return null;

        if (account.studentId) {
            const linked = await this.prisma.student.findUnique({ where: { id: account.studentId } });
            if (linked) return linked;
        }
        if (account.email) {
            return this.prisma.student.findFirst({ where: { email: account.email } });
        }
        return null;
    }

    async summaryForStudent(studentId: string, studentName: string): Promise<FeeSummary> {
        const records = await this.prisma.feeRecord.findMany({
            where: this.feeWhere(studentId, studentName),
            select: { amount: true, paidAmount: true },
        });
        return this.summarise(records);
    }

    /**
     * Balance for a login. Null when the account is not linked to a pupil —
     * staff, or a student-role login with no pupil record — which callers treat
     * as "nothing to gate on" rather than "owes money".
     */
    async forUser(userId: string) {
        const student = await this.resolveStudent(userId);
        if (!student) return null;
        const name = `${student.firstName} ${student.lastName}`.trim();
        return { student, name, summary: await this.summaryForStudent(student.id, name) };
    }
}
