import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { AttendanceService } from './attendance.service';
import { UpsertAttendanceDto } from './attendance.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('attendance')
export class AttendanceController {
    constructor(private readonly service: AttendanceService) { }

    @Get()
    @ApiQuery({ name: 'date', required: false })
    @ApiQuery({ name: 'className', required: false })
    find(@Query('date') date?: string, @Query('className') className?: string) {
        return this.service.find(date, className);
    }

    @Post()
    upsert(@Body() dto: UpsertAttendanceDto) {
        return this.service.upsert(dto);
    }
}
