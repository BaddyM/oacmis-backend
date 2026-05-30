import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { BranchService } from './branch.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import {
  CreateStockTransferDto,
  UpsertBranchStockDto,
  CreateBulkStockTransferDto,
} from './dto/branch-stock.dto';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('branch')
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @Post()
  create(@Body() createBranchDto: CreateBranchDto) {
    return this.branchService.create(createBranchDto);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Get()
  @ApiQuery({ name: 'page' })
  @ApiQuery({ name: 'limit' })
  findAll(@Query('page') page: string, @Query('limit') limit: string) {
    return this.branchService.findAll(parseInt(page), parseInt(limit));
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBranchDto: UpdateBranchDto) {
    return this.branchService.update(id, updateBranchDto);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.branchService.remove(id);
  }

  //Branch Stock
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Post('stock/upsert')
  upsertBranchStock(@Body() dto: UpsertBranchStockDto) {
    return this.branchService.upsert_branch_stock(dto);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Get('stock/list')
  @ApiQuery({ name: 'branchId', required: false })
  listBranchStock(@Req() req: any, @Query('branchId') branchId?: string) {
    return this.branchService.list_branch_stock(
      this.scopeBranchId(req, branchId),
    );
  }

  //Stock Transfers
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Post('transfer')
  createStockTransfer(@Req() req: any, @Body() dto: CreateStockTransferDto) {
    this.assertCanTransferFrom(req, dto.fromBranchId);
    return this.branchService.create_stock_transfer(dto);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Post('transfer/bulk')
  createBulkStockTransfer(@Req() req: any, @Body() dto: CreateBulkStockTransferDto) {
    this.assertCanTransferFrom(req, dto.fromBranchId);
    return this.branchService.create_bulk_stock_transfer(dto);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Patch('transfer/:id/complete')
  completeStockTransfer(@Param('id') id: string, @Req() req: any) {
    return this.branchService.complete_stock_transfer(id, req.user?.id);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Patch('transfer/:id/cancel')
  cancelStockTransfer(@Param('id') id: string, @Req() req: any) {
    return this.branchService.cancel_stock_transfer(id, req.user?.id);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Get('transfer/list')
  @ApiQuery({ name: 'branchId', required: false })
  listStockTransfers(@Req() req: any, @Query('branchId') branchId?: string) {
    return this.branchService.list_stock_transfers(
      this.scopeBranchId(req, branchId),
    );
  }

  // Only admins may view across branches. Every other role is clamped to their
  // own assigned branch, ignoring any branchId supplied in the query. A non-admin
  // with no branch assigned is scoped to a sentinel that matches nothing.
  private scopeBranchId(req: any, requestedBranchId?: string): string | undefined {
    if (req.user?.role === 'admin') return requestedBranchId;
    return req.user?.branchId ?? '__no_branch__';
  }

  // Only admins may move stock out of any branch. Everyone else can only transfer
  // out of their own assigned branch.
  private assertCanTransferFrom(req: any, fromBranchId?: string) {
    if (req.user?.role === 'admin') return;
    if (!req.user?.branchId || fromBranchId !== req.user.branchId) {
      throw new ForbiddenException(
        'You can only transfer stock out of your own branch',
      );
    }
  }
}
