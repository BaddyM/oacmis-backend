import { Module } from '@nestjs/common';
import { BooksService, BorrowsService } from './library.service';
import { BooksController, BorrowsController } from './library.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuditModule } from 'src/audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [BooksController, BorrowsController],
  providers: [BooksService, BorrowsService, PrismaService, JwtService],
})
export class LibraryModule {}
