import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { BaseCrudService, FilterSpec } from 'src/common/base-crud.service';

// Read-only view of the wallet ledger. Entries are only ever written by
// WalletsService; the controller exposes no create/update/delete for them.
@Injectable()
export class WalletTransactionsService extends BaseCrudService {
    protected delegate = this.prisma.walletTransaction;
    protected entity = 'WalletTransaction';
    protected searchFields = ['studentName', 'description', 'reference', 'recordedBy'];

    protected filterSpec: Record<string, FilterSpec> = {
        walletId: { field: 'walletId', op: 'equals' },
        studentId: { field: 'studentId', op: 'equals' },
        type: { field: 'type', op: 'equals' },
        method: { field: 'method', op: 'equals' },
        // `createdAt` is a real DateTime here, unlike the string date columns
        // elsewhere, so the day bounds are converted explicitly (Kampala, UTC+3).
        dateFrom: (value: string) => (/^\d{4}-\d{2}-\d{2}$/.test(value)
            ? { createdAt: { gte: new Date(`${value}T00:00:00+03:00`) } }
            : undefined),
        dateTo: (value: string) => (/^\d{4}-\d{2}-\d{2}$/.test(value)
            ? { createdAt: { lte: new Date(`${value}T23:59:59.999+03:00`) } }
            : undefined),
    };

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }

    /** Money in and out over the filtered rows, for the stat tiles. */
    protected async computeSummary(where: any) {
        const byType = await this.prisma.walletTransaction.groupBy({
            by: ['type'],
            where,
            _sum: { amount: true },
            _count: { _all: true },
        });
        const sum = (type: string) => Math.abs(byType.find((g) => g.type === type)?._sum.amount ?? 0);
        return {
            total: byType.reduce((n, g) => n + g._count._all, 0),
            deposits: sum('deposit'),
            purchases: sum('purchase'),
            withdrawals: sum('withdrawal'),
            // Net of reversals, signed: positive = money put back in.
            reversals: byType.find((g) => g.type === 'reversal')?._sum.amount ?? 0,
        };
    }

}
