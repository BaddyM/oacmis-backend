import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { PagePermissionsGuard } from 'src/auth/page-permissions.guard';
import { RequiresPage } from 'src/auth/requires-page.decorator';
import type { AuthedRequest } from 'src/common/authed-request';
import { parseListQuery } from 'src/common/list-query';
import { SickBayService } from './sick-bay.service';
import { CreateSickBayVisitRequestDto, NotifyParentDto, UpdateSickBayVisitDto } from './sick-bay.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard, PagePermissionsGuard)
@RequiresPage('sick-bay')
@Controller('sick-bay')
export class SickBayController {
    constructor(private readonly service: SickBayService) { }

    @Post()
    create(@Body() dto: CreateSickBayVisitRequestDto, @Req() req: AuthedRequest) {
        return this.service.createVisit(dto, req.user?.id);
    }

    @Get()
    findAll(@Query() query: Record<string, string>) {
        const q = parseListQuery(query);
        return this.service.findAll(q.page, q.limit, q.search, q.term, q.year, q.filters);
    }

    @Get('student/:studentId/profile')
    profile(@Param('studentId') studentId: string) {
        return this.service.studentProfile(studentId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateSickBayVisitDto) {
        return this.service.update(id, dto);
    }

    @Post(':id/notify-parent')
    notifyParent(@Param('id') id: string, @Body() dto: NotifyParentDto) {
        return this.service.notifyParent(id, dto.message);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}
