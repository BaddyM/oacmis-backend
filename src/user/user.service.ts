import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
const bcrypt = require("bcryptjs");

const userSelect = {
    id: true,
    name: true,
    email: true,
    isActive: true,
    role: true,
    createdAt: true,
    updatedAt: true,
} as const;

@Injectable()
export class UserService {
    constructor(
        private prisma: PrismaService,
        private readonly auditService: AuditService,
    ) { }

    // Enforce the admin-configured password policy (Settings → Security).
    private async validatePassword(raw: string) {
        const pw = `${raw ?? ''}`;
        const row = await this.prisma.appSetting.findUnique({ where: { key: 'security_settings' } });
        const policy = (row?.value as any)?.passwordPolicy as string | undefined;
        if (policy?.includes('Maximum')) {
            if (pw.length < 16 || !/[a-z]/.test(pw) || !/[A-Z]/.test(pw) || !/[0-9]/.test(pw) || !/[^A-Za-z0-9]/.test(pw)) {
                throw new BadRequestException('Password must be at least 16 characters and include uppercase, lowercase, a number and a symbol.');
            }
        } else if (policy?.includes('Strong')) {
            if (pw.length < 12 || !/[0-9]/.test(pw) || !/[^A-Za-z0-9]/.test(pw)) {
                throw new BadRequestException('Password must be at least 12 characters and include a number and a symbol.');
            }
        } else if (pw.length < 8) {
            throw new BadRequestException('Password must be at least 8 characters.');
        }
    }

    async create(createUserDto: CreateUserDto) {
        await this.validatePassword(createUserDto.password);
        const password = await bcrypt.hash(`${createUserDto.password}`, 10);

        const data = await this.prisma.user.create({
            data: {
                ...createUserDto,
                password,
            },
            select: userSelect,
        });

        await this.auditService.log({
            action: 'USER_CREATED',
            entity: 'User',
            entityId: data.id,
            after: data,
        });

        return data;
    }

    async validateUser(email: string, password: string) {
        const getPassword = await this.prisma.user.findUnique({
            where: {
                email: email
            }
        });
        const checkPassword: boolean = await bcrypt.compare(`${password}`, getPassword!.password);
        return checkPassword;
    }

    async loginAccess(page: number, limit: number) {
        const data = await this.prisma.loginAccess.findMany({
            select: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    }
                },
                createdAt: true,
                updatedAt: true,
            },
            orderBy: {
                createdAt: "desc"
            },
            skip: (page - 1) * limit,
            take: limit,
        });
        return data;
    }

    async findAll(page: number, limit: number, role?: string) {
        let filter = {}

        if (role != "" && role != undefined && role != "undefined" && role != null && role != "none") {
            (filter as any).role = role;
        }

        const data = await this.prisma.user.findMany({
            select: userSelect,
            where: {
                ...filter
            },
            orderBy: {
                createdAt: "desc"
            },
            skip: (page - 1) * limit,
            take: limit,
        });
        const total = await this.prisma.user.count({ where: { ...filter } });
        const totalPages = Math.ceil(total / limit);
        return { data, total, totalPages };
    }

    async findOne(userId: string) {
        const data = await this.prisma.user.findFirst({
            where: {
                id: userId,
            },
            select: userSelect,
        });
        return data;
    }

    async update(userId: string, updateUserDto: UpdateUserDto) {
        // 1. Destructure the password out of the DTO
        const { password, ...otherData } = updateUserDto;

        // 2. Prepare the update data object
        const updateData: any = { ...otherData };

        // 3. Conditionally validate, hash and add the password if it exists
        if (password) {
            await this.validatePassword(password);
            updateData.password = await bcrypt.hash(`${password}`, 10);
        }

        const before = await this.prisma.user.findUnique({
            where: { id: userId },
            select: userSelect,
        });

        const data = await this.prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: userSelect,
        });

        await this.auditService.log({
            action: 'USER_UPDATED',
            entity: 'User',
            entityId: userId,
            before,
            after: data,
        });

        return data;
    }

    async remove(userId: string) {
        const before = await this.prisma.user.findUnique({
            where: { id: userId },
            select: userSelect,
        });

        const data = await this.prisma.user.delete({
            where: {
                id: userId,
            },
            select: userSelect,
        });

        await this.auditService.log({
            action: 'USER_DELETED',
            entity: 'User',
            entityId: userId,
            before,
        });

        return data;
    }
}
