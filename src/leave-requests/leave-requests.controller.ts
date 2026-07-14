import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { AuthedRequest } from 'src/common/authed-request';
import { LeaveRequestsService } from './leave-requests.service';
import { CreateLeaveRequestDto, UpdateLeaveRequestDto } from './leave-requests.dto';

// Leave requests belong to the user who raised them: an admin sees every
// request and approves them, everyone else only ever sees their own.
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('leave-requests')
export class LeaveRequestsController {
    constructor(private readonly service: LeaveRequestsService) { }

    @Post()
    create(@Req() req: AuthedRequest, @Body() dto: CreateLeaveRequestDto) {
        return this.service.createOwned(dto, req.user);
    }

    @Get()
    findAll(
        @Req() req: AuthedRequest,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
    ) {
        return this.service.findAllOwned(req.user, page ? parseInt(page) : 1, limit ? parseInt(limit) : 100, search);
    }

    @Get(':id')
    findOne(@Req() req: AuthedRequest, @Param('id') id: string) {
        return this.service.findOneOwned(id, req.user);
    }

    @Patch(':id')
    update(@Req() req: AuthedRequest, @Param('id') id: string, @Body() dto: UpdateLeaveRequestDto) {
        return this.service.updateOwned(id, dto, req.user);
    }

    @Delete(':id')
    remove(@Req() req: AuthedRequest, @Param('id') id: string) {
        return this.service.removeOwned(id, req.user);
    }
}
