import { Injectable } from '@nestjs/common';
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

    async create(createUserDto: CreateUserDto) {
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
        const total = await this.prisma.user.count();
        const totalPages = Math.ceil(total / limit);
        return { data, totalPages };
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

        // 3. Conditionally hash and add the password if it exists
        if (password) {
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
