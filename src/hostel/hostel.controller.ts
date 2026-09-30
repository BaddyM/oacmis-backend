import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { PagePermissionsGuard } from 'src/auth/page-permissions.guard';
import { RequiresPage } from 'src/auth/requires-page.decorator';
import { HostelService } from './hostel.service';
import { parseListQuery } from 'src/common/list-query';
import { CreateHostelRoomDto, UpdateHostelRoomDto } from './hostel.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard, PagePermissionsGuard)
@RequiresPage('hostel')
@Controller('hostel')
export class HostelController {
    constructor(private readonly service: HostelService) { }


    @Post()
    create(@Body() dto: CreateHostelRoomDto) {
        return this.service.create(dto);
    }

    @Get()
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'search', required: false, description: 'Matches hostelName, roomNumber or warden' })
    @ApiQuery({ name: 'hostelName', required: false })
    @ApiQuery({ name: 'type', required: false, description: 'single | double | triple | dormitory' })
    @ApiQuery({ name: 'gender', required: false, description: 'male | female | mixed' })
    @ApiQuery({ name: 'status', required: false, description: 'available | full | maintenance' })
    @ApiQuery({ name: 'warden', required: false })
    findAll(@Query() query: Record<string, string>) {
        const q = parseListQuery(query);
        return this.service.findAll(q.page, q.limit, q.search, q.term, q.year, q.filters);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }


    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateHostelRoomDto) {
        return this.service.update(id, dto);
    }


    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}
