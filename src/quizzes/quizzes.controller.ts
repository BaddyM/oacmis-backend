import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { QuizzesService, QuizSubmissionsService } from './quizzes.service';
import {
    CreateQuizDto,
    UpdateQuizDto,
    CreateQuizSubmissionDto,
    UpdateQuizSubmissionDto,
} from './quizzes.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('quizzes')
export class QuizzesController {
    constructor(private readonly service: QuizzesService) { }

    @Post()
    create(@Body() dto: CreateQuizDto) {
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
    update(@Param('id') id: string, @Body() dto: UpdateQuizDto) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('quiz-submissions')
export class QuizSubmissionsController {
    constructor(private readonly service: QuizSubmissionsService) { }

    @Post()
    create(@Body() dto: CreateQuizSubmissionDto) {
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
    update(@Param('id') id: string, @Body() dto: UpdateQuizSubmissionDto) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}
