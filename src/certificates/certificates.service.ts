import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { BaseCrudService, FilterSpec, SummarySpec } from 'src/common/base-crud.service';

@Injectable()
export class CertificatesService extends BaseCrudService {
    protected delegate = this.prisma.certificate;
    protected entity = 'Certificate';
    protected searchFields = ['studentName', 'studentId', 'certificateType'];

    // issuedDate is an ISO `YYYY-MM-DD` string column, so the from/to range
    // compares as text rather than as a number.
    protected filterSpec: Record<string, FilterSpec> = {
        certificateType: { field: 'certificateType', op: 'contains' },
        studentName: { field: 'studentName', op: 'contains' },
        fromDate: { field: 'issuedDate', op: 'gte', numeric: false },
        toDate: { field: 'issuedDate', op: 'lte', numeric: false },
    };

    protected summarySpec: Record<string, SummarySpec> = {
        total: { kind: 'count' },
    };

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }
}
