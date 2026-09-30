import { BadRequestException, Injectable } from '@nestjs/common';
import type { SickBayVisit } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { BaseCrudService, FilterSpec, SummarySpec } from 'src/common/base-crud.service';
import { SmsService } from 'src/sms/sms.service';
import { CreateSickBayVisitRequestDto } from './sick-bay.dto';

// What the parent is told about where their child is now.
const STATUS_LINES: Record<string, (referredTo?: string | null) => string> = {
    'in-sickbay': () => 'They are resting in the sick bay and being attended to.',
    'returned-to-class': () => 'They were treated and have returned to class.',
    'sent-home': () => 'Please arrange to pick them up from school.',
    referred: (to) => `They have been referred to ${to || 'a health facility'}. Please contact the school.`,
};

// A pupil with this many visits in 30 days is flagged on the sick bay screen.
export const FREQUENT_VISIT_THRESHOLD = 3;

@Injectable()
export class SickBayService extends BaseCrudService {
    protected delegate = this.prisma.sickBayVisit;
    protected entity = 'SickBayVisit';
    protected searchFields = ['studentName', 'className', 'complaint', 'diagnosis'];

    protected filterSpec: Record<string, FilterSpec> = {
        status: { field: 'status', op: 'equals' },
        className: { field: 'className', op: 'equals' },
        studentId: { field: 'studentId', op: 'equals' },
        visitDate: { field: 'visitDate', op: 'equals' },
        dateFrom: { field: 'visitDate', op: 'gte', numeric: false },
        dateTo: { field: 'visitDate', op: 'lte', numeric: false },
    };

    protected summarySpec: Record<string, SummarySpec> = {
        total: { kind: 'count' },
        inSickbay: { kind: 'countWhere', where: { status: 'in-sickbay' } },
        sentHome: { kind: 'countWhere', where: { status: 'sent-home' } },
        referred: { kind: 'countWhere', where: { status: 'referred' } },
        pupils: { kind: 'distinct', field: 'studentName' },
    };

    constructor(
        prisma: PrismaService,
        audit: AuditService,
        private readonly sms: SmsService,
    ) {
        super(prisma, audit);
    }

    async createVisit(dto: CreateSickBayVisitRequestDto, userId?: string) {
        const { notifyParent, ...data } = dto;

        // Trust the pupil record over whatever the form sent for name/class.
        if (data.studentId) {
            const student = await this.prisma.student.findUnique({
                where: { id: data.studentId },
                select: { firstName: true, lastName: true, className: true },
            });
            if (!student) throw new BadRequestException('Pupil not found');
            data.studentName = `${student.firstName} ${student.lastName}`.trim();
            data.className = student.className;
        }
        if (!data.attendedBy && userId) {
            const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
            data.attendedBy = user?.name;
        }

        const visit = (await this.create(data)) as SickBayVisit;
        if (!notifyParent) return visit;

        // The visit is already saved; a failed text must not lose it.
        try {
            return await this.notifyParent(visit.id);
        } catch (err) {
            return { ...visit, smsError: err instanceof Error ? err.message : 'SMS failed' };
        }
    }

    defaultMessage(
        visit: Pick<SickBayVisit, 'studentName' | 'className' | 'visitDate' | 'timeIn' | 'complaint' | 'status' | 'referredTo'>,
        parentName: string | null,
        school: string,
    ) {
        const complaint = visit.complaint.length > 100 ? `${visit.complaint.slice(0, 97)}...` : visit.complaint;
        const when = `${visit.visitDate}${visit.timeIn ? ` at ${visit.timeIn}` : ''}`;
        const cls = visit.className ? ` (${visit.className})` : '';
        const statusLine = (STATUS_LINES[visit.status] ?? STATUS_LINES['in-sickbay'])(visit.referredTo);
        return `Dear ${parentName || 'Parent'}, ${visit.studentName}${cls} visited the school sick bay on ${when} with: ${complaint}. ${statusLine} - ${school}`;
    }

    async notifyParent(id: string, message?: string) {
        const visit = (await this.findOne(id)) as SickBayVisit;
        if (!visit.studentId) {
            throw new BadRequestException('This visit is not linked to a pupil record, so there is no parent number');
        }
        const student = await this.prisma.student.findUnique({
            where: { id: visit.studentId },
            select: { parentName: true, parentPhone: true },
        });
        if (!student?.parentPhone) {
            throw new BadRequestException('No parent phone number is saved for this pupil');
        }

        const text = message?.trim() || this.defaultMessage(visit, student.parentName, await this.sms.schoolName());
        const result = await this.sms.send([{ phone: student.parentPhone, message: text }], 'sick-bay', visit.id);
        if (result.invalid.length) {
            throw new BadRequestException(`The parent number "${student.parentPhone}" is not a valid Ugandan mobile number`);
        }
        if (!result.sent) {
            throw new BadRequestException(result.errors[0] || 'The SMS could not be sent');
        }

        const updated = await this.prisma.sickBayVisit.update({
            where: { id },
            data: { parentNotified: true, notifiedAt: new Date().toISOString() },
        });
        await this.audit.log({ action: 'SICKBAYVISIT_PARENT_NOTIFIED', entity: this.entity, entityId: id, after: { message: text } });
        return updated;
    }

    /**
     * What the nurse needs to see on picking a pupil: standing medical info
     * (allergies especially), the parent's contact, and whether this pupil is
     * a frequent visitor.
     */
    async studentProfile(studentId: string) {
        const student = await this.prisma.student.findUnique({
            where: { id: studentId },
            select: { id: true, firstName: true, lastName: true, className: true, parentName: true, parentPhone: true },
        });
        if (!student) throw new BadRequestException('Pupil not found');
        const name = `${student.firstName} ${student.lastName}`.trim();

        const since = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
        const [health, recentVisits, visitsLast30Days] = await Promise.all([
            // Health records are keyed by name only (no pupil id on that table).
            this.prisma.healthRecord.findFirst({
                where: { studentName: name },
                select: { bloodType: true, allergies: true, conditions: true, emergencyContact: true, emergencyPhone: true },
            }),
            this.prisma.sickBayVisit.findMany({
                where: { studentId },
                orderBy: [{ visitDate: 'desc' }, { createdAt: 'desc' }],
                take: 5,
                select: { id: true, visitDate: true, complaint: true, diagnosis: true, status: true },
            }),
            this.prisma.sickBayVisit.count({ where: { studentId, visitDate: { gte: since } } }),
        ]);

        return {
            student: { ...student, name },
            health,
            recentVisits,
            visitsLast30Days,
            frequentVisitor: visitsLast30Days >= FREQUENT_VISIT_THRESHOLD,
        };
    }
}
