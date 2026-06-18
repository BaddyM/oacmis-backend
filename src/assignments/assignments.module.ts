import { Module } from '@nestjs/common';
import { AssignmentsService, AssignmentSubmissionsService } from './assignments.service';
import { AssignmentsController, AssignmentSubmissionsController } from './assignments.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuditModule } from 'src/audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [AssignmentsController, AssignmentSubmissionsController],
  providers: [AssignmentsService, AssignmentSubmissionsService, PrismaService, JwtService],
})
export class AssignmentsModule {}
