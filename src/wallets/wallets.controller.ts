import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { PagePermissionsGuard } from 'src/auth/page-permissions.guard';
import { RequiresPage } from 'src/auth/requires-page.decorator';
import type { AuthedRequest } from 'src/common/authed-request';
import { parseListQuery } from 'src/common/list-query';
import { WalletsService } from './wallets.service';
import { WalletTransactionsService } from './wallet-transactions.service';
import { DepositDto, ReverseDto, SpendDto, UpdateWalletDto } from './wallets.dto';

// Managing money in and out is the Pocket Money page. The canteen till only
// looks a pupil up and charges them — a canteen attendant granted just that
// page can't deposit, withdraw, reverse or change limits.
@ApiBearerAuth()
@UseGuards(AuthGuard, PagePermissionsGuard)
@RequiresPage('pocket-money')
@Controller('wallets')
export class WalletsController {
    constructor(
        private readonly wallets: WalletsService,
        private readonly transactions: WalletTransactionsService,
    ) { }

    @Get()
    findAll(@Query() query: Record<string, string>) {
        const q = parseListQuery(query);
        return this.wallets.findAll(q.page, q.limit, q.search, q.term, q.year, q.filters);
    }

    @RequiresPage('pocket-money', 'canteen')
    @Get('lookup')
    lookup(@Query('q') q?: string, @Query('studentId') studentId?: string) {
        return this.wallets.lookup(q, studentId);
    }

    @RequiresPage('pocket-money', 'canteen')
    @Get('transactions')
    listTransactions(@Query() query: Record<string, string>) {
        const q = parseListQuery(query);
        return this.transactions.findAll(q.page, q.limit, q.search, q.term, q.year, q.filters);
    }

    @Post('deposit')
    deposit(@Body() dto: DepositDto, @Req() req: AuthedRequest) {
        return this.wallets.deposit(dto, req.user?.id);
    }

    @Post('transactions/:id/reverse')
    reverse(@Param('id') id: string, @Body() dto: ReverseDto, @Req() req: AuthedRequest) {
        return this.wallets.reverse(id, dto.reason, req.user?.id);
    }

    @RequiresPage('pocket-money', 'canteen')
    @Post(':id/purchase')
    purchase(@Param('id') id: string, @Body() dto: SpendDto, @Req() req: AuthedRequest) {
        return this.wallets.spend(id, 'purchase', dto, req.user?.id);
    }

    @Post(':id/withdraw')
    withdraw(@Param('id') id: string, @Body() dto: SpendDto, @Req() req: AuthedRequest) {
        return this.wallets.spend(id, 'withdrawal', dto, req.user?.id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateWalletDto) {
        return this.wallets.updateSettings(id, dto);
    }
}
