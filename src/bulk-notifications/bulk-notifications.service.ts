import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { BaseCrudService, FilterSpec, SummarySpec } from 'src/common/base-crud.service';

@Injectable()
export class BulkNotificationsService extends BaseCrudService {
    protected delegate = this.prisma.bulkNotification;
    protected entity = 'BulkNotification';
    protected searchFields = ['title', 'message', 'recipients'];

    protected filterSpec: Record<string, FilterSpec> = {
        type: { field: 'type', op: 'equals' },
        status: { field: 'status', op: 'equals' },
        recipients: { field: 'recipients', op: 'contains' },
        sentDate: { field: 'sentDate', op: 'equals' },
    };

    protected summarySpec: Record<string, SummarySpec> = {
        total: { kind: 'count' },
        sms: { kind: 'countWhere', where: { type: 'sms', status: 'sent' } },
        email: { kind: 'countWhere', where: { type: 'email', status: 'sent' } },
        totalRecipients: { kind: 'sum', field: 'recipientCount' },
        scheduled: { kind: 'countWhere', where: { status: 'scheduled' } },
    };

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }
}
