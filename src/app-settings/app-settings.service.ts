import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AppSettingsService {
    constructor(private readonly prisma: PrismaService) { }

    async get(key: string) {
        const row = await this.prisma.appSetting.findUnique({ where: { key } });
        return row ? row.value : null;
    }

    set(key: string, value: unknown) {
        const json = (value ?? Prisma.JsonNull) as Prisma.InputJsonValue;
        return this.prisma.appSetting.upsert({
            where: { key },
            create: { key, value: json },
            update: { value: json },
        });
    }
}
