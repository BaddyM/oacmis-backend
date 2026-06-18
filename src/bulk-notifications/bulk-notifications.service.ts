import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { BaseCrudService } from 'src/common/base-crud.service';

@Injectable()
export class BulkNotificationsService extends BaseCrudService {
    protected delegate = this.prisma.bulkNotification;
    protected entity = 'BulkNotification';
    protected searchFields = ['title', 'message', 'recipients'];

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }
}
