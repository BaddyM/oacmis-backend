import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { FeePaymentsService } from './fee-payments.service';
import { CreateFeePaymentDto, UpdateFeePaymentDto } from './fee-payments.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('fee-payments')
export class FeePaymentsController {
    constructor(private readonly service: FeePaymentsService) { }

    @Post()
    create(@Body() dto: CreateFeePaymentDto) {
        return this.service.create(dto);
    }

    @Get()
    findAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('search') search?: string) {
        return this.service.findAll(page ? parseInt(page) : 1, limit ? parseInt(limit) : 200, search);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateFeePaymentDto) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}
