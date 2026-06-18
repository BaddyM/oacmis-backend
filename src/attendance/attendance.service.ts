import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpsertAttendanceDto } from './attendance.dto';

@Injectable()
export class AttendanceService {
    constructor(private readonly prisma: PrismaService) { }

    find(date?: string, className?: string) {
        return this.prisma.attendanceRecord.findMany({
            where: {
                ...(date ? { date } : {}),
                ...(className ? { className } : {}),
            },
        });
    }

    upsert(dto: UpsertAttendanceDto) {
        const { date, className, studentId, status } = dto;
        return this.prisma.attendanceRecord.upsert({
            where: { date_className_studentId: { date, className, studentId } },
            create: { date, className, studentId, status },
            update: { status },
        });
    }
}
