import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(args: {
    userId?: string | null;
    action: string;
    entity: string;
    entityId?: string;
    before?: unknown;
    after?: unknown;
  }) {
    return this.prisma.auditLog.create({
      data: {
        userId: args.userId ?? null,
        action: args.action,
        entity: args.entity,
        entityId: args.entityId ?? null,
        before: args.before ? JSON.stringify(args.before) : null,
        after: args.after ? JSON.stringify(args.after) : null,
      },
    });
  }

  async list(page: number, limit: number, entity?: string) {
    const where = entity ? { entity } : {};
    const data = await this.prisma.auditLog.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
    const total = await this.prisma.auditLog.count({ where });
    return { data, totalPages: Math.ceil(total / limit) };
  }
}
