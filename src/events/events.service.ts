import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { BaseCrudService } from 'src/common/base-crud.service';

@Injectable()
export class EventsService extends BaseCrudService {
    protected delegate = this.prisma.event;
    protected entity = 'Event';
    protected searchFields = ['title', 'type', 'audience'];

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }
}
