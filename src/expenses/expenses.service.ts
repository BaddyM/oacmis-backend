import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { BaseCrudService } from 'src/common/base-crud.service';

export interface CategoryTotal {
    category: string;
    amount: number;
    /** Share of total expenditure, as a percentage. */
    share: number;
}

export interface FinancialStatement {
    term: string;
    year: number;
    income: {
        /** Billed to parents this term. */
        feesBilled: number;
        /** Actually received. */
        feesCollected: number;
        feesOutstanding: number;
        /** Collected over billed, as a percentage. */
        collectionRate: number;
    };
    expenditure: {
        total: number;
        byCategory: CategoryTotal[];
    };
    /** Collected minus spent. Negative means the term ran at a loss. */
    net: number;
}

@Injectable()
export class ExpensesService extends BaseCrudService {
    protected delegate = this.prisma.expense;
    protected entity = 'Expense';
    protected searchFields = ['category', 'description', 'payee', 'reference'];
    protected sessionScoped = true;
    protected defaultLimit = 100;

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }

    /**
     * Termly income vs expenditure.
     *
     * Income is fees *collected* (FeeRecord.paidAmount), not billed, so the net
     * figure reflects cash the school actually has. Salaries are only counted if
     * they were recorded as an Expense — PayrollRecord is keyed by month, which
     * doesn't map onto terms, so folding it in would produce a confidently wrong
     * number. See the note in the statement UI.
     */
    async statement(term: string, year: number): Promise<FinancialStatement> {
        const [fees, expenseTotal, grouped] = await this.prisma.$transaction([
            this.prisma.feeRecord.aggregate({
                where: { term, year },
                _sum: { amount: true, paidAmount: true },
            }),
            this.prisma.expense.aggregate({ where: { term, year }, _sum: { amount: true } }),
            this.prisma.expense.groupBy({
                by: ['category'],
                where: { term, year },
                _sum: { amount: true },
                orderBy: { category: 'asc' },
            }),
        ]);

        const feesBilled = fees._sum.amount || 0;
        const feesCollected = fees._sum.paidAmount || 0;
        const total = expenseTotal._sum.amount || 0;

        const byCategory: CategoryTotal[] = grouped
            .map((g) => {
                const amount = g._sum?.amount || 0;
                return {
                    category: g.category,
                    amount,
                    share: total > 0 ? Math.round((amount / total) * 1000) / 10 : 0,
                };
            })
            .sort((a, b) => b.amount - a.amount);

        return {
            term,
            year,
            income: {
                feesBilled,
                feesCollected,
                feesOutstanding: Math.max(0, feesBilled - feesCollected),
                collectionRate: feesBilled > 0 ? Math.round((feesCollected / feesBilled) * 1000) / 10 : 0,
            },
            expenditure: { total, byCategory },
            net: feesCollected - total,
        };
    }
}
