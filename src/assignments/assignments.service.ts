import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { BaseCrudService } from 'src/common/base-crud.service';

@Injectable()
export class AssignmentsService extends BaseCrudService {
    protected delegate = this.prisma.assignment;
    protected entity = 'Assignment';
    protected searchFields = ['title', 'subject', 'className'];
    protected sessionScoped = true;

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }
}

@Injectable()
export class AssignmentSubmissionsService extends BaseCrudService {
    protected delegate = this.prisma.assignmentSubmission;
    protected entity = 'AssignmentSubmission';
    protected searchFields = ['studentName', 'assignmentId'];

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }
}
