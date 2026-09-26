import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { PagePermissionsGuard } from 'src/auth/page-permissions.guard';
import { RequiresPage } from 'src/auth/requires-page.decorator';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { TransportService } from './transport.service';
import { CreateBusRouteDto, UpdateBusRouteDto } from './transport.dto';
import { parseListQuery } from 'src/common/list-query';

@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard, PagePermissionsGuard)
@RequiresPage('transport')
@Controller('transport')
export class TransportController {
    constructor(private readonly service: TransportService) { }

    @Roles('admin')

    @Post()
    create(@Body() dto: CreateBusRouteDto) {
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

    @Roles('admin')

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateBusRouteDto) {
        return this.service.update(id, dto);
    }

    @Roles('admin')

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}
