import { Module } from '@nestjs/common';
import { BranchPayablesService } from './branch-payables.service';
import { BranchPayablesController } from './branch-payables.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CashAccountModule } from 'src/cash-account/cash-account.module';

@Module({
  imports: [PrismaModule, CashAccountModule],
  providers: [BranchPayablesService],
  controllers: [BranchPayablesController],
  exports: [BranchPayablesService],
})
export class BranchPayablesModule {}
