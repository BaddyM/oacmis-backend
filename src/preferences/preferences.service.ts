import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PreferencesService {
    constructor(private readonly prisma: PrismaService) { }

    async get(userId: string) {
        const row = await this.prisma.userPreference.findUnique({ where: { userId } });
        return row ? row.value : null;
    }

    set(userId: string, value: unknown) {
        const json = (value ?? Prisma.JsonNull) as Prisma.InputJsonValue;
        return this.prisma.userPreference.upsert({
            where: { userId },
            create: { userId, value: json },
            update: { value: json },
        });
    }
}
