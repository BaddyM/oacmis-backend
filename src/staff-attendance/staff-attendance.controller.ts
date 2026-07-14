import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { StaffAttendanceService } from './staff-attendance.service';
import {
    CreateStaffAttendanceDto,
    MarkStaffAttendanceDto,
    UpdateStaffAttendanceDto,
} from './staff-attendance.dto';

// The staff register is HR data: only an admin may read or write it.
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
@Controller('staff-attendance')
export class StaffAttendanceController {
    constructor(private readonly service: StaffAttendanceService) { }

    @Post()
    create(@Body() dto: CreateStaffAttendanceDto) {
        return this.service.create(dto);
    }

    // Save a whole day's register in one request.
    @Post('mark')
    mark(@Body() dto: MarkStaffAttendanceDto) {
        return this.service.markDay(dto.entries);
    }

    // Termly summary per staff member — the report the school files at term end.
    @Get('report')
    report(@Query('term') term: string, @Query('year') year: string) {
        return this.service.termReport(term, parseInt(year));
    }

    @Get('by-date')
    byDate(@Query('date') date: string) {
        return this.service.findByDate(date);
    }

    @Get()
    findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
        @Query('term') term?: string,
        @Query('year') year?: string,
    ) {
        return this.service.findAll(
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 500,
            search,
            term,
            year ? parseInt(year) : undefined,
        );
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateStaffAttendanceDto) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}
