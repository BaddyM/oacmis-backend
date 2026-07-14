import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { BaseCrudService } from 'src/common/base-crud.service';

interface FeeLineItem {
    name: string;
    amount: number;
}

export interface GenerateResult {
    className: string;
    term: string;
    year: number;
    /** Pupils on the class roster. */
    students: number;
    /** FeeRecords written. */
    created: number;
    /** (pupil, line item) pairs already billed and therefore left alone. */
    skipped: number;
    billedTotal: number;
    arrearsTotal: number;
    arrearsFrom: string | null;
}

// Terms run 1 → 2 → 3 within a year, so the term before Term 1 is Term 3 of the
// year before. Returns null for anything that isn't a recognised term label.
export function previousTerm(term: string, year: number): { term: string; year: number } | null {
    const match = /^Term\s*([123])$/i.exec(term.trim());
    if (!match) return null;
    const n = parseInt(match[1]);
    return n === 1 ? { term: 'Term 3', year: year - 1 } : { term: `Term ${n - 1}`, year };
}

@Injectable()
export class FeeStructuresService extends BaseCrudService {
    protected delegate = this.prisma.feeStructure;
    protected entity = 'FeeStructure';
    protected searchFields = ['className', 'term'];
    protected sessionScoped = true;

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }

    private lineItems(structure: any): FeeLineItem[] {
        const items = structure.items;
        return Array.isArray(items) ? (items as FeeLineItem[]) : [];
    }

    private sumItems(items: FeeLineItem[]) {
        return items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    }

    // `total` is derived, never trusted from the client — it must always equal
    // the sum of the line items or the collection figures drift.
    async create(data: any) {
        const items = Array.isArray(data.items) ? data.items : [];
        return super.create({ ...data, total: this.sumItems(items) });
    }

    async update(id: string, data: any) {
        if (!data.items) return super.update(id, data);
        return super.update(id, { ...data, total: this.sumItems(data.items) });
    }

    /**
     * Bill every pupil in the structure's class for this term.
     *
     * Idempotent per (pupil, line item): re-running after adding a line item
     * bills only the new one, so an accidental double-click can't double-charge
     * a parent. The whole run is one transaction — a partial roster billed
     * halfway would be worse than nothing.
     */
    async generate(id: string, carryForward = true): Promise<GenerateResult> {
        const structure = await this.prisma.feeStructure.findUnique({ where: { id } });
        if (!structure) throw new NotFoundException('FeeStructure not found');

        const items = this.lineItems(structure);
        if (items.length === 0) throw new BadRequestException('This fee structure has no line items');

        const students = await this.prisma.student.findMany({
            where: { className: structure.className, status: 'active' },
            select: { id: true, firstName: true, lastName: true },
        });
        if (students.length === 0) {
            throw new BadRequestException(`No active pupils in ${structure.className}`);
        }

        // What each pupil already has for this term, so we never bill twice.
        const existing = await this.prisma.feeRecord.findMany({
            where: { term: structure.term, year: structure.year, studentId: { in: students.map((s) => s.id) } },
            select: { studentId: true, feeType: true },
        });
        const alreadyBilled = new Set(existing.map((r) => `${r.studentId}::${r.feeType}`));

        const prev = previousTerm(structure.term, structure.year);
        const arrears =
            carryForward && prev
                ? await this.arrearsByStudent(prev, students.map((s) => s.id))
                : new Map<string, number>();
        const arrearsLabel = prev ? `Arrears (${prev.term} ${prev.year})` : null;

        const rows: any[] = [];
        let skipped = 0;
        let billedTotal = 0;
        let arrearsTotal = 0;

        for (const s of students) {
            const studentName = `${s.firstName} ${s.lastName}`;
            const base = {
                studentId: s.id,
                studentName,
                class: structure.className,
                term: structure.term,
                year: structure.year,
                dueDate: structure.dueDate,
                paidAmount: 0,
                status: 'pending',
                structureId: structure.id,
            };

            for (const item of items) {
                if (alreadyBilled.has(`${s.id}::${item.name}`)) { skipped++; continue; }
                rows.push({ ...base, feeType: item.name, amount: Number(item.amount) || 0 });
                billedTotal += Number(item.amount) || 0;
            }

            // Arrears ride as their own line rather than inflating tuition, so a
            // parent's invoice still shows what this term actually costs.
            const owed = arrears.get(s.id) ?? 0;
            if (owed > 0 && arrearsLabel) {
                if (alreadyBilled.has(`${s.id}::${arrearsLabel}`)) { skipped++; }
                else {
                    rows.push({ ...base, feeType: arrearsLabel, amount: owed });
                    arrearsTotal += owed;
                }
            }
        }

        if (rows.length > 0) {
            await this.prisma.$transaction(rows.map((data) => this.prisma.feeRecord.create({ data })));
        }

        const result: GenerateResult = {
            className: structure.className,
            term: structure.term,
            year: structure.year,
            students: students.length,
            created: rows.length,
            skipped,
            billedTotal,
            arrearsTotal,
            arrearsFrom: carryForward && prev ? `${prev.term} ${prev.year}` : null,
        };

        await this.audit.log({
            action: 'FEE_INVOICES_GENERATED',
            entity: this.entity,
            entityId: structure.id,
            after: result,
        });
        return result;
    }

    /** Unpaid balance per pupil, summed over the given term's records. */
    private async arrearsByStudent(prev: { term: string; year: number }, studentIds: string[]) {
        const map = new Map<string, number>();
        const rows = await this.prisma.feeRecord.findMany({
            where: { term: prev.term, year: prev.year, studentId: { in: studentIds } },
            select: { studentId: true, amount: true, paidAmount: true },
        });
        for (const r of rows) {
            if (!r.studentId) continue;
            const owed = Math.max(0, (r.amount || 0) - (r.paidAmount || 0));
            if (owed > 0) map.set(r.studentId, (map.get(r.studentId) || 0) + owed);
        }
        return map;
    }
}
