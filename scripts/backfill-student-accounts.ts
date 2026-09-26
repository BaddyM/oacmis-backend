/**
 * One-off (and re-runnable) backfill: give every existing pupil a student
 * number and a login, so schools that already had records get accounts without
 * re-entering anyone.
 *
 *   npx ts-node scripts/backfill-student-accounts.ts
 *
 * Idempotent — pupils who already have a number and a linked account are left
 * alone, so it is safe to run again after an import.
 */
import { PrismaService } from '../src/prisma/prisma.service';
import { AuditService } from '../src/audit/audit.service';
import { StudentAccountsService } from '../src/students/student-accounts.service';

// The three services are wired by hand rather than through a Nest context: the
// full application graph pulls in Redis and every unrelated module, and this
// script only needs Prisma, the audit log and the provisioning service itself.
// It is still the real StudentAccountsService, so there is no second copy of
// the number-generation or account-linking rules to keep in step.
async function main() {
    const prisma = new PrismaService();
    await prisma.$connect();
    try {
        const accounts = new StudentAccountsService(prisma, new AuditService(prisma));

        const students = await prisma.student.findMany({
            select: { id: true },
            orderBy: { createdAt: 'asc' },
        });
        console.log(`Found ${students.length} pupils.`);

        const result = await accounts.provisionMany(students.map((s) => s.id));
        console.log(
            `Provisioned ${result.provisioned} (new logins: ${result.created}, failed: ${result.failed.length}).`,
        );
        result.failed.forEach((f) => console.warn(`  ! ${f.studentId}: ${f.reason}`));

        const sample = await prisma.student.findMany({
            select: { firstName: true, lastName: true, studentNumber: true, admissionNo: true },
            orderBy: { createdAt: 'asc' },
            take: 5,
        });
        console.log('\nSample credentials (password = student number until changed):');
        sample.forEach((s) =>
            console.log(`  ${s.studentNumber}  ${s.firstName} ${s.lastName}  (admission ${s.admissionNo})`),
        );

        const missing = await prisma.student.count({ where: { studentNumber: null } });
        const unlinked = await prisma.student.count({ where: { user: null } });
        console.log(`\nPupils still without a number: ${missing}; without a login: ${unlinked}`);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
