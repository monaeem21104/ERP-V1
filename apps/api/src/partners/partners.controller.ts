import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PartnerType } from '@prisma/client';
import { PartnersService } from './partners.service';
import { CurrentUser, RequirePermissions } from '../common/decorators';
import { AuthUser } from '../common/auth.types';
import { resolveCompanyId } from '../common/tenant';

@Controller()
export class PartnersController {
  constructor(private partners: PartnersService) {}

  @Get('customers')
  @RequirePermissions('customers.read')
  customers(@CurrentUser() user: AuthUser, @Query('companyId') companyId?: string) {
    return this.partners.list(resolveCompanyId(user, companyId), 'CUSTOMER');
  }

  @Post('customers')
  @RequirePermissions('customers.create')
  createCustomer(@CurrentUser() user: AuthUser, @Body() body: { companyId?: string; code: string; name: string; email?: string; creditLimit?: string }) {
    return this.partners.create(resolveCompanyId(user, body.companyId), { ...body, type: 'CUSTOMER' });
  }

  @Get('suppliers')
  @RequirePermissions('suppliers.read')
  suppliers(@CurrentUser() user: AuthUser, @Query('companyId') companyId?: string) {
    return this.partners.list(resolveCompanyId(user, companyId), 'SUPPLIER');
  }

  @Post('suppliers')
  @RequirePermissions('suppliers.create')
  createSupplier(@CurrentUser() user: AuthUser, @Body() body: { companyId?: string; code: string; name: string; email?: string }) {
    return this.partners.create(resolveCompanyId(user, body.companyId), { ...body, type: 'SUPPLIER' });
  }
}
