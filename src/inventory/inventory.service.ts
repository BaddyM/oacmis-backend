import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { BaseCrudService } from 'src/common/base-crud.service';

@Injectable()
export class InventoryService extends BaseCrudService {
    protected delegate = this.prisma.inventoryItem;
    protected entity = 'InventoryItem';
    protected searchFields = ['name', 'sku', 'supplier', 'category'];

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }
}
