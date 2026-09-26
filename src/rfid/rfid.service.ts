import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { BaseCrudService, FilterSpec, SummarySpec } from 'src/common/base-crud.service';

@Injectable()
export class RfidDevicesService extends BaseCrudService {
    protected delegate = this.prisma.rFIDDevice;
    protected entity = 'RFIDDevice';
    protected searchFields = ['name', 'location', 'status'];

    protected filterSpec: Record<string, FilterSpec> = {
        status: { field: 'status', op: 'equals' },
        location: { field: 'location', op: 'contains' },
    };

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }
}

@Injectable()
export class RfidRecordsService extends BaseCrudService {
    protected delegate = this.prisma.rFIDAttendanceRecord;
    protected entity = 'RFIDAttendanceRecord';
    protected searchFields = ['studentName', 'studentId', 'rfidTag'];

    protected filterSpec: Record<string, FilterSpec> = {
        studentName: { field: 'studentName', op: 'contains' },
        studentId: { field: 'studentId', op: 'contains' },
        rfidTag: { field: 'rfidTag', op: 'contains' },
        status: { field: 'status', op: 'equals' },
        scannedBy: { field: 'scannedBy', op: 'contains' },
        // `timestamp` is an ISO datetime string, so a whole-day match is a
        // prefix match on the date part.
        date: (value: string) => ({ timestamp: { startsWith: value } }),
    };

    protected summarySpec: Record<string, SummarySpec> = {
        total: { kind: 'count' },
        present: { kind: 'countWhere', where: { status: 'present' } },
        late: { kind: 'countWhere', where: { status: 'late' } },
    };

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }
}
