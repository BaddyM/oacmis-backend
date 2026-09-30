import type { PageKey } from './page-access';

// Shared groupings for endpoints that back more than one screen. Each constant
// answers "which pages legitimately need this data?" — the guard allows a user
// holding any one of them.

/**
 * Pupil records. Nearly every staff-facing screen needs to look up a pupil, so
 * this list is broad by design; what matters is what it leaves out. Notably it
 * excludes the pages a pupil themselves holds (dashboard, timetable,
 * assignments, quizzes, events, messaging), so a signed-in student cannot read
 * the whole roster — they use the /students/me endpoints instead.
 */
export const STUDENT_DIRECTORY_PAGES: PageKey[] = [
    'students', 'admissions', 'promotions', 'attendance', 'rfid-attendance',
    'grades', 'exams', 'reports', 'discipline', 'health-records',
    'student-fees', 'fee-structures', 'online-fee-payment',
    'certificates', 'student-id', 'library', 'transport', 'hostel',
    'inventory', 'alumni', 'bulk-communication', 'notifications',
    'sick-bay', 'pocket-money', 'canteen',
];

/** Staff records: the people pages plus everything that pays or schedules them. */
export const STAFF_DIRECTORY_PAGES: PageKey[] = [
    'teachers', 'payroll', 'staff-attendance', 'leave-requests',
    'timetable', 'classes', 'subjects', 'reports', 'bulk-communication',
];

/** Marks and results: entered on one screen, read by several. */
export const RESULTS_PAGES: PageKey[] = ['grades', 'exams', 'reports'];

/** Fee records and the money that settles them. */
export const FEES_PAGES: PageKey[] = [
    'student-fees', 'fee-structures', 'online-fee-payment', 'reports', 'expenses',
];
