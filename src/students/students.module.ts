import { Module } from '@nestjs/common';
import { StudentsService } from './students.service';
import { StudentSelfService } from './student-self.service';
import { StudentAccountsService } from './student-accounts.service';
import { StudentsController } from './students.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuditModule } from 'src/audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [StudentsController],
  providers: [StudentsService, StudentSelfService, StudentAccountsService, PrismaService, JwtService],
  exports: [StudentsService, StudentAccountsService],
})
export class StudentsModule {}
