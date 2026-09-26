import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { PagePermissionsGuard } from 'src/auth/page-permissions.guard';
import { RequiresPage } from 'src/auth/requires-page.decorator';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { CertificatesService } from './certificates.service';
import { CreateCertificateDto, UpdateCertificateDto } from './certificates.dto';
import { parseListQuery } from 'src/common/list-query';

@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard, PagePermissionsGuard)
@RequiresPage('certificates')
@Controller('certificates')
export class CertificatesController {
    constructor(private readonly service: CertificatesService) { }

    @Roles('admin')

    @Post()
    create(@Body() dto: CreateCertificateDto) {
        return this.service.create(dto);
    }

    @Get()
    findAll(@Query() query: Record<string, string>) {
        const q = parseListQuery(query);
        return this.service.findAll(q.page, q.limit, q.search, q.term, q.year, q.filters);
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
