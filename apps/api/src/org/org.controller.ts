import { Body, Controller, Get, Post } from '@nestjs/common';
import { OrgService } from './org.service';
import { CurrentUser, RequirePermissions } from '../common/decorators';
import { AuthUser } from '../common/auth.types';

@Controller('companies')
export class OrgController {
  constructor(private org: OrgService) {}

  @Get()
  @RequirePermissions('companies.read')
  list(@CurrentUser() user: AuthUser) {
    if (user.isSuperAdmin) return this.org.companies();
    return this.org.companies().then((rows) => rows.filter((c) => user.companyIds.includes(c.id)));
  }

  @Post()
  @RequirePermissions('companies.manage')
  create(@Body() body: { code: string; name: string; currencyCode?: string }) {
    return this.org.createCompany(body);
  }
}
