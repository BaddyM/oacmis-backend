import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
const bcrypt = require('bcryptjs');

/** Domain for synthetic logins when a pupil has no email of their own. */
const STUDENT_EMAIL_DOMAIN = 'students.local';
const MAX_NUMBER_ATTEMPTS = 25;

export interface ProvisionResult {
    studentId: string;
    studentNumber: string;
    email: string;
    /** True when this call created the login, false when one already existed. */
    created: boolean;
}

/**
 * Every pupil gets a login, provisioned automatically when their record is
 * created. The student number doubles as the username and the initial password;
 * the pupil can change the password from their portal at any time.
 */
@Injectable()
export class StudentAccountsService {
    private readonly logger = new Logger(StudentAccountsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly audit: AuditService,
    ) { }

    /**
     * A student number is the intake year followed by six digits — 2026483920.
     * The digits are random rather than sequential so a number does not reveal
     * how many pupils enrolled before this one; uniqueness comes from the
     * column's unique index plus the retry below.
     */
    async generateStudentNumber(year = new Date().getFullYear()): Promise<string> {
        for (let attempt = 0; attempt < MAX_NUMBER_ATTEMPTS; attempt++) {
            const candidate = `${year}${Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0')}`;
            const taken = await this.prisma.student.findUnique({
                where: { studentNumber: candidate },
                select: { id: true },
            });
            if (!taken) return candidate;
        }
        // 10^6 numbers per year; exhausting 25 draws means the year is very full.
        throw new Error(`Could not allocate a unique student number for ${year}`);
    }

    /** The login email for a pupil: their own if usable, otherwise synthetic. */
    private async pickEmail(studentEmail: string | null, studentNumber: string) {
        const candidate = studentEmail?.trim().toLowerCase();
        if (candidate) {
            const clash = await this.prisma.user.findUnique({
                where: { email: candidate },
                select: { id: true },
            });
            if (!clash) return candidate;
        }
        return `${studentNumber}@${STUDENT_EMAIL_DOMAIN}`;
    }

    /**
     * Make sure this pupil has a student number and a login. Idempotent: safe to
     * call on every create, on re-import, and from the backfill script.
     *
     * An account that already exists for the pupil's email is adopted rather
     * than duplicated, so schools that created logins by hand keep them.
     */
    async provision(studentId: string): Promise<ProvisionResult | null> {
        const student = await this.prisma.student.findUnique({ where: { id: studentId } });
        if (!student) return null;

        let studentNumber = student.studentNumber;
        if (!studentNumber) {
            // Intake year comes from when the record was created.
            studentNumber = await this.generateStudentNumber(student.createdAt.getFullYear());
            await this.prisma.student.update({
                where: { id: student.id },
                data: { studentNumber },
            });
        }

        const existing = await this.prisma.user.findUnique({
            where: { studentId: student.id },
            select: { id: true, email: true },
        });
        if (existing) {
            return { studentId: student.id, studentNumber, email: existing.email, created: false };
        }

        const fullName = `${student.firstName} ${student.lastName}`.trim();

        // Adopt a hand-made account for the same person instead of creating a
        // second login they would never be told about.
        const byEmail = student.email?.trim().toLowerCase()
            ? await this.prisma.user.findUnique({
                where: { email: student.email.trim().toLowerCase() },
                select: { id: true, email: true, studentId: true, role: true },
            })
            : null;

        // Adopt only an account that is already a pupil login. An admin,
        // teacher or staff account that happens to share an email with a pupil
        // record must never be demoted to `student` — that would silently strip
        // an administrator of their access. Those pupils get a synthetic login
        // below instead, leaving the staff account untouched.
        if (byEmail && !byEmail.studentId && byEmail.role === 'student') {
            await this.prisma.user.update({
                where: { id: byEmail.id },
                data: { studentId: student.id },
            });
            return { studentId: student.id, studentNumber, email: byEmail.email, created: false };
        }

        const email = await this.pickEmail(student.email, studentNumber);
        // The initial password is the student number itself. It is hashed here
        // rather than through UserService.create because the school's password
        // policy (12+ chars with a symbol, say) would reject it — the pupil is
        // expected to change it, and the policy does apply when they do.
        const password = await bcrypt.hash(studentNumber, 10);

        const user = await this.prisma.user.create({
            data: {
                name: fullName || studentNumber,
                email,
                password,
                role: 'student',
                isActive: true,
                studentId: student.id,
            },
            select: { id: true, email: true },
        });

        await this.audit.log({
            action: 'STUDENT_ACCOUNT_PROVISIONED',
            entity: 'User',
            entityId: user.id,
            after: { studentId: student.id, studentNumber, email: user.email },
        });

        this.logger.log(`Provisioned login ${studentNumber} for ${fullName}`);
        return { studentId: student.id, studentNumber, email: user.email, created: true };
    }

    /**
     * Keep a pupil's login usable when an admin edits their student number.
     *
     * The number is also the initial password, so renumbering a pupil who never
     * chose their own password would otherwise leave them signing in with a new
     * username and a stale password. If they are still on the default, move it
     * to the new number; if they picked their own, never touch it.
     */
    async handleNumberChange(studentId: string, oldNumber: string | null, newNumber: string) {
        if (!oldNumber || oldNumber === newNumber) return { passwordMoved: false };

        const user = await this.prisma.user.findUnique({
            where: { studentId },
            select: { id: true, password: true },
        });
        if (!user) return { passwordMoved: false };

        const stillOnDefault = await bcrypt.compare(oldNumber, user.password);
        if (!stillOnDefault) return { passwordMoved: false };

        await this.prisma.user.update({
            where: { id: user.id },
            data: { password: await bcrypt.hash(newNumber, 10) },
        });
        this.logger.log(`Student number ${oldNumber} -> ${newNumber}; default password moved with it`);
        return { passwordMoved: true };
    }

    /** Provision many pupils, reporting failures instead of aborting the batch. */
    async provisionMany(studentIds: string[]) {
        const results: ProvisionResult[] = [];
        const failed: { studentId: string; reason: string }[] = [];
        for (const id of studentIds) {
            try {
                const result = await this.provision(id);
                if (result) results.push(result);
            } catch (e) {
                failed.push({ studentId: id, reason: e instanceof Error ? e.message : 'unknown' });
                this.logger.warn(`Could not provision student ${id}: ${e}`);
            }
        }
        return { provisioned: results.length, created: results.filter((r) => r.created).length, failed };
    }
}
