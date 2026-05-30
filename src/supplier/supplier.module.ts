import { Module } from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { SupplierController } from './supplier.controller';
import { AuditModule } from 'src/audit/audit.module';
import { CashAccountModule } from 'src/cash-account/cash-account.module';

@Module({
  imports: [AuditModule, CashAccountModule],
  controllers: [SupplierController],
  providers: [SupplierService],
})
export class SupplierModule {}
