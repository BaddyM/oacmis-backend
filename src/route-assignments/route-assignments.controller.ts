import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { RouteAssignmentsService } from './route-assignments.service';
import { CreateRouteAssignmentDto } from './route-assignments.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('route-assignments')
export class RouteAssignmentsController {
    constructor(private readonly service: RouteAssignmentsService) { }

    @Roles('admin')

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

    @Roles('admin')

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}
