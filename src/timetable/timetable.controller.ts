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
import { TimetableService } from './timetable.service';
import { CreateTimetableEntryDto } from './dto/create-timetable-entry.dto';
import { UpdateTimetableEntryDto } from './dto/update-timetable-entry.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('timetable')
export class TimetableController {
    constructor(private readonly timetableService: TimetableService) { }

    @Post()
    create(@Body() dto: CreateTimetableEntryDto) {
        return this.timetableService.create(dto);
    }

    @Get()
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'className', required: false })
    @ApiQuery({ name: 'teacher', required: false })
    findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('className') className?: string,
        @Query('teacher') teacher?: string,
    ) {
        return this.timetableService.findAll(
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 500,
            className,
            teacher,
        );
    }

    @Get(':id')
    @ApiParam({ name: 'id' })
    findOne(@Param('id') id: string) {
        return this.timetableService.findOne(id);
    }

    @Patch(':id')
    @ApiParam({ name: 'id' })
    update(@Param('id') id: string, @Body() dto: UpdateTimetableEntryDto) {
        return this.timetableService.update(id, dto);
    }

    @Delete(':id')
    @ApiParam({ name: 'id' })
    remove(@Param('id') id: string) {
        return this.timetableService.remove(id);
    }
}
