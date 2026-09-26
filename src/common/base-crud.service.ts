import { NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';

// Minimal shape of a Prisma model delegate used by the generic CRUD service.
interface PrismaDelegate {
    create(args: any): Promise<any>;
    findMany(args: any): Promise<any[]>;
    count(args: any): Promise<number>;
    aggregate(args: any): Promise<any>;
    groupBy(args: any): Promise<any[]>;
    findUnique(args: any): Promise<any>;
    update(args: any): Promise<any>;
    delete(args: any): Promise<any>;
}

/**
 * How one query-string filter key maps onto a Prisma `where` fragment.
 *
 * `equals` matches the column exactly, `contains` does a substring match, and
 * `gte`/`lte` are the range ends (a page sends e.g. `minQty`/`maxQty` as two
 * separate keys, both pointing at the same `field`).
 *
 * `numeric` says how to coerce the incoming string. Ranges assume numbers
 * unless told otherwise; set `numeric: false` for date columns, which this
 * schema stores as ISO `YYYY-MM-DD` strings — those sort lexicographically, so
 * a plain string >= / <= is a correct date range.
 *
 * A function is the escape hatch for filters that aren't a plain column compare
 * — see InventoryService, where stock status is derived from `quantity` vs
 * `minStock` rather than read from a column. Returning `undefined` drops it.
 */
export type FilterSpec =
    | { field: string; op: 'equals' | 'contains' | 'gte' | 'lte'; numeric?: boolean }
    | ((value: string) => any | undefined);

/**
 * How one key of the list `summary` is computed. Every variant is evaluated
 * against the *filtered* row set, not the current page, so the stat tiles on a
 * page keep agreeing with the filters even though only one page is fetched.
 *
 * `distinct` counts unique values of a column (the server-side equivalent of
 * `new Set(rows.map(r => r.busNumber)).size`).
 *
 * `sumProduct` (e.g. inventory value = quantity x unitPrice) has no Prisma
 * aggregate equivalent, so it reads just its two columns for the matching rows
 * and reduces in JS. That's linear in matched rows rather than page size —
 * acceptable at this app's scale (school inventories run to hundreds of rows),
 * but it's the one variant to think twice about on a large table.
 */
export type SummarySpec =
    | { kind: 'count' }
    | { kind: 'sum'; field: string }
    | { kind: 'countWhere'; where: any }
    | { kind: 'distinct'; field: string }
    | { kind: 'sumProduct'; fields: [string, string] };

// Hard ceiling on `limit`, so a caller can't ask for the whole table and undo
// the point of paginating. Applies to hand-written URLs too, not just the UI.
export const MAX_LIMIT = 200;

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
    // Filter keys this module accepts on the list query. Anything not declared
    // here is ignored, so an unknown `?foo=` can't reach the database.
    protected filterSpec: Record<string, FilterSpec> = {};
    // Aggregates returned as `summary` on the list response. Empty means the
    // module has no stat tiles and the key is omitted entirely.
    protected summarySpec: Record<string, SummarySpec> = {};

    constructor(
        protected readonly prisma: PrismaService,
        protected readonly audit: AuditService,
    ) { }

    // Translate the declared `filterSpec` against the incoming query values.
    protected buildFilters(filters?: Record<string, string>) {
        const and: any[] = [];
        for (const [key, raw] of Object.entries(filters ?? {})) {
            const spec = this.filterSpec[key];
            // Undeclared key, or one the page sent as empty ("all" in a select).
            if (!spec || raw === undefined || raw === null || raw === '') continue;

            if (typeof spec === 'function') {
                const fragment = spec(raw);
                if (fragment) and.push(fragment);
                continue;
            }

            if (spec.op === 'equals') {
                and.push({ [spec.field]: spec.numeric ? Number(raw) : raw });
            } else if (spec.op === 'contains') {
                and.push({ [spec.field]: { contains: raw } });
            } else if (spec.numeric === false) {
                // String range — ISO date columns compare correctly as text.
                and.push({ [spec.field]: { [spec.op]: raw } });
            } else {
                // Numeric range. A non-numeric value here would make Prisma
                // throw, so drop it rather than 500 on a typo'd query string.
                const value = Number(raw);
                if (Number.isNaN(value)) continue;
                and.push({ [spec.field]: { [spec.op]: value } });
            }
        }
        return and;
    }

    protected buildWhere(search?: string, term?: string, year?: number, filters?: Record<string, string>) {
        const and: any[] = [];
        if (search) {
            and.push({ OR: this.searchFields.map((field) => ({ [field]: { contains: search } })) });
        }

        const all = { ...filters };
        if (this.sessionScoped && term && year) {
            and.push({ term, year });
        } else {
            // `term`/`year` are parsed out of the query string by name for the
            // academic session, but a module that isn't session-scoped may use
            // them as ordinary columns (PayrollRecord.year is the payroll year,
            // not a session). Offer them to filterSpec, which ignores whatever
            // it hasn't declared.
            if (term !== undefined) all.term = term;
            if (year !== undefined) all.year = String(year);
        }

        and.push(...this.buildFilters(all));
        return and.length ? { AND: and } : {};
    }

    /**
     * Evaluate `summarySpec` over every row matching `where` (not just the
     * page). Returns undefined when the module declares no summary, so the
     * response shape is unchanged for modules that don't use it.
     */
    protected async computeSummary(where: any): Promise<Record<string, number> | undefined> {
        const entries = Object.entries(this.summarySpec);
        if (!entries.length) return undefined;

        // Plain field sums share a single aggregate call; the rest need their
        // own query, so issue them all concurrently.
        const sumFields = entries
            .filter(([, spec]) => spec.kind === 'sum')
            .map(([, spec]) => (spec as { field: string }).field);

        const aggregate = sumFields.length
            ? await this.delegate.aggregate({
                where,
                _sum: Object.fromEntries(sumFields.map((f) => [f, true])),
            })
            : null;

        const summary: Record<string, number> = {};
        await Promise.all(
            entries.map(async ([key, spec]) => {
                if (spec.kind === 'count') {
                    summary[key] = await this.delegate.count({ where });
                } else if (spec.kind === 'sum') {
                    // Prisma returns null for _sum over an empty set.
                    summary[key] = aggregate?._sum?.[spec.field] ?? 0;
                } else if (spec.kind === 'countWhere') {
                    summary[key] = await this.delegate.count({ where: { AND: [where, spec.where] } });
                } else if (spec.kind === 'distinct') {
                    const groups = await this.delegate.groupBy({ by: [spec.field], where });
                    summary[key] = groups.length;
                } else {
                    const [a, b] = spec.fields;
                    const rows = await this.delegate.findMany({
                        where,
                        select: { [a]: true, [b]: true },
                    });
                    summary[key] = rows.reduce((total, row) => total + (row[a] ?? 0) * (row[b] ?? 0), 0);
                }
            }),
        );
        return summary;
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

    /**
     * Clamp caller-supplied paging into a sane range. `limit` is capped at
     * MAX_LIMIT and `page` floored at 1, so a bad query string can't turn into
     * a negative `skip` (which Prisma rejects) or a full-table read.
     */
    protected normalisePaging(page?: number, limit?: number) {
        const safeLimit = Math.min(
            Math.max(Math.trunc(limit ?? this.defaultLimit) || this.defaultLimit, 1),
            MAX_LIMIT,
        );
        const safePage = Math.max(Math.trunc(page ?? 1) || 1, 1);
        return { page: safePage, limit: safeLimit };
    }

    async findAll(
        page = 1,
        limit = this.defaultLimit,
        search?: string,
        term?: string,
        year?: number,
        filters?: Record<string, string>,
    ) {
        const paging = this.normalisePaging(page, limit);
        const where = this.buildWhere(search, term, year, filters);
        const [data, total] = (await this.prisma.$transaction([
            this.delegate.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (paging.page - 1) * paging.limit,
                take: paging.limit,
            }),
            this.delegate.count({ where }),
        ] as any)) as [any[], number];
        const summary = await this.computeSummary(where);
        return {
            data,
            total,
            totalPages: Math.ceil(total / paging.limit),
            page: paging.page,
            limit: paging.limit,
            ...(summary ? { summary } : {}),
        };
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
