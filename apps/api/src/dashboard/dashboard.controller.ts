import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { CurrentUser, RequirePermissions } from '../common/decorators';
import { AuthUser } from '../common/auth.types';
import { resolveCompanyId } from '../common/tenant';

@Controller('dashboard')
export class DashboardController {
  constructor(private dashboard: DashboardService) {}

  @Get()
  @RequirePermissions('dashboard.read')
  summary(@CurrentUser() user: AuthUser, @Query('companyId') companyId?: string) {
    return this.dashboard.summary(resolveCompanyId(user, companyId));
  }
}
