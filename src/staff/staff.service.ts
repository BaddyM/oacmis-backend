import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

// Prisma's Json input type rejects `undefined`; normalise to Prisma.JsonNull.
const toJson = (value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull =>
    value === undefined || value === null ? Prisma.JsonNull : (value as Prisma.InputJsonValue);

@Injectable()
export class StaffService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly auditService: AuditService,
    ) { }

    async create(dto: CreateStaffDto) {
        try {
            const staff = await this.prisma.staff.create({
                data: { ...dto, socials: toJson(dto.socials) },
            });
            await this.auditService.log({
                action: 'STAFF_CREATED',
                entity: 'Staff',
                entityId: staff.id,
                after: staff,
            });
            return staff;
        } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
                throw new BadRequestException('A staff member with this email already exists');
            }
            throw e;
        }
    }

    async findAll(page = 1, limit = 20, search?: string) {
        const where: Prisma.StaffWhereInput = search
            ? {
                OR: [
                    { firstName: { contains: search } },
                    { lastName: { contains: search } },
                    { email: { contains: search } },
                    { role: { contains: search } },
                ],
            }
            : {};

        const [data, total] = await this.prisma.$transaction([
            this.prisma.staff.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.staff.count({ where }),
        ]);

        return { data, total, totalPages: Math.ceil(total / limit) };
    }

    async findOne(id: string) {
        const staff = await this.prisma.staff.findUnique({ where: { id } });
        if (!staff) throw new NotFoundException('Staff member not found');
        return staff;
    }

    async update(id: string, dto: UpdateStaffDto) {
        const before = await this.findOne(id);
        const { socials, ...rest } = dto;
        try {
            const staff = await this.prisma.staff.update({
                where: { id },
                data: { ...rest, ...(socials !== undefined ? { socials: toJson(socials) } : {}) },
            });
            await this.auditService.log({
                action: 'STAFF_UPDATED',
                entity: 'Staff',
                entityId: id,
                before,
                after: staff,
            });
            return staff;
        } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
                throw new BadRequestException('A staff member with this email already exists');
            }
            throw e;
        }
    }

    async remove(id: string) {
        const before = await this.findOne(id);
        const staff = await this.prisma.staff.delete({ where: { id } });
        await this.auditService.log({
            action: 'STAFF_DELETED',
            entity: 'Staff',
            entityId: id,
            before,
        });
        return staff;
    }
}
