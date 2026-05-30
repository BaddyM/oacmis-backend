import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CashAccountController } from './cash-account.controller';
import { CashAccountService } from './cash-account.service';
import { LedgerService } from './ledger.service';

// Note: AuthModule is intentionally not imported here. Applying @UseGuards(AuthGuard)
// only needs JwtService (registered global in AuthModule) and the global cache +
// PrismaService (provided below). Importing AuthModule would create a cycle:
// AuthModule -> UserModule -> CashAccountModule -> AuthModule.
@Module({
  controllers: [CashAccountController],
  providers: [CashAccountService, LedgerService, PrismaService],
  exports: [LedgerService],
})
export class CashAccountModule {}
