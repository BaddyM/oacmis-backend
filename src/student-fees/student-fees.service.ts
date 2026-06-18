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
}
