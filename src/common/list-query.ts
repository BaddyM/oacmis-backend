/**
 * Parsing for the list-endpoint query string shared by every paginated module.
 *
 * Paging/search/session keys are pulled out by name; whatever else the page
 * sent is handed back as `filters` for the service to match against its own
 * `filterSpec`. Undeclared keys are dropped there rather than here, so this
 * stays module-agnostic.
 *
 * `page`/`limit` are left undefined when absent or unparseable so the service's
 * own defaults apply, and clamped there — see BaseCrudService.normalisePaging.
 */
export interface ListQuery {
    page?: number;
    limit?: number;
    search?: string;
    term?: string;
    year?: number;
    filters: Record<string, string>;
}

const RESERVED = ['page', 'limit', 'search', 'term', 'year'] as const;

function toInt(value?: string): number | undefined {
    if (value === undefined || value === '') return undefined;
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
}

export function parseListQuery(query: Record<string, any> = {}): ListQuery {
    const filters: Record<string, string> = {};
    for (const [key, value] of Object.entries(query)) {
        if ((RESERVED as readonly string[]).includes(key)) continue;
        // A repeated key (?a=1&a=2) arrives as an array; take the last one
        // rather than passing an array into a Prisma equals/contains.
        const flat = Array.isArray(value) ? value[value.length - 1] : value;
        if (typeof flat === 'string' && flat !== '') filters[key] = flat;
    }
    return {
        page: toInt(query.page),
        limit: toInt(query.limit),
        search: query.search || undefined,
        term: query.term || undefined,
        year: toInt(query.year),
        filters,
    };
}
