// Regenerates src/auth/page-access.ts from the frontend page registry.
//
// The frontend (src/lib/pageRegistry.tsx) owns the list of pages and the
// default page set per role. The backend needs the same table to authorize
// requests, and the two living in separate projects means they can drift —
// which for an authorization table is a security bug, not a cosmetic one.
//
//   node scripts/sync-page-access.mjs         # rewrite the backend table
//   node scripts/sync-page-access.mjs --check # fail if it is out of date
//
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const REGISTRY = resolve(here, '../../oacmis/src/lib/pageRegistry.ts');
const TARGET = resolve(here, '../src/auth/page-access.ts');

const src = readFileSync(REGISTRY, 'utf8');

const allRoles = [...(src.match(/const ALL_ROLES: readonly UserRole\[\] = \[([^\]]*)\]/)?.[1] ?? '')
    .matchAll(/'(\w+)'/g)].map((m) => m[1]);
if (!allRoles.length) throw new Error('Could not read ALL_ROLES from the registry');

const pages = [...src.matchAll(/key: '([^']+)', path: '([^']+)'[\s\S]*?roles: (\[[^\]]*\]|ALL_ROLES)/g)]
    .map(([, key, path, roles]) => ({
        key,
        path,
        roles: roles === 'ALL_ROLES' ? allRoles : [...roles.matchAll(/'(\w+)'/g)].map((m) => m[1]),
    }));
if (!pages.length) throw new Error('Could not read any pages from the registry');

const fullAccess = [...(src.match(/FULL_ACCESS_ROLES: readonly UserRole\[\] = \[([^\]]*)\]/)?.[1] ?? '')
    .matchAll(/'(\w+)'/g)].map((m) => m[1]);
if (!fullAccess.length) throw new Error('Could not read FULL_ACCESS_ROLES from the registry');

const alwaysAllowed = [...(src.match(/ALWAYS_ALLOWED_PAGES: readonly PageKey\[\] = \[([^\]]*)\]/)?.[1] ?? '')
    .matchAll(/'([\w-]+)'/g)].map((m) => m[1]);

const list = (items) => items.map((i) => `'${i}'`).join(', ');
const defaults = allRoles
    .map((role) => {
        const keys = pages.filter((p) => p.roles.includes(role)).map((p) => p.key);
        return `    ${role}: [${list(keys)}],`;
    })
    .join('\n');

const out = `// GENERATED FILE — do not edit by hand.
// Mirrors the frontend page registry (oacmis/src/lib/pageRegistry.ts), which is
// the single source of truth for pages and their per-role defaults.
//
// Regenerate with:  node scripts/sync-page-access.mjs
// Check for drift:  node scripts/sync-page-access.mjs --check
//
// ${pages.length} pages, ${allRoles.length} roles.

export const PAGE_KEYS = [${list(pages.map((p) => p.key))}] as const;

export type PageKey = (typeof PAGE_KEYS)[number];

const PAGE_KEY_SET: ReadonlySet<string> = new Set(PAGE_KEYS);

/** Pages each role gets when the user has no per-user override. */
export const ROLE_DEFAULT_PAGES: Record<string, readonly PageKey[]> = {
${defaults}
};

/** Every role a user may hold. */
export const ALL_ROLES = [${list(allRoles)}] as const;

/**
 * Leadership roles with full control of the pages they hold. Every other staff
 * role is confined to its own rows on shared pages (see OwnedCrudService).
 */
export const FULL_ACCESS_ROLES: readonly string[] = [${list(fullAccess)}];

/** Pages every signed-in user keeps regardless of role or override. */
export const ALWAYS_ALLOWED_PAGES: readonly PageKey[] = [${list(alwaysAllowed)}];

/**
 * The effective page set for a user. A stored \`permissions\` array is a
 * per-user override; anything else (null, absent, malformed) falls back to the
 * role defaults. Unknown keys are dropped so a stale override cannot widen
 * access to a page that no longer exists.
 */
export function resolveAllowedPages(role: string | undefined, permissions: unknown): Set<string> {
    const base = Array.isArray(permissions)
        ? permissions.filter((k): k is string => typeof k === 'string' && PAGE_KEY_SET.has(k))
        : [...(ROLE_DEFAULT_PAGES[role ?? ''] ?? [])];
    return new Set<string>([...base, ...ALWAYS_ALLOWED_PAGES]);
}
`;

if (process.argv.includes('--check')) {
    const current = (() => { try { return readFileSync(TARGET, 'utf8'); } catch { return ''; } })();
    if (current !== out) {
        console.error('page-access.ts is out of date with the frontend registry. Run: node scripts/sync-page-access.mjs');
        process.exit(1);
    }
    console.log(`page-access.ts is in sync (${pages.length} pages, ${allRoles.length} roles).`);
} else {
    writeFileSync(TARGET, out);
    console.log(`Wrote ${TARGET} (${pages.length} pages, ${allRoles.length} roles).`);
}
