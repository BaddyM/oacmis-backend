import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { FeeStructuresService } from './fee-structures.service';
import { CreateFeeStructureDto, GenerateInvoicesDto, UpdateFeeStructureDto } from './fee-structures.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
@Controller('fee-structures')
export class FeeStructuresController {
    constructor(private readonly service: FeeStructuresService) { }

    @Post()
    create(@Body() dto: CreateFeeStructureDto) {
        return this.service.create(dto);
    }

    // Bill this structure's term to the whole class, or to dto.studentIds only.
    @Post(':id/generate')
    generate(@Param('id') id: string, @Body() dto: GenerateInvoicesDto) {
        return this.service.generate(id, dto.carryForward ?? true, dto.studentIds);
    }

    @Get()
    findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
        @Query('term') term?: string,
        @Query('year') year?: string,
    ) {
        return this.service.findAll(
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 100,
            search,
            term,
            year ? parseInt(year) : undefined,
        );
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateFeeStructureDto) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}
