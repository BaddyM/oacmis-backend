import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { BaseCrudService } from 'src/common/base-crud.service';

@Injectable()
export class CertificatesService extends BaseCrudService {
    protected delegate = this.prisma.certificate;
    protected entity = 'Certificate';
    protected searchFields = ['studentName', 'studentId', 'certificateType'];

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }
}
