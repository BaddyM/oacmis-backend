import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { BaseCrudService } from 'src/common/base-crud.service';

@Injectable()
export class ExamAssignmentsService extends BaseCrudService {
    protected delegate = this.prisma.examAssignment;
    protected entity = 'ExamAssignment';
    protected searchFields = ['className', 'subject', 'teacherEmail'];

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }
}
