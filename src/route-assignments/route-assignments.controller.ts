import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { PagePermissionsGuard } from 'src/auth/page-permissions.guard';
import { RequiresPage } from 'src/auth/requires-page.decorator';
import { RouteAssignmentsService } from './route-assignments.service';
import { CreateRouteAssignmentDto } from './route-assignments.dto';

@ApiBearerAuth()
// Reads are open to any signed-in user (no controller-level page); writes
// need the Transport page.
@UseGuards(AuthGuard, PagePermissionsGuard)
@Controller('route-assignments')
export class RouteAssignmentsController {
    constructor(private readonly service: RouteAssignmentsService) { }

    @RequiresPage('transport')
    @Post()
    create(@Body() dto: CreateRouteAssignmentDto) {
        return this.service.create(dto);
    }

    @Get()
    @ApiQuery({ name: 'routeId', required: false })
    findAll(
        @Query('routeId') routeId?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
    ) {
        if (routeId) return this.service.findByRoute(routeId);
        return this.service.findAll(page ? parseInt(page) : 1, limit ? parseInt(limit) : 200, search);
    }

    @RequiresPage('transport')
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}
