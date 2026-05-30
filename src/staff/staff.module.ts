import { Module } from '@nestjs/common';
import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { CashAccountModule } from 'src/cash-account/cash-account.module';

@Module({
  imports: [CashAccountModule],
  controllers: [StaffController],
  providers: [StaffService, PrismaService],
})
export class StaffModule {}
