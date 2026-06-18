import { Module } from '@nestjs/common';
import { BulkNotificationsService } from './bulk-notifications.service';
import { BulkNotificationsController } from './bulk-notifications.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuditModule } from 'src/audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [BulkNotificationsController],
  providers: [BulkNotificationsService, PrismaService, JwtService],
})
export class BulkNotificationsModule {}
