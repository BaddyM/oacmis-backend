import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { BaseCrudService } from 'src/common/base-crud.service';

@Injectable()
export class HostelService extends BaseCrudService {
    protected delegate = this.prisma.hostelRoom;
    protected entity = 'HostelRoom';
    protected searchFields = ['hostelName', 'roomNumber', 'warden'];

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }
}
