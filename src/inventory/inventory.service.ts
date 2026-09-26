import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { BaseCrudService, FilterSpec, SummarySpec } from 'src/common/base-crud.service';

@Injectable()
export class InventoryService extends BaseCrudService {
    protected delegate = this.prisma.inventoryItem;
    protected entity = 'InventoryItem';
    protected searchFields = ['name', 'sku', 'supplier', 'category'];

    // Stock status is *derived* from quantity vs minStock rather than read from
    // the `status` column: that column is written once on create and never
    // recomputed when quantity changes, so it goes stale (the demo seed stamps
    // every row 'in-stock' regardless of quantity). The page derives the same
    // three states for display, and these fragments keep filtering and the stat
    // tiles agreeing with it.
    //
    // `low-stock`/`in-stock` compare two columns, which needs a Prisma field
    // reference — a plain `{ lte: 'minStock' }` would compare against the
    // literal string. Field references hang off the client delegate, so these
    // have to be instance members rather than module constants.
    private readonly outOfStock: Prisma.InventoryItemWhereInput = { quantity: { lte: 0 } };
    private readonly lowStock: Prisma.InventoryItemWhereInput = {
        quantity: { gt: 0, lte: this.prisma.inventoryItem.fields.minStock },
    };
    private readonly inStock: Prisma.InventoryItemWhereInput = {
        quantity: { gt: this.prisma.inventoryItem.fields.minStock },
    };

    protected filterSpec: Record<string, FilterSpec> = {
        category: { field: 'category', op: 'equals' },
        supplier: { field: 'supplier', op: 'contains' },
        location: { field: 'location', op: 'contains' },
        minQty: { field: 'quantity', op: 'gte' },
        maxQty: { field: 'quantity', op: 'lte' },
        // Unknown status value -> undefined -> filter dropped.
        status: (value: string) =>
            ({
                'out-of-stock': this.outOfStock,
                'low-stock': this.lowStock,
                'in-stock': this.inStock,
            })[value],
    };

    protected summarySpec: Record<string, SummarySpec> = {
        total: { kind: 'count' },
        value: { kind: 'sumProduct', fields: ['quantity', 'unitPrice'] },
        low: { kind: 'countWhere', where: this.lowStock },
        out: { kind: 'countWhere', where: this.outOfStock },
    };

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }
}
