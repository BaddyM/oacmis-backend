import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { BaseCrudService, FilterSpec, SummarySpec } from 'src/common/base-crud.service';

// Read side of SmsLog — the per-message delivery register on Bulk Comms.
@Injectable()
export class SmsLogsService extends BaseCrudService {
    protected delegate = this.prisma.smsLog;
    protected entity = 'SmsLog';
    protected searchFields = ['phone', 'message'];

    protected filterSpec: Record<string, FilterSpec> = {
        status: { field: 'status', op: 'equals' },
        source: { field: 'source', op: 'equals' },
        sourceId: { field: 'sourceId', op: 'equals' },
    };

    protected summarySpec: Record<string, SummarySpec> = {
        total: { kind: 'count' },
        sent: { kind: 'countWhere', where: { status: 'sent' } },
        failed: { kind: 'countWhere', where: { status: 'failed' } },
        cost: { kind: 'sum', field: 'cost' },
    };

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }
}
