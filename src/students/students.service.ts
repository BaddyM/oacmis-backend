import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { promises as fs } from 'fs';
import { resolve, sep } from 'path';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
    private readonly uploadsRoot = resolve(process.cwd(), 'uploads');

    // Best-effort delete of a previously-uploaded photo file. Only touches files
    // inside the uploads tree; ignores data URLs, external URLs and missing files.
    private async deleteUploadedFile(url?: string | null) {
        if (!url || !url.startsWith('/uploads/')) return;
        const path = resolve(process.cwd(), '.' + url);
        if (path !== this.uploadsRoot && !path.startsWith(this.uploadsRoot + sep)) return; // guard traversal
        try {
            await fs.unlink(path);
        } catch {
            /* already gone or not a file — ignore */
        }
    }

    constructor(
        private readonly prisma: PrismaService,
        private readonly auditService: AuditService,
    ) { }

    async create(dto: CreateStudentDto) {
        try {
            const data = {
                ...dto,
                // Admission number is optional on input — generate a unique one
                // when it isn't provided.
                admissionNo: dto.admissionNo?.trim() || `ADM-${Date.now()}`,
            };
            const student = await this.prisma.student.create({ data });
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
        // Generate an admission number for any row that omits one.
        const data = students.map((s, i) => ({
            ...s,
            admissionNo: s.admissionNo?.trim() || `ADM-${Date.now()}-${i}`,
        }));
        // skipDuplicates ignores rows whose unique admissionNo already exists.
        const result = await this.prisma.student.createMany({
            data,
            skipDuplicates: true,
        });
        await this.auditService.log({
            action: 'STUDENT_BULK_CREATED',
            entity: 'Student',
            after: { requested: students.length, created: result.count },
        });
        return { requested: students.length, created: result.count };
    }

    async findAll(page = 1, limit = 20, search?: string, className?: string, status?: string) {
        const where: Prisma.StudentWhereInput = {};
        if (search) {
            where.OR = [
                { firstName: { contains: search } },
                { lastName: { contains: search } },
                { admissionNo: { contains: search } },
                { className: { contains: search } },
                { stream: { contains: search } },
                { house: { contains: search } },
                { email: { contains: search } },
            ];
        }
        // Exact class match (used to load a class roster) — narrows server-side.
        if (className) where.className = className;
        // Opt-in only: callers that don't ask still see every pupil, so nothing
        // that predates the status field changes behaviour.
        if (status) where.status = status;

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
            // If the photo was replaced (or cleared), remove the old file from disk.
            const photoProvided = Object.prototype.hasOwnProperty.call(dto, 'passportPhoto');
            if (photoProvided && before.passportPhoto && before.passportPhoto !== dto.passportPhoto) {
                await this.deleteUploadedFile(before.passportPhoto);
            }
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
        // Clean up rows that reference this student by id (no DB-level FKs).
        await this.prisma.$transaction([
            this.prisma.routeAssignment.deleteMany({ where: { studentId: id } }),
            this.prisma.roomAssignment.deleteMany({ where: { studentId: id } }),
            this.prisma.feeRecord.deleteMany({ where: { studentId: id } }),
            this.prisma.feePayment.deleteMany({ where: { studentId: id } }),
            this.prisma.examMark.deleteMany({ where: { studentId: id } }),
        ]);
        const student = await this.prisma.student.delete({ where: { id } });
        // Remove the student's photo file so it doesn't linger on disk.
        await this.deleteUploadedFile(before.passportPhoto);
        await this.auditService.log({
            action: 'STUDENT_DELETED',
            entity: 'Student',
            entityId: id,
            before,
        });
        return student;
    }
}
