import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthModule } from 'src/auth/auth.module';
import { CashAccountController } from './cash-account.controller';
import { CashAccountService } from './cash-account.service';
import { LedgerService } from './ledger.service';

@Module({
  imports: [AuthModule],
  controllers: [CashAccountController],
  providers: [CashAccountService, LedgerService, PrismaService],
  exports: [LedgerService],
})
export class CashAccountModule {}
