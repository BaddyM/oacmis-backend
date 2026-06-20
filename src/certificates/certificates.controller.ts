import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { CertificatesService } from './certificates.service';
import { CreateCertificateDto, UpdateCertificateDto } from './certificates.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('certificates')
export class CertificatesController {
    constructor(private readonly service: CertificatesService) { }

    @Roles('admin')

    @Post()
    create(@Body() dto: CreateCertificateDto) {
        return this.service.create(dto);
    }

    @Get()
    findAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('search') search?: string) {
        return this.service.findAll(page ? parseInt(page) : 1, limit ? parseInt(limit) : 50, search);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @Roles('admin')

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateCertificateDto) {
        return this.service.update(id, dto);
    }

    @Roles('admin')

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}
