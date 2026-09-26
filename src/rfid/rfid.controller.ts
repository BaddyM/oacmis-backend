import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { PagePermissionsGuard } from 'src/auth/page-permissions.guard';
import { RequiresPage } from 'src/auth/requires-page.decorator';
import { RfidDevicesService, RfidRecordsService } from './rfid.service';
import { parseListQuery } from 'src/common/list-query';
import {
    CreateRfidDeviceDto,
    UpdateRfidDeviceDto,
    CreateRfidRecordDto,
    UpdateRfidRecordDto,
} from './rfid.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard, PagePermissionsGuard)
@RequiresPage('rfid-attendance')
@Controller('rfid-devices')
export class RfidDevicesController {
    constructor(private readonly service: RfidDevicesService) { }

    @Post()
    create(@Body() dto: CreateRfidDeviceDto) {
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
    update(@Param('id') id: string, @Body() dto: UpdateRfidDeviceDto) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}

@ApiBearerAuth()
@UseGuards(AuthGuard, PagePermissionsGuard)
@RequiresPage('rfid-attendance', 'attendance')
@Controller('rfid-records')
export class RfidRecordsController {
    constructor(private readonly service: RfidRecordsService) { }

    @Post()
    create(@Body() dto: CreateRfidRecordDto) {
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
    update(@Param('id') id: string, @Body() dto: UpdateRfidRecordDto) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}
