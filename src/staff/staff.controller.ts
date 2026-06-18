import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('staff')
export class StaffController {
    constructor(private readonly staffService: StaffService) { }

    @Post()
    create(@Body() dto: CreateStaffDto) {
        return this.staffService.create(dto);
    }

    @Get()
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'search', required: false })
    findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
    ) {
        return this.staffService.findAll(
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 20,
            search,
        );
    }

    @Get(':id')
    @ApiParam({ name: 'id' })
    findOne(@Param('id') id: string) {
        return this.staffService.findOne(id);
    }

    @Patch(':id')
    @ApiParam({ name: 'id' })
    update(@Param('id') id: string, @Body() dto: UpdateStaffDto) {
        return this.staffService.update(id, dto);
    }

    @Delete(':id')
    @ApiParam({ name: 'id' })
    remove(@Param('id') id: string) {
        return this.staffService.remove(id);
    }
}
