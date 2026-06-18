import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { BaseCrudService } from 'src/common/base-crud.service';

@Injectable()
export class AdmissionsService extends BaseCrudService {
    protected delegate = this.prisma.admission;
    protected entity = 'Admission';
    protected searchFields = ['applicantName', 'parentName', 'gradeApplied'];

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }
}
