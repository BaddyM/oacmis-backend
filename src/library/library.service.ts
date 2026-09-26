import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { BaseCrudService, FilterSpec, SummarySpec } from 'src/common/base-crud.service';

@Injectable()
export class BooksService extends BaseCrudService {
    protected delegate = this.prisma.book;
    protected entity = 'Book';
    protected searchFields = ['title', 'author', 'isbn', 'category'];

    protected filterSpec: Record<string, FilterSpec> = {
        status: { field: 'status', op: 'equals' },
        category: { field: 'category', op: 'contains' },
        author: { field: 'author', op: 'contains' },
    };

    protected summarySpec: Record<string, SummarySpec> = {
        total: { kind: 'count' },
        totalCopies: { kind: 'sum', field: 'totalCopies' },
        availableCopies: { kind: 'sum', field: 'availableCopies' },
    };

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }
}

@Injectable()
export class BorrowsService extends BaseCrudService {
    protected delegate = this.prisma.borrowRecord;
    protected entity = 'BorrowRecord';
    protected searchFields = ['bookTitle', 'studentName', 'studentId'];

    // borrowDate/dueDate are ISO `YYYY-MM-DD` string columns — see the note on
    // CertificatesService.
    protected filterSpec: Record<string, FilterSpec> = {
        status: { field: 'status', op: 'equals' },
        studentName: { field: 'studentName', op: 'contains' },
        borrowDate: { field: 'borrowDate', op: 'equals' },
        dueDate: { field: 'dueDate', op: 'equals' },
    };

    protected summarySpec: Record<string, SummarySpec> = {
        total: { kind: 'count' },
        borrowed: { kind: 'countWhere', where: { status: 'borrowed' } },
        overdue: { kind: 'countWhere', where: { status: 'overdue' } },
    };

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }
}
