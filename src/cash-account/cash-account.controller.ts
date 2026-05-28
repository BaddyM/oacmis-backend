import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { CashAccountService } from './cash-account.service';
import {
  CreateAdjustmentDto,
  CreateCashAccountDto,
  CreateTransferDto,
  UpdateCashAccountDto,
} from './dto/cash-account.dto';

function userId(req: any): string | undefined {
  return req?.user?.userId ?? req?.user?.id;
}

@ApiBearerAuth()
@ApiTags('cash-accounts')
@UseGuards(AuthGuard)
@Controller('cash-accounts')
export class CashAccountController {
  constructor(private readonly service: CashAccountService) {}

  @Get()
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'activeOnly', required: false })
  list(@Query('branchId') branchId?: string, @Query('activeOnly') activeOnly?: string) {
    return this.service.findAll(branchId, activeOnly === 'true');
  }

  @Get('balances')
  balances() {
    return this.service.getAllBalances();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/balance')
  getBalance(@Param('id') id: string) {
    return this.service.getBalance(id);
  }

  @Get(':id/entries')
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  listEntries(
    @Param('id') id: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.listEntries(id, {
      page: Number(page),
      limit: Number(limit),
      from,
      to,
    });
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateCashAccountDto) {
    return this.service.create(dto, userId(req));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCashAccountDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post('transfer')
  transfer(@Req() req: any, @Body() dto: CreateTransferDto) {
    return this.service.createTransfer(dto, userId(req));
  }

  @Post('adjustment')
  adjustment(@Req() req: any, @Body() dto: CreateAdjustmentDto) {
    return this.service.createAdjustment(dto, userId(req));
  }
}
