import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { BaseCrudService } from 'src/common/base-crud.service';

@Injectable()
export class TransportService extends BaseCrudService {
    protected delegate = this.prisma.busRoute;
    protected entity = 'BusRoute';
    protected searchFields = ['routeName', 'busNumber', 'driverName'];

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }

    // Remove the route's student assignments before deleting the route itself.
    async remove(id: string) {
        await this.prisma.routeAssignment.deleteMany({ where: { routeId: id } });
        return super.remove(id);
    }
}
