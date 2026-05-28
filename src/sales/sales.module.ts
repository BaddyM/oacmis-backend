import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { AuditModule } from 'src/audit/audit.module';
import { CashAccountModule } from 'src/cash-account/cash-account.module';

@Module({
  imports: [AuditModule, CashAccountModule],
  controllers: [SalesController],
  providers: [SalesService],
})
export class SalesModule {}
