import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { StudentFeesService } from './student-fees.service';
import { CreateFeeRecordDto, UpdateFeeRecordDto } from './student-fees.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('student-fees')
export class StudentFeesController {
    constructor(private readonly service: StudentFeesService) { }

    @Roles('admin')

    @Post()
    create(@Body() dto: CreateFeeRecordDto) {
        return this.service.create(dto);
    }

    @Get()
    findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
        @Query('studentId') studentId?: string,
        @Query('className') className?: string,
        @Query('term') term?: string,
        @Query('status') status?: string,
    ) {
        if (studentId || className || term) return this.service.findFiltered({ studentId, className, term });
        return this.service.browse(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20, search, status);
    }

    // Accurate collection totals (not affected by pagination). Declared before
    // ':id' so it isn't captured by the param route.
    @Get('summary')
    summary() {
        return this.service.summary();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @Roles('admin')

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateFeeRecordDto) {
        return this.service.update(id, dto);
    }

    @Roles('admin')

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}
