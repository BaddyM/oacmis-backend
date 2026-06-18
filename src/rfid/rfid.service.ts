import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { BaseCrudService } from 'src/common/base-crud.service';

@Injectable()
export class RfidDevicesService extends BaseCrudService {
    protected delegate = this.prisma.rFIDDevice;
    protected entity = 'RFIDDevice';
    protected searchFields = ['name', 'location', 'status'];

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }
}

@Injectable()
export class RfidRecordsService extends BaseCrudService {
    protected delegate = this.prisma.rFIDAttendanceRecord;
    protected entity = 'RFIDAttendanceRecord';
    protected searchFields = ['studentName', 'studentId', 'rfidTag'];

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }
}
