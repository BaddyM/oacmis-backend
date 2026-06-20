import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { BaseCrudService } from 'src/common/base-crud.service';

@Injectable()
export class RoomAssignmentsService extends BaseCrudService {
    protected delegate = this.prisma.roomAssignment;
    protected entity = 'RoomAssignment';
    protected searchFields = ['studentName', 'className'];

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }

    // Students assigned to one hostel room (indexed) — used by the manage UI.
    async findByRoom(roomId: string) {
        const data = await this.prisma.roomAssignment.findMany({
            where: { roomId },
            orderBy: { studentName: 'asc' },
        });
        return { data, total: data.length, totalPages: 1 };
    }
}
