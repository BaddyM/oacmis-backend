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
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('classes')
export class ClassesController {
    constructor(private readonly classesService: ClassesService) { }

    @Post()
    create(@Body() dto: CreateClassDto) {
        return this.classesService.create(dto);
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
        return this.classesService.findAll(
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 50,
            search,
        );
    }

    @Get(':id')
    @ApiParam({ name: 'id' })
    findOne(@Param('id') id: string) {
        return this.classesService.findOne(id);
    }

    @Patch(':id')
    @ApiParam({ name: 'id' })
    update(@Param('id') id: string, @Body() dto: UpdateClassDto) {
        return this.classesService.update(id, dto);
    }

    @Delete(':id')
    @ApiParam({ name: 'id' })
    remove(@Param('id') id: string) {
        return this.classesService.remove(id);
    }
}
