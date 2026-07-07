import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { AssignmentsService, AssignmentSubmissionsService } from './assignments.service';
import {
    CreateAssignmentDto,
    UpdateAssignmentDto,
    CreateAssignmentSubmissionDto,
    UpdateAssignmentSubmissionDto,
} from './assignments.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('assignments')
export class AssignmentsController {
    constructor(private readonly service: AssignmentsService) { }

    @Post()
    create(@Body() dto: CreateAssignmentDto) {
        return this.service.create(dto);
    }

    @Get()
    findAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('search') search?: string, @Query('term') term?: string, @Query('year') year?: string) {
        return this.service.findAll(page ? parseInt(page) : 1, limit ? parseInt(limit) : 200, search, term, year ? parseInt(year) : undefined);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateAssignmentDto) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('assignment-submissions')
export class AssignmentSubmissionsController {
    constructor(private readonly service: AssignmentSubmissionsService) { }

    @Post()
    create(@Body() dto: CreateAssignmentSubmissionDto) {
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
    update(@Param('id') id: string, @Body() dto: UpdateAssignmentSubmissionDto) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}
