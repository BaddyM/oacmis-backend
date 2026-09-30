import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditModule } from 'src/audit/audit.module';
import { SmsModule } from 'src/sms/sms.module';
import { WalletsService } from './wallets.service';
import { WalletTransactionsService } from './wallet-transactions.service';
import { WalletsController } from './wallets.controller';

@Module({
    imports: [AuditModule, SmsModule],
    controllers: [WalletsController],
    providers: [WalletsService, WalletTransactionsService, PrismaService, JwtService],
})
export class WalletsModule { }
