import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BulkUpsertMarksDto } from './exam-marks.dto';

@Injectable()
export class ExamMarksService {
    constructor(private readonly prisma: PrismaService) { }

    find(query: { level?: string; term?: string; className?: string; subject?: string; topic?: string }) {
        return this.prisma.examMark.findMany({
            where: {
                ...(query.level ? { level: query.level } : {}),
                ...(query.term ? { term: query.term } : {}),
                ...(query.className ? { className: query.className } : {}),
                ...(query.subject ? { subject: query.subject } : {}),
                ...(query.topic !== undefined ? { topic: query.topic } : {}),
            },
        });
    }

    async bulkUpsert(dto: BulkUpsertMarksDto) {
        const { level, term, className, subject, marks } = dto;
        const topic = dto.topic ?? '';
        const ops = marks.map((m) =>
            this.prisma.examMark.upsert({
                where: {
                    level_term_className_subject_topic_studentId: {
                        level, term, className, subject, topic, studentId: m.studentId,
                    },
                },
                create: { level, term, className, subject, topic, studentId: m.studentId, score: m.score },
                update: { score: m.score },
            }),
        );
        await this.prisma.$transaction(ops);
        return { upserted: ops.length };
    }
}
