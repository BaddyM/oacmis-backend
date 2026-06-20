import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { BaseCrudService } from 'src/common/base-crud.service';

@Injectable()
export class StudentFeesService extends BaseCrudService {
    protected delegate = this.prisma.feeRecord;
    protected entity = 'FeeRecord';
    protected searchFields = ['studentName', 'feeType', 'class'];

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
    async findFiltered(filter: { studentId?: string; className?: string; term?: string }) {
        const where: any = {};
        if (filter.studentId) where.studentId = filter.studentId;
        if (filter.className) where.class = filter.className;
        if (filter.term) where.term = filter.term;
        const data = await this.prisma.feeRecord.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
        return { data, total: data.length, totalPages: 1 };
    }

    // Paginated browse list with optional text search and status filter.
    async browse(page = 1, limit = 20, search?: string, status?: string) {
        const where: any = {};
        if (search) where.OR = this.searchFields.map((f) => ({ [f]: { contains: search } }));
        if (status) where.status = status;
        const [data, total] = await this.prisma.$transaction([
            this.prisma.feeRecord.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
            this.prisma.feeRecord.count({ where }),
        ]);
        return { data, total, totalPages: Math.ceil(total / limit) };
    }

    // Accurate collection totals across ALL records (independent of pagination).
    async summary() {
        const [all, overdue] = await this.prisma.$transaction([
            this.prisma.feeRecord.aggregate({ _sum: { amount: true, paidAmount: true } }),
            this.prisma.feeRecord.aggregate({ where: { status: 'overdue' }, _sum: { amount: true, paidAmount: true } }),
        ]);
        const expected = all._sum.amount || 0;
        const collected = all._sum.paidAmount || 0;
        const overdueOutstanding = Math.max(0, (overdue._sum.amount || 0) - (overdue._sum.paidAmount || 0));
        const pending = Math.max(0, expected - collected - overdueOutstanding);
        const rate = expected > 0 ? Math.round((collected / expected) * 1000) / 10 : 0;
        return { collected, pending, overdue: overdueOutstanding, rate };
    }
}
