import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { StudentFeesService } from './student-fees.service';
import { CreateFeeRecordDto, UpdateFeeRecordDto } from './student-fees.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('student-fees')
export class StudentFeesController {
    constructor(private readonly service: StudentFeesService) { }

    @Post()
    create(@Body() dto: CreateFeeRecordDto) {
        return this.service.create(dto);
    }

    @Get()
    findAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('search') search?: string) {
        return this.service.findAll(page ? parseInt(page) : 1, limit ? parseInt(limit) : 50, search);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateFeeRecordDto) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}
