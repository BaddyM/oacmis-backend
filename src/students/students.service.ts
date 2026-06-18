import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly auditService: AuditService,
    ) { }

    async create(dto: CreateStudentDto) {
        try {
            const student = await this.prisma.student.create({ data: dto });
            await this.auditService.log({
                action: 'STUDENT_CREATED',
                entity: 'Student',
                entityId: student.id,
                after: student,
            });
            return student;
        } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
                throw new BadRequestException('A student with this admission number already exists');
            }
            throw e;
        }
    }

    async bulkCreate(students: CreateStudentDto[]) {
        // skipDuplicates ignores rows whose unique admissionNo already exists.
        const result = await this.prisma.student.createMany({
            data: students,
            skipDuplicates: true,
        });
        await this.auditService.log({
            action: 'STUDENT_BULK_CREATED',
            entity: 'Student',
            after: { requested: students.length, created: result.count },
        });
        return { requested: students.length, created: result.count };
    }

    async findAll(page = 1, limit = 20, search?: string) {
        const where: Prisma.StudentWhereInput = search
            ? {
                OR: [
                    { firstName: { contains: search } },
                    { lastName: { contains: search } },
                    { admissionNo: { contains: search } },
                    { className: { contains: search } },
                    { stream: { contains: search } },
                    { house: { contains: search } },
                    { email: { contains: search } },
                ],
            }
            : {};

        const [data, total] = await this.prisma.$transaction([
            this.prisma.student.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.student.count({ where }),
        ]);

        return { data, total, totalPages: Math.ceil(total / limit) };
    }

    async findOne(id: string) {
        const student = await this.prisma.student.findUnique({ where: { id } });
        if (!student) throw new NotFoundException('Student not found');
        return student;
    }

    async update(id: string, dto: UpdateStudentDto) {
        const before = await this.findOne(id);
        try {
            const student = await this.prisma.student.update({ where: { id }, data: dto });
            await this.auditService.log({
                action: 'STUDENT_UPDATED',
                entity: 'Student',
                entityId: id,
                before,
                after: student,
            });
            return student;
        } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
                throw new BadRequestException('A student with this admission number already exists');
            }
            throw e;
        }
    }

    async remove(id: string) {
        const before = await this.findOne(id);
        const student = await this.prisma.student.delete({ where: { id } });
        await this.auditService.log({
            action: 'STUDENT_DELETED',
            entity: 'Student',
            entityId: id,
            before,
        });
        return student;
    }
}
