import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FeeSummary, StudentBalanceService } from 'src/common/student-balance.service';

export type { FeeSummary };

/**
 * Everything a signed-in pupil can read about themselves. Every method is
 * scoped by the caller's own id, so these routes need no page permission —
 * there is no parameter that could point at somebody else's record.
 *
 * Balances come from StudentBalanceService, the same source FeesClearedGuard
 * uses, so what a pupil is told they owe and what they are locked out of can
 * never disagree.
 */
@Injectable()
export class StudentSelfService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly balances: StudentBalanceService,
    ) { }

    async resolveStudent(userId: string) {
        const student = await this.balances.resolveStudent(userId);
        if (!student) throw new NotFoundException('No pupil record is linked to this account');
        return student;
    }

    /** Read-only fee statement: what was billed, what was paid, what is left. */
    async fees(userId: string) {
        const student = await this.resolveStudent(userId);
        const name = `${student.firstName} ${student.lastName}`.trim();
        const records = await this.prisma.feeRecord.findMany({
            where: this.balances.feeWhere(student.id, name),
            orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
        });
        return { summary: this.balances.summarise(records), records };
    }

    /**
     * Results, released only when the pupil owes nothing.
     *
     * Returns a normal 200 with `blocked: true` and an empty result set rather
     * than an error, so the portal can explain *why* results are withheld and
     * show the balance. The marks themselves are never loaded when blocked.
     */
    async results(userId: string) {
        const student = await this.resolveStudent(userId);
        const name = `${student.firstName} ${student.lastName}`.trim();
        const summary = await this.balances.summaryForStudent(student.id, name);

        if (!summary.cleared) {
            return { blocked: true, summary, examMarks: [], gradeRecords: [] };
        }

        const [examMarks, gradeRecords] = await this.prisma.$transaction([
            this.prisma.examMark.findMany({
                where: { studentId: student.id },
                orderBy: [{ year: 'desc' }, { term: 'asc' }, { subject: 'asc' }],
            }),
            // Grade records are keyed by the pupil's name, not their id.
            this.prisma.gradeRecord.findMany({
                where: { student: name },
                orderBy: [{ year: 'desc' }, { subject: 'asc' }],
            }),
        ]);

        return { blocked: false, summary, examMarks, gradeRecords };
    }

    /** Guard used by any future write path a pupil might reach. */
    assertCleared(summary: FeeSummary) {
        if (!summary.cleared) {
            throw new ForbiddenException('This section is on hold until your fee balance is cleared');
        }
    }
}
