import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { PagePermissionsGuard } from 'src/auth/page-permissions.guard';
import { RequiresPage } from 'src/auth/requires-page.decorator';
import { PromotionsService } from './promotions.service';
import { RunPromotionDto } from './promotions.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard, PagePermissionsGuard)
@RequiresPage('promotions')
@Controller('promotions')
export class PromotionsController {
    constructor(private readonly service: PromotionsService) { }

    // The class roster to mark up, with each pupil's outstanding balance.
    @Get('roster')
    roster(@Query('className') className: string) {
        return this.service.roster(className);
    }

    // Past promotion decisions — the audit trail.
    @Get()
    findAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('search') search?: string) {
        return this.service.findAll(page ? parseInt(page) : 1, limit ? parseInt(limit) : 200, search);
    }

    @Post('run')
    run(@Body() dto: RunPromotionDto) {
        return this.service.run(dto);
    }
}
