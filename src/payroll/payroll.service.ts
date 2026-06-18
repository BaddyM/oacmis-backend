import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { BaseCrudService } from 'src/common/base-crud.service';

@Injectable()
export class PayrollService extends BaseCrudService {
    protected delegate = this.prisma.payrollRecord;
    protected entity = 'PayrollRecord';
    protected searchFields = ['name', 'employeeId', 'department', 'position'];

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }
}
