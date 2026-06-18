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
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('subjects')
export class SubjectsController {
    constructor(private readonly subjectsService: SubjectsService) { }

    @Post()
    create(@Body() dto: CreateSubjectDto) {
        return this.subjectsService.create(dto);
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
        return this.subjectsService.findAll(
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 200,
            search,
        );
    }

    @Get(':id')
    @ApiParam({ name: 'id' })
    findOne(@Param('id') id: string) {
        return this.subjectsService.findOne(id);
    }

    @Patch(':id')
    @ApiParam({ name: 'id' })
    update(@Param('id') id: string, @Body() dto: UpdateSubjectDto) {
        return this.subjectsService.update(id, dto);
    }

    @Delete(':id')
    @ApiParam({ name: 'id' })
    remove(@Param('id') id: string) {
        return this.subjectsService.remove(id);
    }
}
