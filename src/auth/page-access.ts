// GENERATED FILE — do not edit by hand.
// Mirrors the frontend page registry (oacmis/src/lib/pageRegistry.ts), which is
// the single source of truth for pages and their per-role defaults.
//
// Regenerate with:  node scripts/sync-page-access.mjs
// Check for drift:  node scripts/sync-page-access.mjs --check
//
// 38 pages, 4 roles.

export const PAGE_KEYS = ['dashboard', 'admissions', 'students', 'promotions', 'teachers', 'alumni', 'classes', 'subjects', 'timetable', 'attendance', 'rfid-attendance', 'assignments', 'exams', 'quizzes', 'grades', 'discipline', 'health-records', 'events', 'messaging', 'bulk-communication', 'notifications', 'payroll', 'staff-attendance', 'leave-requests', 'fee-structures', 'student-fees', 'online-fee-payment', 'expenses', 'library', 'transport', 'hostel', 'inventory', 'certificates', 'student-id', 'reports', 'users', 'settings', 'profile'] as const;

export type PageKey = (typeof PAGE_KEYS)[number];

const PAGE_KEY_SET: ReadonlySet<string> = new Set(PAGE_KEYS);

/** Pages each role gets when the user has no per-user override. */
export const ROLE_DEFAULT_PAGES: Record<string, readonly PageKey[]> = {
    admin: ['dashboard', 'admissions', 'students', 'promotions', 'teachers', 'alumni', 'classes', 'subjects', 'timetable', 'attendance', 'rfid-attendance', 'assignments', 'exams', 'quizzes', 'grades', 'discipline', 'health-records', 'events', 'messaging', 'bulk-communication', 'notifications', 'payroll', 'staff-attendance', 'leave-requests', 'fee-structures', 'student-fees', 'online-fee-payment', 'expenses', 'library', 'transport', 'hostel', 'inventory', 'certificates', 'student-id', 'reports', 'users', 'settings', 'profile'],
    teacher: ['dashboard', 'timetable', 'attendance', 'assignments', 'exams', 'quizzes', 'grades', 'discipline', 'events', 'messaging', 'leave-requests', 'profile'],
    student: ['dashboard', 'timetable', 'assignments', 'quizzes', 'events', 'messaging', 'profile'],
    staff: ['profile'],
};

/** Pages every signed-in user keeps regardless of role or override. */
export const ALWAYS_ALLOWED_PAGES: readonly PageKey[] = ['profile'];

/**
 * The effective page set for a user. A stored `permissions` array is a
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
