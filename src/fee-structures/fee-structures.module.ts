import { Module } from '@nestjs/common';
import { FeeStructuresService } from './fee-structures.service';
import { FeeStructuresController } from './fee-structures.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuditModule } from 'src/audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [FeeStructuresController],
  providers: [FeeStructuresService, PrismaService, JwtService],
})
export class FeeStructuresModule {}
