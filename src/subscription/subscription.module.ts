import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditModule } from 'src/audit/audit.module';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionGuard } from './subscription.guard';

@Global()
@Module({
    imports: [AuditModule],
    controllers: [SubscriptionController],
    providers: [
        SubscriptionService,
        PrismaService,
        JwtService,
        // Applies to every route in the app: read-only when not subscribed.
        { provide: APP_GUARD, useClass: SubscriptionGuard },
    ],
    exports: [SubscriptionService],
})
export class SubscriptionModule { }
