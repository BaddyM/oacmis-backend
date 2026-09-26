import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { PagePermissionsGuard } from 'src/auth/page-permissions.guard';
import { RequiresPage } from 'src/auth/requires-page.decorator';
import { RESULTS_PAGES } from 'src/auth/page-groups';
import { ExamAssignmentsService } from './exam-assignments.service';
import { CreateExamAssignmentDto, UpdateExamAssignmentDto } from './exam-assignments.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard, PagePermissionsGuard)
@RequiresPage(...RESULTS_PAGES)
@Controller('exam-assignments')
export class ExamAssignmentsController {
    constructor(private readonly service: ExamAssignmentsService) { }

    @Post()
    create(@Body() dto: CreateExamAssignmentDto) {
        return this.service.create(dto);
    }

    @Get()
    findAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('search') search?: string, @Query('term') term?: string, @Query('year') year?: string) {
        return this.service.findAll(page ? parseInt(page) : 1, limit ? parseInt(limit) : 500, search, term, year ? parseInt(year) : undefined);
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
