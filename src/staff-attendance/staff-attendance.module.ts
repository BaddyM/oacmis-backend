import { Module } from '@nestjs/common';
import { StaffAttendanceService } from './staff-attendance.service';
import { StaffAttendanceController } from './staff-attendance.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuditModule } from 'src/audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [StaffAttendanceController],
  providers: [StaffAttendanceService, PrismaService, JwtService],
})
export class StaffAttendanceModule {}
