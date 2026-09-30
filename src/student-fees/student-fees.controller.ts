import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { PagePermissionsGuard } from 'src/auth/page-permissions.guard';
import { RequiresPage } from 'src/auth/requires-page.decorator';
import { FEES_PAGES } from 'src/auth/page-groups';
import { StudentFeesService } from './student-fees.service';
import { CreateFeeRecordDto, UpdateFeeRecordDto } from './student-fees.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard, PagePermissionsGuard)
@RequiresPage(...FEES_PAGES)
@Controller('student-fees')
export class StudentFeesController {
    constructor(private readonly service: StudentFeesService) { }

    @RequiresPage('student-fees', 'online-fee-payment')
    @Post()
    create(@Body() dto: CreateFeeRecordDto) {
        return this.service.create(dto);
    }

    /**
     * Two modes, told apart by `page`:
     *
     * - Without `page`: an unpaginated lookup returning every matching record.
     *   The payment flow, the report sections and the arrears carry-forward all
     *   rely on getting the complete set, not the first 20.
     * - With `page`: the browse list, which honours search, class, status and
     *   session filters together. Routing a paginated request into the lookup
     *   would silently drop its status/search filters and its paging.
     */
    @Get()
    findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
        @Query('studentId') studentId?: string,
        @Query('className') className?: string,
        @Query('term') term?: string,
        @Query('year') year?: string,
        @Query('status') status?: string,
    ) {
        if (!page && (studentId || className || term)) {
            return this.service.findFiltered({ studentId, className, term, year: year ? parseInt(year) : undefined });
        }
        return this.service.browse(
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 20,
            search,
            status,
            className,
            term,
            year ? parseInt(year) : undefined,
        );
    }

    // Accurate collection totals (not affected by pagination). Declared before
    // ':id' so it isn't captured by the param route.
    @Get('summary')
    summary(
        @Query('term') term?: string,
        @Query('year') year?: string,
        @Query('className') className?: string,
    ) {
        return this.service.summary(term, year ? parseInt(year) : undefined, className);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @RequiresPage('student-fees', 'online-fee-payment')
    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateFeeRecordDto) {
        return this.service.update(id, dto);
    }

    @RequiresPage('student-fees', 'online-fee-payment')
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}
