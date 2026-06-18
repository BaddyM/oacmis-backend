import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { AuditService } from './audit.service';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @ApiQuery({ name: 'page' })
  @ApiQuery({ name: 'limit' })
  @ApiQuery({ name: 'entity', required: false })
  list_logs(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('entity') entity?: string,
  ) {
    return this.auditService.list(parseInt(page), parseInt(limit), entity);
  }
}
