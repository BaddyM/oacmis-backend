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
        const ops = marks.map((m) => {
            // Nursery entries carry a comment and no score; primary/secondary the
            // reverse. Only overwrite the field(s) actually supplied so a save of
            // one never wipes the other.
            const hasScore = m.score !== undefined && m.score !== null;
            const hasComment = m.comment !== undefined;
            return this.prisma.examMark.upsert({
                where: {
                    level_term_className_subject_topic_studentId: {
                        level, term, className, subject, topic, studentId: m.studentId,
                    },
                },
                create: {
                    level, term, className, subject, topic, studentId: m.studentId,
                    ...(hasScore ? { score: m.score! } : {}),
                    ...(hasComment ? { comment: m.comment! } : {}),
                },
                update: {
                    ...(hasScore ? { score: m.score! } : {}),
                    ...(hasComment ? { comment: m.comment! } : {}),
                },
            });
        });
        await this.prisma.$transaction(ops);
        return { upserted: ops.length };
    }
}
