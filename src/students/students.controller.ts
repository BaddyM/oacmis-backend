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
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { BulkCreateStudentDto } from './dto/bulk-create-student.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('students')
export class StudentsController {
    constructor(private readonly studentsService: StudentsService) { }

    @Post()
    create(@Body() dto: CreateStudentDto) {
        return this.studentsService.create(dto);
    }

    @Post('bulk')
    bulkCreate(@Body() dto: BulkCreateStudentDto) {
        return this.studentsService.bulkCreate(dto.students);
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
        return this.studentsService.findAll(
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 20,
            search,
        );
    }

    @Get(':id')
    @ApiParam({ name: 'id' })
    findOne(@Param('id') id: string) {
        return this.studentsService.findOne(id);
    }

    @Patch(':id')
    @ApiParam({ name: 'id' })
    update(@Param('id') id: string, @Body() dto: UpdateStudentDto) {
        return this.studentsService.update(id, dto);
    }

    @Delete(':id')
    @ApiParam({ name: 'id' })
    remove(@Param('id') id: string) {
        return this.studentsService.remove(id);
    }
}
