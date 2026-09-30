import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { PagePermissionsGuard } from 'src/auth/page-permissions.guard';
import { RequiresPage, SelfServiceRoute } from 'src/auth/requires-page.decorator';
import type { AuthedRequest } from 'src/common/authed-request';
import { SubscriptionService } from './subscription.service';
import { GrantSubscriptionDto, RevokeSubscriptionDto, UpdateSubscriptionDto } from './subscription.dto';

// Viewing the history needs the Subscription page; changing anything needs the
// system owner (Administrator) account, checked in the service.
@ApiBearerAuth()
@UseGuards(AuthGuard, PagePermissionsGuard)
@RequiresPage('subscription')
@Controller('subscription')
export class SubscriptionController {
    constructor(private readonly service: SubscriptionService) { }

    // Every signed-in user's app polls this to know whether it is read-only.
    @SelfServiceRoute()
    @Get('status')
    status() {
        return this.service.status();
    }

    @Get()
    list() {
        return this.service.list();
    }

    @Post()
    grant(@Body() dto: GrantSubscriptionDto, @Req() req: AuthedRequest) {
        return this.service.grant(dto, req.user.id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateSubscriptionDto, @Req() req: AuthedRequest) {
        return this.service.update(id, dto, req.user.id);
    }

    @Post(':id/revoke')
    revoke(@Param('id') id: string, @Body() dto: RevokeSubscriptionDto, @Req() req: AuthedRequest) {
        return this.service.revoke(id, dto.reason, req.user.id);
    }
}
