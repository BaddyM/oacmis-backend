import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { BaseCrudService } from 'src/common/base-crud.service';

@Injectable()
export class BooksService extends BaseCrudService {
    protected delegate = this.prisma.book;
    protected entity = 'Book';
    protected searchFields = ['title', 'author', 'isbn', 'category'];

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }
}

@Injectable()
export class BorrowsService extends BaseCrudService {
    protected delegate = this.prisma.borrowRecord;
    protected entity = 'BorrowRecord';
    protected searchFields = ['bookTitle', 'studentName', 'studentId'];

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }
}
