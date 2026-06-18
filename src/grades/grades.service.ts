import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { BaseCrudService } from 'src/common/base-crud.service';

@Injectable()
export class GradesService extends BaseCrudService {
    protected delegate = this.prisma.gradeRecord;
    protected entity = 'GradeRecord';
    protected searchFields = ['student', 'className', 'subject'];

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }
}
