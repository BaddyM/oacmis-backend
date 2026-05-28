import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req } from '@nestjs/common';
import { ProductionStatus } from '@prisma/client';
import { ProductionService } from './production.service';
import { CreateProductionDto } from './dto/create-production.dto';
import { UpdateProductionDto } from './dto/update-production.dto';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('production')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Post()
  create(@Body() createProductionDto: CreateProductionDto) {
    return this.productionService.create(createProductionDto);
  }

  @Get()
  @ApiQuery({ name: 'status', required: false, enum: ProductionStatus })
  findAll(@Query('status') status?: string) {
    const normalized =
      status === 'EXPECTED' || status === 'PRINTED' ? (status as ProductionStatus) : undefined;
    return this.productionService.findAll(normalized);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productionService.findOne(+id);
  }

  @Patch('bulk-mark-printed')
  bulkMarkPrinted(
    @Req() req: any,
    @Body() body: { items: Array<{ id: string; actualQuantity?: number }> },
  ) {
    const createdById = req?.user?.userId ?? req?.user?.id;
    return this.productionService.bulkMarkPrinted(body?.items ?? [], createdById);
  }

  @Patch(':id/mark-printed')
  markPrinted(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { actualQuantity?: number } = {},
  ) {
    return this.productionService.markPrinted(id, {
      actualQuantity: body?.actualQuantity,
      createdById: req?.user?.userId ?? req?.user?.id,
    });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductionDto: UpdateProductionDto) {
    return this.productionService.update(+id, updateProductionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productionService.remove(id);
  }
}
