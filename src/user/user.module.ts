import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuditModule } from 'src/audit/audit.module';
import { CashAccountModule } from 'src/cash-account/cash-account.module';

@Module({
  imports: [AuditModule, CashAccountModule],
  controllers: [UserController],
  providers: [UserService, PrismaService, JwtService],
  exports: [UserService],
})
export class UserModule {}
