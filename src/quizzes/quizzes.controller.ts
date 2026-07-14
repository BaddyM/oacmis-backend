import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { AuthedRequest } from 'src/common/authed-request';
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
    create(@Req() req: AuthedRequest, @Body() dto: CreateQuizDto) {
        return this.service.createOwned(dto, req.user);
    }

    // A teacher sees only the quizzes they authored; admins see all, and
    // students keep the full published list they sit quizzes from.
    @Get()
    findAll(@Req() req: AuthedRequest, @Query('page') page?: string, @Query('limit') limit?: string, @Query('search') search?: string, @Query('term') term?: string, @Query('year') year?: string) {
        return this.service.findAllOwned(req.user, page ? parseInt(page) : 1, limit ? parseInt(limit) : 200, search, term, year ? parseInt(year) : undefined);
    }

    @Get(':id')
    findOne(@Req() req: AuthedRequest, @Param('id') id: string) {
        return this.service.findOneOwned(id, req.user);
    }

    @Patch(':id')
    update(@Req() req: AuthedRequest, @Param('id') id: string, @Body() dto: UpdateQuizDto) {
        return this.service.updateOwned(id, dto, req.user);
    }

    @Delete(':id')
    remove(@Req() req: AuthedRequest, @Param('id') id: string) {
        return this.service.removeOwned(id, req.user);
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
