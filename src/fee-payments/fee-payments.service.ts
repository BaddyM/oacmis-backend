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
}
