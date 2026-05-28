import { Module } from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { ExpenseController } from './expense.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { CashAccountModule } from 'src/cash-account/cash-account.module';

@Module({
  imports: [CashAccountModule],
  controllers: [ExpenseController],
  providers: [ExpenseService, PrismaService],
})
export class ExpenseModule {}
