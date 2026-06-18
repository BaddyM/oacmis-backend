import { Module } from '@nestjs/common';
import { FeePaymentsService } from './fee-payments.service';
import { FeePaymentsController } from './fee-payments.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuditModule } from 'src/audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [FeePaymentsController],
  providers: [FeePaymentsService, PrismaService, JwtService],
})
export class FeePaymentsModule {}
