import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditModule } from 'src/audit/audit.module';
import { SmsModule } from 'src/sms/sms.module';
import { SickBayService } from './sick-bay.service';
import { SickBayController } from './sick-bay.controller';

@Module({
    imports: [AuditModule, SmsModule],
    controllers: [SickBayController],
    providers: [SickBayService, PrismaService, JwtService],
})
export class SickBayModule { }
