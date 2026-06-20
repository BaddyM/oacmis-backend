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

    // Merge into existing preferences so independent settings (theme, profile
    // fields, notifications, …) don't overwrite each other.
    async set(userId: string, value: unknown) {
        const isObject = (v: unknown): v is Record<string, unknown> =>
            !!v && typeof v === 'object' && !Array.isArray(v);
        let merged: unknown = value;
        if (isObject(value)) {
            const existing = await this.get(userId);
            merged = { ...(isObject(existing) ? existing : {}), ...value };
        }
        const json = (merged ?? Prisma.JsonNull) as Prisma.InputJsonValue;
        return this.prisma.userPreference.upsert({
            where: { userId },
            create: { userId, value: json },
            update: { value: json },
        });
    }
}
