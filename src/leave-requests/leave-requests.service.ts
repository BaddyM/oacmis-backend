import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { BaseCrudService } from 'src/common/base-crud.service';

@Injectable()
export class LeaveRequestsService extends BaseCrudService {
    protected delegate = this.prisma.leaveRequest;
    protected entity = 'LeaveRequest';
    protected searchFields = ['employeeName', 'type', 'reason'];

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }
}
