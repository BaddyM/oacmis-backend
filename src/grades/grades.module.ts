import { Module } from '@nestjs/common';
import { GradesService } from './grades.service';
import { GradesController } from './grades.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuditModule } from 'src/audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [GradesController],
  providers: [GradesService, PrismaService, JwtService],
})
export class GradesModule {}
