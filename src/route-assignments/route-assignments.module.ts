import { Module } from '@nestjs/common';
import { RouteAssignmentsService } from './route-assignments.service';
import { RouteAssignmentsController } from './route-assignments.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuditModule } from 'src/audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [RouteAssignmentsController],
  providers: [RouteAssignmentsService, PrismaService, JwtService],
})
export class RouteAssignmentsModule {}
