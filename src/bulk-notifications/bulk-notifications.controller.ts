import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { PagePermissionsGuard } from 'src/auth/page-permissions.guard';
import { RequiresPage } from 'src/auth/requires-page.decorator';
import { BulkNotificationsService } from './bulk-notifications.service';
import { CreateBulkNotificationDto, UpdateBulkNotificationDto } from './bulk-notifications.dto';
import { parseListQuery } from 'src/common/list-query';

@ApiBearerAuth()
@UseGuards(AuthGuard, PagePermissionsGuard)
@RequiresPage('bulk-communication', 'notifications')
@Controller('bulk-notifications')
export class BulkNotificationsController {
    constructor(private readonly service: BulkNotificationsService) { }

    @Post()
    create(@Body() dto: CreateBulkNotificationDto) {
        return this.service.create(dto);
    }

    @Get()
    findAll(@Query() query: Record<string, string>) {
        const q = parseListQuery(query);
        return this.service.findAll(q.page, q.limit, q.search, q.term, q.year, q.filters);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateBulkNotificationDto) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}
