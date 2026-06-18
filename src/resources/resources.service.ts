import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { BaseCrudService } from 'src/common/base-crud.service';

@Injectable()
export class ResourcesService extends BaseCrudService {
    protected delegate = this.prisma.resource;
    protected entity = 'Resource';
    protected searchFields = ['title', 'subject', 'type'];

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }
}
