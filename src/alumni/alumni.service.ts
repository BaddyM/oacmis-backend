import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { BaseCrudService } from 'src/common/base-crud.service';

@Injectable()
export class AlumniService extends BaseCrudService {
    protected delegate = this.prisma.alumnus;
    protected entity = 'Alumnus';
    protected searchFields = ['fullName', 'occupation', 'email'];

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }
}
