import { Module } from '@nestjs/common';
import { BlastsService } from './blasts.service';
import { BlastsController } from './blasts.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuditModule } from 'src/audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [BlastsController],
  providers: [BlastsService, PrismaService, JwtService],
})
export class BlastsModule {}
