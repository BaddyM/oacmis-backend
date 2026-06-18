import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Injectable()
export class SubjectsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly auditService: AuditService,
    ) { }

    async create(dto: CreateSubjectDto) {
        const subject = await this.prisma.subject.create({ data: dto });
        await this.auditService.log({
            action: 'SUBJECT_CREATED',
            entity: 'Subject',
            entityId: subject.id,
            after: subject,
        });
        return subject;
    }

    async findAll(page = 1, limit = 200, search?: string) {
        const where: Prisma.SubjectWhereInput = search
            ? {
                OR: [
                    { name: { contains: search } },
                    { code: { contains: search } },
                ],
            }
            : {};

        const [data, total] = await this.prisma.$transaction([
            this.prisma.subject.findMany({
                where,
                orderBy: { name: 'asc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.subject.count({ where }),
        ]);

        return { data, total, totalPages: Math.ceil(total / limit) };
    }

    async findOne(id: string) {
        const subject = await this.prisma.subject.findUnique({ where: { id } });
        if (!subject) throw new NotFoundException('Subject not found');
        return subject;
    }

    async update(id: string, dto: UpdateSubjectDto) {
        const before = await this.findOne(id);
        const subject = await this.prisma.subject.update({ where: { id }, data: dto });
        await this.auditService.log({
            action: 'SUBJECT_UPDATED',
            entity: 'Subject',
            entityId: id,
            before,
            after: subject,
        });
        return subject;
    }

    async remove(id: string) {
        const before = await this.findOne(id);
        const subject = await this.prisma.subject.delete({ where: { id } });
        await this.auditService.log({
            action: 'SUBJECT_DELETED',
            entity: 'Subject',
            entityId: id,
            before,
        });
        return subject;
    }
}
