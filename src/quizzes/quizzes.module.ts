import { Module } from '@nestjs/common';
import { QuizzesService, QuizSubmissionsService } from './quizzes.service';
import { QuizzesController, QuizSubmissionsController } from './quizzes.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuditModule } from 'src/audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [QuizzesController, QuizSubmissionsController],
  providers: [QuizzesService, QuizSubmissionsService, PrismaService, JwtService],
})
export class QuizzesModule {}
