import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { BaseCrudService, FilterSpec, SummarySpec } from 'src/common/base-crud.service';

@Injectable()
export class PayrollService extends BaseCrudService {
    protected delegate = this.prisma.payrollRecord;
    protected entity = 'PayrollRecord';
    protected searchFields = ['name', 'employeeId', 'department', 'position'];

    protected filterSpec: Record<string, FilterSpec> = {
        status: { field: 'status', op: 'equals' },
        department: { field: 'department', op: 'contains' },
        position: { field: 'position', op: 'contains' },
        month: { field: 'month', op: 'equals' },
        year: { field: 'year', op: 'equals', numeric: true },
        minNet: { field: 'netSalary', op: 'gte' },
        maxNet: { field: 'netSalary', op: 'lte' },
    };

    // The page derives its "average salary" tile from totalPayroll/total, so
    // there's no separate average here.
    protected summarySpec: Record<string, SummarySpec> = {
        total: { kind: 'count' },
        totalPayroll: { kind: 'sum', field: 'netSalary' },
        pending: { kind: 'countWhere', where: { status: 'pending' } },
        employees: { kind: 'distinct', field: 'employeeId' },
    };

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }
}
