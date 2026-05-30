import { Body, Controller, ForbiddenException, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { BranchPayablesService } from './branch-payables.service';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('admin/branch-payables')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class BranchPayablesController {
  constructor(private readonly svc: BranchPayablesService) {}

  @Get()
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  list(
    @Req() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    this.assertCanAccess(req);
    return this.svc.list(parseInt(page), parseInt(limit), this.scopeBranchId(req, branchId), startDate, endDate);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    this.assertCanAccess(req);
    return this.svc.findOne(id, req.user);
  }

  @Post(':id/deposits')
  createDeposit(@Param('id') id: string, @Body() dto: CreateDepositDto, @Req() req: any) {
    this.assertCanAccess(req);
    return this.svc.createDeposit(id, dto, req.user);
  }

  // Only admins and branch office accounts deal with branch payables.
  private assertCanAccess(req: any) {
    const role = req.user?.role;
    if (role !== 'admin' && role !== 'office') {
      throw new ForbiddenException('Not allowed to access branch payables');
    }
  }

  // Admins may view any branch (or all); office is pinned to their own branch,
  // ignoring any branchId in the query. A no-branch office matches nothing.
  private scopeBranchId(req: any, requestedBranchId?: string): string | undefined {
    if (req.user?.role === 'admin') return requestedBranchId;
    return req.user?.branchId ?? '__no_branch__';
  }
}
