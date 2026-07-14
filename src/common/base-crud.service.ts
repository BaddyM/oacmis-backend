import { NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';

// Minimal shape of a Prisma model delegate used by the generic CRUD service.
interface PrismaDelegate {
    create(args: any): Promise<any>;
    findMany(args: any): Promise<any[]>;
    count(args: any): Promise<number>;
    findUnique(args: any): Promise<any>;
    update(args: any): Promise<any>;
    delete(args: any): Promise<any>;
}

/**
 * Shared list/CRUD logic for simple single-table modules.
 * Subclasses provide the Prisma delegate, an entity label (for audit logs)
 * and the fields that the `search` query should match against.
 */
export abstract class BaseCrudService {
    protected abstract delegate: PrismaDelegate;
    protected abstract entity: string;
    protected abstract searchFields: string[];
    protected defaultLimit = 50;
    // When true, list queries can be filtered by the active academic session
    // (term + year). Records are stamped with the session on create by the
    // frontend, which sends `term`/`year` in the body.
    protected sessionScoped = false;

    constructor(
        protected readonly prisma: PrismaService,
        protected readonly audit: AuditService,
    ) { }

    protected buildWhere(search?: string, term?: string, year?: number) {
        const and: any[] = [];
        if (search) {
            and.push({ OR: this.searchFields.map((field) => ({ [field]: { contains: search } })) });
        }
        if (this.sessionScoped && term && year) {
            and.push({ term, year });
        }
        return and.length ? { AND: and } : {};
    }

    async create(data: any) {
        const record = await this.delegate.create({ data });
        await this.audit.log({
            action: `${this.entity.toUpperCase()}_CREATED`,
            entity: this.entity,
            entityId: record.id,
            after: record,
        });
        return record;
    }

    async findAll(page = 1, limit = this.defaultLimit, search?: string, term?: string, year?: number) {
        const where = this.buildWhere(search, term, year);
        const [data, total] = (await this.prisma.$transaction([
            this.delegate.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.delegate.count({ where }),
        ] as any)) as [any[], number];
        return { data, total, totalPages: Math.ceil(total / limit) };
    }

    async findOne(id: string) {
        const record = await this.delegate.findUnique({ where: { id } });
        if (!record) throw new NotFoundException(`${this.entity} not found`);
        return record;
    }

    async update(id: string, data: any) {
        const before = await this.findOne(id);
        const record = await this.delegate.update({ where: { id }, data });
        await this.audit.log({
            action: `${this.entity.toUpperCase()}_UPDATED`,
            entity: this.entity,
            entityId: id,
            before,
            after: record,
        });
        return record;
    }

    async remove(id: string) {
        const before = await this.findOne(id);
        const record = await this.delegate.delete({ where: { id } });
        await this.audit.log({
            action: `${this.entity.toUpperCase()}_DELETED`,
            entity: this.entity,
            entityId: id,
            before,
        });
        return record;
    }
}
