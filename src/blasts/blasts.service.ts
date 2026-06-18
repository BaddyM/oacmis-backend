import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { BaseCrudService } from 'src/common/base-crud.service';

@Injectable()
export class BlastsService extends BaseCrudService {
    protected delegate = this.prisma.blast;
    protected entity = 'Blast';
    protected searchFields = ['channel', 'audience', 'subject'];

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }
}
