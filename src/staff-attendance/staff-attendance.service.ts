import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { BaseCrudService } from 'src/common/base-crud.service';
import { STAFF_ATTENDANCE_STATUSES, StaffAttendanceStatus } from './staff-attendance.dto';

export interface StaffTermReportRow {
    staffId: string;
    staffName: string;
    present: number;
    absent: number;
    late: number;
    leave: number;
    /** Days the register was marked for this person. */
    marked: number;
    /** present+late over present+late+absent, as a percentage. */
    rate: number;
}

export interface StaffTermReport {
    term: string;
    year: number;
    /** Distinct dates the register was taken in this term. */
    schoolDays: number;
    firstDate: string | null;
    lastDate: string | null;
    rows: StaffTermReportRow[];
    totals: Omit<StaffTermReportRow, 'staffId' | 'staffName'>;
}

@Injectable()
export class StaffAttendanceService extends BaseCrudService {
    protected delegate = this.prisma.staffAttendance;
    protected entity = 'StaffAttendance';
    protected searchFields = ['staffName', 'status'];
    protected sessionScoped = true;
    protected defaultLimit = 500;

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }

    /**
     * Save a whole day's register in one call. Marking a register is naturally
     * repeated — a teacher arrives late and the admin re-saves — so each row is
     * an upsert on the (staffId, date) unique key rather than a plain insert.
     */
    async markDay(entries: any[]) {
        const rows = await this.prisma.$transaction(
            entries.map((e) =>
                this.prisma.staffAttendance.upsert({
                    where: { staffId_date: { staffId: e.staffId, date: e.date } },
                    create: e,
                    update: { status: e.status, note: e.note, term: e.term, year: e.year },
                }),
            ),
        );
        await this.audit.log({
            action: 'STAFF_ATTENDANCE_MARKED',
            entity: this.entity,
            entityId: entries[0]?.date ?? 'bulk',
            after: { date: entries[0]?.date, count: rows.length },
        });
        return rows;
    }

    /** The register for one date, used to pre-fill the marking screen. */
    async findByDate(date: string) {
        const data = await this.prisma.staffAttendance.findMany({
            where: { date },
            orderBy: { staffName: 'asc' },
        });
        return { data, total: data.length, totalPages: 1 };
    }

    /**
     * Per-staff attendance totals for a term, which is what the school actually
     * files at term's end. Aggregated in SQL by (staffId, status) so the report
     * doesn't pull every row of the term into memory.
     */
    async termReport(term: string, year: number): Promise<StaffTermReport> {
        const grouped = await this.prisma.staffAttendance.groupBy({
            by: ['staffId', 'staffName', 'status'],
            where: { term, year },
            _count: { _all: true },
        });

        const dates = await this.prisma.staffAttendance.findMany({
            where: { term, year },
            select: { date: true },
            distinct: ['date'],
            orderBy: { date: 'asc' },
        });

        const byStaff = new Map<string, StaffTermReportRow>();
        for (const g of grouped) {
            const row =
                byStaff.get(g.staffId) ??
                { staffId: g.staffId, staffName: g.staffName, present: 0, absent: 0, late: 0, leave: 0, marked: 0, rate: 0 };
            const status = g.status as StaffAttendanceStatus;
            if ((STAFF_ATTENDANCE_STATUSES as readonly string[]).includes(status)) {
                row[status] += g._count._all;
            }
            row.marked += g._count._all;
            byStaff.set(g.staffId, row);
        }

        const rows = [...byStaff.values()]
            .map((r) => ({ ...r, rate: rateOf(r) }))
            .sort((a, b) => a.staffName.localeCompare(b.staffName));

        const totals = rows.reduce(
            (acc, r) => ({
                present: acc.present + r.present,
                absent: acc.absent + r.absent,
                late: acc.late + r.late,
                leave: acc.leave + r.leave,
                marked: acc.marked + r.marked,
                rate: 0,
            }),
            { present: 0, absent: 0, late: 0, leave: 0, marked: 0, rate: 0 },
        );

        return {
            term,
            year,
            schoolDays: dates.length,
            firstDate: dates[0]?.date ?? null,
            lastDate: dates[dates.length - 1]?.date ?? null,
            rows,
            totals: { ...totals, rate: rateOf(totals) },
        };
    }
}

// Approved leave is deliberately excluded from the denominator: a teacher on
// sanctioned leave shouldn't score worse than one who was never marked. Late
// still counts as having turned up.
function rateOf(r: { present: number; absent: number; late: number }) {
    const expected = r.present + r.absent + r.late;
    if (expected === 0) return 0;
    return Math.round(((r.present + r.late) / expected) * 1000) / 10;
}
