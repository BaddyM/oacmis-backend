// GENERATED FILE — do not edit by hand.
// Mirrors the frontend page registry (oacmis/src/lib/pageRegistry.ts), which is
// the single source of truth for pages and their per-role defaults.
//
// Regenerate with:  node scripts/sync-page-access.mjs
// Check for drift:  node scripts/sync-page-access.mjs --check
//
// 42 pages, 15 roles.

export const PAGE_KEYS = ['dashboard', 'admissions', 'students', 'promotions', 'teachers', 'alumni', 'classes', 'subjects', 'timetable', 'attendance', 'rfid-attendance', 'assignments', 'exams', 'quizzes', 'grades', 'discipline', 'health-records', 'sick-bay', 'events', 'messaging', 'bulk-communication', 'notifications', 'payroll', 'staff-attendance', 'leave-requests', 'fee-structures', 'student-fees', 'online-fee-payment', 'expenses', 'pocket-money', 'canteen', 'library', 'transport', 'hostel', 'inventory', 'certificates', 'student-id', 'reports', 'users', 'settings', 'subscription', 'profile'] as const;

export type PageKey = (typeof PAGE_KEYS)[number];

const PAGE_KEY_SET: ReadonlySet<string> = new Set(PAGE_KEYS);

/** Pages each role gets when the user has no per-user override. */
export const ROLE_DEFAULT_PAGES: Record<string, readonly PageKey[]> = {
    admin: ['dashboard', 'admissions', 'students', 'promotions', 'teachers', 'alumni', 'classes', 'subjects', 'timetable', 'attendance', 'rfid-attendance', 'assignments', 'exams', 'quizzes', 'grades', 'discipline', 'health-records', 'sick-bay', 'events', 'messaging', 'bulk-communication', 'notifications', 'payroll', 'staff-attendance', 'leave-requests', 'fee-structures', 'student-fees', 'online-fee-payment', 'expenses', 'pocket-money', 'canteen', 'library', 'transport', 'hostel', 'inventory', 'certificates', 'student-id', 'reports', 'users', 'settings', 'subscription', 'profile'],
    director: ['dashboard', 'admissions', 'students', 'teachers', 'grades', 'events', 'messaging', 'bulk-communication', 'payroll', 'staff-attendance', 'leave-requests', 'fee-structures', 'student-fees', 'expenses', 'inventory', 'reports', 'profile'],
    headteacher: ['dashboard', 'admissions', 'students', 'promotions', 'teachers', 'alumni', 'classes', 'subjects', 'timetable', 'attendance', 'rfid-attendance', 'assignments', 'exams', 'grades', 'discipline', 'health-records', 'sick-bay', 'events', 'messaging', 'bulk-communication', 'notifications', 'staff-attendance', 'leave-requests', 'student-fees', 'library', 'transport', 'hostel', 'certificates', 'reports', 'profile'],
    deputy: ['dashboard', 'admissions', 'students', 'teachers', 'classes', 'timetable', 'attendance', 'rfid-attendance', 'grades', 'discipline', 'health-records', 'sick-bay', 'events', 'messaging', 'bulk-communication', 'staff-attendance', 'leave-requests', 'transport', 'hostel', 'reports', 'profile'],
    dos: ['dashboard', 'students', 'promotions', 'teachers', 'classes', 'subjects', 'timetable', 'attendance', 'assignments', 'exams', 'quizzes', 'grades', 'events', 'messaging', 'leave-requests', 'certificates', 'reports', 'profile'],
    teacher: ['dashboard', 'timetable', 'attendance', 'assignments', 'exams', 'quizzes', 'grades', 'discipline', 'events', 'messaging', 'leave-requests', 'profile'],
    bursar: ['dashboard', 'events', 'messaging', 'bulk-communication', 'payroll', 'leave-requests', 'fee-structures', 'student-fees', 'online-fee-payment', 'expenses', 'pocket-money', 'canteen', 'inventory', 'profile'],
    secretary: ['dashboard', 'admissions', 'students', 'alumni', 'events', 'messaging', 'bulk-communication', 'notifications', 'leave-requests', 'certificates', 'student-id', 'profile'],
    librarian: ['events', 'messaging', 'leave-requests', 'library', 'profile'],
    nurse: ['health-records', 'sick-bay', 'events', 'messaging', 'leave-requests', 'profile'],
    matron: ['attendance', 'discipline', 'health-records', 'sick-bay', 'events', 'messaging', 'leave-requests', 'pocket-money', 'hostel', 'profile'],
    storekeeper: ['events', 'messaging', 'leave-requests', 'inventory', 'profile'],
    canteen: ['events', 'messaging', 'leave-requests', 'canteen', 'profile'],
    staff: ['profile'],
    student: ['dashboard', 'timetable', 'assignments', 'quizzes', 'events', 'messaging', 'profile'],
};

/** Every role a user may hold. */
export const ALL_ROLES = ['admin', 'director', 'headteacher', 'deputy', 'dos', 'teacher', 'bursar', 'secretary', 'librarian', 'nurse', 'matron', 'storekeeper', 'canteen', 'staff', 'student'] as const;

/**
 * Leadership roles with full control of the pages they hold. Every other staff
 * role is confined to its own rows on shared pages (see OwnedCrudService).
 */
export const FULL_ACCESS_ROLES: readonly string[] = ['admin', 'director', 'headteacher', 'deputy', 'dos'];

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
