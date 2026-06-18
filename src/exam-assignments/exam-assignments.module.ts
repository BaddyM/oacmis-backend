import { Module } from '@nestjs/common';
import { ExamAssignmentsService } from './exam-assignments.service';
import { ExamAssignmentsController } from './exam-assignments.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuditModule } from 'src/audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [ExamAssignmentsController],
  providers: [ExamAssignmentsService, PrismaService, JwtService],
})
export class ExamAssignmentsModule {}
