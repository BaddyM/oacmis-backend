import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { PagePermissionsGuard } from 'src/auth/page-permissions.guard';
import { RequiresPage } from 'src/auth/requires-page.decorator';
import type { AuthedRequest } from 'src/common/authed-request';
import { parseListQuery } from 'src/common/list-query';
import { SmsService } from './sms.service';
import { SmsBroadcastService } from './sms-broadcast.service';
import { SmsLogsService } from './sms-logs.service';
import { SendSmsDto } from './sms.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard, PagePermissionsGuard)
@RequiresPage('bulk-communication')
@Controller('sms')
export class SmsController {
    constructor(
        private readonly sms: SmsService,
        private readonly broadcast: SmsBroadcastService,
        private readonly logs: SmsLogsService,
    ) { }

    // Every page that can text a parent shows whether SMS is set up and what
    // credit is left, so this one is open to all of them.
    @RequiresPage('bulk-communication', 'sick-bay', 'pocket-money')
    @Get('status')
    async status() {
        if (!this.sms.isConfigured()) return { configured: false, balance: null, currency: 'UGX' };
        try {
            return { configured: true, balance: await this.sms.balance(), currency: 'UGX' };
        } catch (err) {
            return {
                configured: true,
                balance: null,
                currency: 'UGX',
                error: err instanceof Error ? err.message : 'Could not read balance',
            };
        }
    }

    @Get('audience-count')
    count(
        @Query('audience') audience: string,
        @Query('className') className?: string,
        @Query('numbers') numbers?: string,
        @Query('message') message?: string,
    ) {
        return this.broadcast.count(audience, className, numbers, message);
    }

    @Post('send')
    send(@Body() dto: SendSmsDto, @Req() req: AuthedRequest) {
        return this.broadcast.send(dto, req.user?.id);
    }

    @Get('logs')
    list(@Query() query: Record<string, string>) {
        const q = parseListQuery(query);
        return this.logs.findAll(q.page, q.limit, q.search, q.term, q.year, q.filters);
    }
}
