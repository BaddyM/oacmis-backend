import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { RfidDevicesService, RfidRecordsService } from './rfid.service';
import {
    CreateRfidDeviceDto,
    UpdateRfidDeviceDto,
    CreateRfidRecordDto,
    UpdateRfidRecordDto,
} from './rfid.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('rfid-devices')
export class RfidDevicesController {
    constructor(private readonly service: RfidDevicesService) { }

    @Post()
    create(@Body() dto: CreateRfidDeviceDto) {
        return this.service.create(dto);
    }

    @Get()
    findAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('search') search?: string) {
        return this.service.findAll(page ? parseInt(page) : 1, limit ? parseInt(limit) : 100, search);
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
@UseGuards(AuthGuard)
@Controller('rfid-records')
export class RfidRecordsController {
    constructor(private readonly service: RfidRecordsService) { }

    @Post()
    create(@Body() dto: CreateRfidRecordDto) {
        return this.service.create(dto);
    }

    @Get()
    findAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('search') search?: string) {
        return this.service.findAll(page ? parseInt(page) : 1, limit ? parseInt(limit) : 500, search);
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
