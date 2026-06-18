import { Module } from '@nestjs/common';
import { ExamMarksService } from './exam-marks.service';
import { ExamMarksController } from './exam-marks.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [ExamMarksController],
  providers: [ExamMarksService, PrismaService, JwtService],
})
export class ExamMarksModule {}
