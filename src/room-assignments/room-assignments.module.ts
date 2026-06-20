import { Module } from '@nestjs/common';
import { RoomAssignmentsService } from './room-assignments.service';
import { RoomAssignmentsController } from './room-assignments.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuditModule } from 'src/audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [RoomAssignmentsController],
  providers: [RoomAssignmentsService, PrismaService, JwtService],
})
export class RoomAssignmentsModule {}
