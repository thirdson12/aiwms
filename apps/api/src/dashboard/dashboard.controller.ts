import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthUser } from '@aiwms/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get()
  getStats(@CurrentUser() user: AuthUser) {
    return this.dashboardService.getStats(user);
  }
}
