import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { OwnedCrudService } from 'src/common/owned-crud.service';

@Injectable()
export class LeaveRequestsService extends OwnedCrudService {
    protected delegate = this.prisma.leaveRequest;
    protected entity = 'LeaveRequest';
    protected searchFields = ['employeeName', 'type', 'reason'];
    // Approving/rejecting is the admin's call — a requester may not set their
    // own status. New requests fall back to the schema default ("pending").
    protected privilegedFields = ['userId', 'status'];

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }
}
