import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { BaseCrudService } from 'src/common/base-crud.service';

@Injectable()
export class DisciplineService extends BaseCrudService {
    protected delegate = this.prisma.disciplineIncident;
    protected entity = 'DisciplineIncident';
    protected searchFields = ['studentName', 'type', 'action'];

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }
}
