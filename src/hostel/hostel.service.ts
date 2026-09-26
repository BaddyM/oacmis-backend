import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { BaseCrudService, FilterSpec, SummarySpec } from 'src/common/base-crud.service';

@Injectable()
export class HostelService extends BaseCrudService {
    protected delegate = this.prisma.hostelRoom;
    protected entity = 'HostelRoom';
    protected searchFields = ['hostelName', 'roomNumber', 'warden'];

    protected filterSpec: Record<string, FilterSpec> = {
        hostelName: { field: 'hostelName', op: 'contains' },
        type: { field: 'type', op: 'equals' },
        gender: { field: 'gender', op: 'equals' },
        status: { field: 'status', op: 'equals' },
        warden: { field: 'warden', op: 'contains' },
    };

    protected summarySpec: Record<string, SummarySpec> = {
        totalRooms: { kind: 'count' },
        totalBeds: { kind: 'sum', field: 'capacity' },
        occupied: { kind: 'sum', field: 'occupied' },
        maintenance: { kind: 'countWhere', where: { status: 'maintenance' } },
    };

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }

    // Remove the room's student assignments before deleting the room itself.
    async remove(id: string) {
        await this.prisma.roomAssignment.deleteMany({ where: { roomId: id } });
        return super.remove(id);
    }
}
