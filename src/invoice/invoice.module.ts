import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { AuditModule } from 'src/audit/audit.module';
import { CashAccountModule } from 'src/cash-account/cash-account.module';

@Module({
  imports: [AuditModule, CashAccountModule],
  controllers: [InvoiceController],
  providers: [InvoiceService],
})
export class InvoiceModule {}
