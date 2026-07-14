import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { BaseCrudService } from 'src/common/base-crud.service';
import { OwnedCrudService } from 'src/common/owned-crud.service';

@Injectable()
export class QuizzesService extends OwnedCrudService {
    protected delegate = this.prisma.quiz;
    protected entity = 'Quiz';
    protected searchFields = ['title', 'subject', 'classTarget', 'status'];
    protected sessionScoped = true;

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }
}

@Injectable()
export class QuizSubmissionsService extends BaseCrudService {
    protected delegate = this.prisma.quizSubmission;
    protected entity = 'QuizSubmission';
    protected searchFields = ['studentName', 'quizId', 'studentId'];

    constructor(prisma: PrismaService, audit: AuditService) {
        super(prisma, audit);
    }
}
