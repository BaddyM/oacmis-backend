import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { BaseCrudService } from 'src/common/base-crud.service';

@Injectable()
export class StudentFeesService extends BaseCrudService {
    protected delegate = this.prisma.feeRecord;
    protected entity = 'FeeRecord';
    protected searchFields = ['studentName', 'feeType', 'class'];
    protected sessionScoped = true;

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }

    // Precise, indexed lookup of one student's fee records — used by the
    // payment flow so it never has to load the whole fee table.
    async findByStudent(studentId: string) {
        return this.findFiltered({ studentId });
    }

    // Narrow fee records server-side by student, class and/or term. Used by the
    // payment flow and the class fee-assignment carry-forward.
    async findFiltered(filter: { studentId?: string; className?: string; term?: string; year?: number }) {
        const where: any = {};
        if (filter.studentId) where.studentId = filter.studentId;
        if (filter.className) where.class = filter.className;
        if (filter.term) where.term = filter.term;
        if (filter.year) where.year = filter.year;
        const data = await this.prisma.feeRecord.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
        return { data, total: data.length, totalPages: 1 };
    }

    // Paginated browse list with optional text search, class, status and
    // academic session (term + year) filters.
    async browse(
        page = 1,
        limit = 20,
        search?: string,
        status?: string,
        className?: string,
        term?: string,
        year?: number,
    ) {
        const where = this.scopeWhere(term, year, className);
        if (search) where.OR = this.searchFields.map((f) => ({ [f]: { contains: search } }));
        if (status) where.status = status;
        const [data, total] = await this.prisma.$transaction([
            this.prisma.feeRecord.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
            this.prisma.feeRecord.count({ where }),
        ]);
        return { data, total, totalPages: Math.ceil(total / limit) };
    }

    // The scope the list and its totals share: which pupils' fees we are
    // looking at. Both halves of the session are required — filtering on term
    // alone would mix Term 1 of every year together.
    private scopeWhere(term?: string, year?: number, className?: string): any {
        const where: any = term && year ? { term, year } : {};
        if (className) where.class = className;
        return where;
    }

    /**
     * Collection totals over every record in scope, independent of pagination.
     *
     * Takes the same term/year/class scope as the list, so the cards always
     * describe the rows on screen. It deliberately does NOT take `status`: the
     * cards *are* the breakdown by status, so filtering the table to "paid"
     * would report 100% collected, nothing pending and nothing overdue — true
     * of the filtered rows, and useless. Search is excluded for the same
     * reason: it narrows within the scope rather than defining it.
     */
    async summary(term?: string, year?: number, className?: string) {
        const scope = this.scopeWhere(term, year, className);
        const [all, overdue] = await this.prisma.$transaction([
            this.prisma.feeRecord.aggregate({ where: scope, _sum: { amount: true, paidAmount: true } }),
            this.prisma.feeRecord.aggregate({ where: { ...scope, status: 'overdue' }, _sum: { amount: true, paidAmount: true } }),
        ]);
        const expected = all._sum.amount || 0;
        const collected = all._sum.paidAmount || 0;
        const overdueOutstanding = Math.max(0, (overdue._sum.amount || 0) - (overdue._sum.paidAmount || 0));
        const pending = Math.max(0, expected - collected - overdueOutstanding);
        const rate = expected > 0 ? Math.round((collected / expected) * 1000) / 10 : 0;
        return { collected, pending, overdue: overdueOutstanding, rate };
    }
}
