import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { BaseCrudService, FilterSpec, SummarySpec } from 'src/common/base-crud.service';

@Injectable()
export class TransportService extends BaseCrudService {
    protected delegate = this.prisma.busRoute;
    protected entity = 'BusRoute';
    protected searchFields = ['routeName', 'busNumber', 'driverName'];

    protected filterSpec: Record<string, FilterSpec> = {
        status: { field: 'status', op: 'equals' },
        driverName: { field: 'driverName', op: 'contains' },
        minCapacity: { field: 'capacity', op: 'gte' },
    };

    // The page derives its "utilization" tile from studentsTransported /
    // totalCapacity, so that ratio isn't computed here.
    protected summarySpec: Record<string, SummarySpec> = {
        buses: { kind: 'distinct', field: 'busNumber' },
        active: { kind: 'countWhere', where: { status: 'active' } },
        studentsTransported: { kind: 'sum', field: 'studentsCount' },
        totalCapacity: { kind: 'sum', field: 'capacity' },
    };

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }

    // Remove the route's student assignments before deleting the route itself.
    async remove(id: string) {
        await this.prisma.routeAssignment.deleteMany({ where: { routeId: id } });
        return super.remove(id);
    }
}
