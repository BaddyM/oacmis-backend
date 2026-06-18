import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { GradesService } from './grades.service';
import { CreateGradeRecordDto, UpdateGradeRecordDto } from './grades.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('grades')
export class GradesController {
    constructor(private readonly service: GradesService) { }

    @Post()
    create(@Body() dto: CreateGradeRecordDto) {
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
    update(@Param('id') id: string, @Body() dto: UpdateGradeRecordDto) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}
