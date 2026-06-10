import { Controller, Get, Header, Param, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthUser, RoleName } from '@aiwms/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ReportQueryDto } from './dto/report.dto';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('financial')
  getFinancial(@Query() query: ReportQueryDto) {
    return this.reportsService.getFinancialReport(query);
  }

  @Get('jobs')
  getJobs(@Query() query: ReportQueryDto, @CurrentUser() user: AuthUser) {
    return this.reportsService.getJobsReport(query, user);
  }

  @Get('inventory')
  getInventory() {
    return this.reportsService.getInventoryReport();
  }

  @Get('debts')
  getDebts() {
    return this.reportsService.getDebtsReport();
  }

  @Get('export/:type')
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.OWNER)
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportCsv(
    @Param('type') type: string,
    @Query() query: ReportQueryDto,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    const csv = await this.reportsService.exportCsv(type, query, user);
    res.setHeader('Content-Disposition', `attachment; filename="${type}-report.csv"`);
    res.send(csv);
  }
}
