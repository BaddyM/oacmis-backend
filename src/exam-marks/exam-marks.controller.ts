import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { PagePermissionsGuard } from 'src/auth/page-permissions.guard';
import { RequiresPage } from 'src/auth/requires-page.decorator';
import { RESULTS_PAGES } from 'src/auth/page-groups';
import { ExamMarksService } from './exam-marks.service';
import { BulkUpsertMarksDto } from './exam-marks.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard, PagePermissionsGuard)
@RequiresPage(...RESULTS_PAGES)
@Controller('exam-marks')
export class ExamMarksController {
    constructor(private readonly service: ExamMarksService) { }

    @Get()
    @ApiQuery({ name: 'level', required: false })
    @ApiQuery({ name: 'term', required: false })
    @ApiQuery({ name: 'className', required: false })
    @ApiQuery({ name: 'subject', required: false })
    @ApiQuery({ name: 'topic', required: false })
    find(
        @Query('level') level?: string,
        @Query('term') term?: string,
        @Query('className') className?: string,
        @Query('subject') subject?: string,
        @Query('topic') topic?: string,
    ) {
        return this.service.find({ level, term, className, subject, topic });
    }

    @Post('bulk')
    bulkUpsert(@Body() dto: BulkUpsertMarksDto) {
        return this.service.bulkUpsert(dto);
    }
}
