import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { RoomAssignmentsService } from './room-assignments.service';
import { CreateRoomAssignmentDto } from './room-assignments.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('room-assignments')
export class RoomAssignmentsController {
    constructor(private readonly service: RoomAssignmentsService) { }

    @Roles('admin')

    @Post()
    create(@Body() dto: CreateRoomAssignmentDto) {
        return this.service.create(dto);
    }

    @Get()
    @ApiQuery({ name: 'roomId', required: false })
    findAll(
        @Query('roomId') roomId?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
    ) {
        if (roomId) return this.service.findByRoom(roomId);
        return this.service.findAll(page ? parseInt(page) : 1, limit ? parseInt(limit) : 200, search);
    }

    @Roles('admin')

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}
