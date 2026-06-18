import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { BaseCrudService } from 'src/common/base-crud.service';

@Injectable()
export class MessagesService extends BaseCrudService {
    protected delegate = this.prisma.message;
    protected entity = 'Message';
    protected searchFields = ['from', 'to', 'subject'];

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }
}
