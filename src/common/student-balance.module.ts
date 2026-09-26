import { Global, Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StudentBalanceService } from './student-balance.service';

// Global because FeesClearedGuard runs on controllers in several modules, and a
// guard resolves its dependencies from the module its controller lives in.
@Global()
@Module({
    providers: [StudentBalanceService, PrismaService],
    exports: [StudentBalanceService],
})
export class StudentBalanceModule { }
