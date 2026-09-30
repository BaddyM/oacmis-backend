import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditModule } from 'src/audit/audit.module';
import { SmsService } from './sms.service';
import { SmsBroadcastService } from './sms-broadcast.service';
import { SmsLogsService } from './sms-logs.service';
import { SmsController } from './sms.controller';

@Module({
    imports: [AuditModule],
    controllers: [SmsController],
    providers: [SmsService, SmsBroadcastService, SmsLogsService, PrismaService, JwtService],
    // Sick bay and wallets text parents through the same gateway.
    exports: [SmsService],
})
export class SmsModule { }
