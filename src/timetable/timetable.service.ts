import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { CreateTimetableEntryDto } from './dto/create-timetable-entry.dto';
import { UpdateTimetableEntryDto } from './dto/update-timetable-entry.dto';

@Injectable()
export class TimetableService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly auditService: AuditService,
    ) { }

    async create(dto: CreateTimetableEntryDto) {
        const entry = await this.prisma.timetableEntry.create({ data: dto });
        await this.auditService.log({
            action: 'TIMETABLE_ENTRY_CREATED',
            entity: 'TimetableEntry',
            entityId: entry.id,
            after: entry,
        });
        return entry;
    }

    async findAll(page = 1, limit = 500, className?: string, teacher?: string) {
        const where: Prisma.TimetableEntryWhereInput = {
            ...(className ? { className } : {}),
            ...(teacher ? { teacher: { contains: teacher } } : {}),
        };

        const [data, total] = await this.prisma.$transaction([
            this.prisma.timetableEntry.findMany({
                where,
                orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.timetableEntry.count({ where }),
        ]);

        return { data, total, totalPages: Math.ceil(total / limit) };
    }

    async findOne(id: string) {
        const entry = await this.prisma.timetableEntry.findUnique({ where: { id } });
        if (!entry) throw new NotFoundException('Timetable entry not found');
        return entry;
    }

    async update(id: string, dto: UpdateTimetableEntryDto) {
        const before = await this.findOne(id);
        const entry = await this.prisma.timetableEntry.update({ where: { id }, data: dto });
        await this.auditService.log({
            action: 'TIMETABLE_ENTRY_UPDATED',
            entity: 'TimetableEntry',
            entityId: id,
            before,
            after: entry,
        });
        return entry;
    }

    async remove(id: string) {
        const before = await this.findOne(id);
        const entry = await this.prisma.timetableEntry.delete({ where: { id } });
        await this.auditService.log({
            action: 'TIMETABLE_ENTRY_DELETED',
            entity: 'TimetableEntry',
            entityId: id,
            before,
        });
        return entry;
    }
}
