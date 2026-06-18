import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { ExamAssignmentsService } from './exam-assignments.service';
import { CreateExamAssignmentDto, UpdateExamAssignmentDto } from './exam-assignments.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('exam-assignments')
export class ExamAssignmentsController {
    constructor(private readonly service: ExamAssignmentsService) { }

    @Post()
    create(@Body() dto: CreateExamAssignmentDto) {
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
    update(@Param('id') id: string, @Body() dto: UpdateExamAssignmentDto) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}
