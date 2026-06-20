import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { BaseCrudService } from 'src/common/base-crud.service';

@Injectable()
export class FeePaymentsService extends BaseCrudService {
    protected delegate = this.prisma.feePayment;
    protected entity = 'FeePayment';
    protected searchFields = ['studentName', 'invoiceRef', 'method'];

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }

    // One student's payment history (indexed) — for per-student receipts.
    async findByStudent(studentId: string) {
        const data = await this.prisma.feePayment.findMany({
            where: { studentId },
            orderBy: { createdAt: 'desc' },
        });
        return { data, total: data.length, totalPages: 1 };
    }
}
