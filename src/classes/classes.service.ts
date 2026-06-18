import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@Injectable()
export class ClassesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly auditService: AuditService,
    ) { }

    async create(dto: CreateClassDto) {
        const cls = await this.prisma.class.create({ data: dto });
        await this.auditService.log({
            action: 'CLASS_CREATED',
            entity: 'Class',
            entityId: cls.id,
            after: cls,
        });
        return cls;
    }

    async findAll(page = 1, limit = 50, search?: string) {
        const where: Prisma.ClassWhereInput = search
            ? {
                OR: [
                    { name: { contains: search } },
                    { teacher: { contains: search } },
                    { room: { contains: search } },
                ],
            }
            : {};

        const [data, total] = await this.prisma.$transaction([
            this.prisma.class.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.class.count({ where }),
        ]);

        return { data, total, totalPages: Math.ceil(total / limit) };
    }

    async findOne(id: string) {
        const cls = await this.prisma.class.findUnique({ where: { id } });
        if (!cls) throw new NotFoundException('Class not found');
        return cls;
    }

    async update(id: string, dto: UpdateClassDto) {
        const before = await this.findOne(id);
        const cls = await this.prisma.class.update({ where: { id }, data: dto });
        await this.auditService.log({
            action: 'CLASS_UPDATED',
            entity: 'Class',
            entityId: id,
            before,
            after: cls,
        });
        return cls;
    }

    async remove(id: string) {
        const before = await this.findOne(id);
        const cls = await this.prisma.class.delete({ where: { id } });
        await this.auditService.log({
            action: 'CLASS_DELETED',
            entity: 'Class',
            entityId: id,
            before,
        });
        return cls;
    }
}
