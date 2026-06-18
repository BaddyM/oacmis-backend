import { Module } from '@nestjs/common';
import { StudentFeesService } from './student-fees.service';
import { StudentFeesController } from './student-fees.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuditModule } from 'src/audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [StudentFeesController],
  providers: [StudentFeesService, PrismaService, JwtService],
})
export class StudentFeesModule {}
