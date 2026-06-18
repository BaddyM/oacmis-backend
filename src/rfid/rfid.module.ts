import { Module } from '@nestjs/common';
import { RfidDevicesService, RfidRecordsService } from './rfid.service';
import { RfidDevicesController, RfidRecordsController } from './rfid.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuditModule } from 'src/audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [RfidDevicesController, RfidRecordsController],
  providers: [RfidDevicesService, RfidRecordsService, PrismaService, JwtService],
})
export class RfidModule {}
