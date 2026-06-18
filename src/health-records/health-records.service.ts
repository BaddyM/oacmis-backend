import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { BaseCrudService } from 'src/common/base-crud.service';

@Injectable()
export class HealthRecordsService extends BaseCrudService {
    protected delegate = this.prisma.healthRecord;
    protected entity = 'HealthRecord';
    protected searchFields = ['studentName', 'bloodType', 'emergencyContact'];

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }
}
