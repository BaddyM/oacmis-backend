import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { BaseCrudService } from 'src/common/base-crud.service';

@Injectable()
export class RouteAssignmentsService extends BaseCrudService {
    protected delegate = this.prisma.routeAssignment;
    protected entity = 'RouteAssignment';
    protected searchFields = ['studentName', 'className'];

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }

    // Students attached to one route (indexed) — used by the manage-students UI.
    async findByRoute(routeId: string) {
        const data = await this.prisma.routeAssignment.findMany({
            where: { routeId },
            orderBy: { studentName: 'asc' },
        });
        return { data, total: data.length, totalPages: 1 };
    }
}
