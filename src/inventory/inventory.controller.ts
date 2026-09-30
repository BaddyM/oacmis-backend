import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { PagePermissionsGuard } from 'src/auth/page-permissions.guard';
import { RequiresPage } from 'src/auth/requires-page.decorator';
import { InventoryService } from './inventory.service';
import { parseListQuery } from 'src/common/list-query';
import { CreateInventoryItemDto, UpdateInventoryItemDto } from './inventory.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard, PagePermissionsGuard)
@RequiresPage('inventory')
@Controller('inventory')
export class InventoryController {
    constructor(private readonly service: InventoryService) { }


    @Post()
    create(@Body() dto: CreateInventoryItemDto) {
        return this.service.create(dto);
    }

    @Get()
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'search', required: false, description: 'Matches name, sku, supplier or category' })
    @ApiQuery({ name: 'category', required: false })
    @ApiQuery({ name: 'supplier', required: false })
    @ApiQuery({ name: 'location', required: false })
    @ApiQuery({ name: 'minQty', required: false })
    @ApiQuery({ name: 'maxQty', required: false })
    @ApiQuery({ name: 'status', required: false, description: 'in-stock | low-stock | out-of-stock (derived from quantity vs minStock)' })
    findAll(@Query() query: Record<string, string>) {
        const q = parseListQuery(query);
        return this.service.findAll(q.page, q.limit, q.search, q.term, q.year, q.filters);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }


    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateInventoryItemDto) {
        return this.service.update(id, dto);
    }


    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}
