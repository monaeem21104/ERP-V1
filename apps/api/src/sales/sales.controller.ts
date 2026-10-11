import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CurrentUser, RequirePermissions } from '../common/decorators';
import { AuthUser } from '../common/auth.types';
import { resolveCompanyId } from '../common/tenant';

@Controller()
export class SalesController {
  constructor(private sales: SalesService) {}

  @Get('sales-orders')
  @RequirePermissions('sales.read')
  list(@CurrentUser() user: AuthUser, @Query('companyId') companyId?: string) {
    return this.sales.list(resolveCompanyId(user, companyId));
  }

  @Post('sales-orders')
  @RequirePermissions('sales.create')
  create(@CurrentUser() user: AuthUser, @Body() body: {
    companyId?: string;
    customerId: string;
    discountPct?: string;
    lines: { productId: string; qtyOrdered: string; unitPrice: string; taxRate?: string }[];
  }) {
    return this.sales.create(resolveCompanyId(user, body.companyId), user.id, body);
  }

  @Post('sales-orders/:id/approve')
  @RequirePermissions('sales.approve')
  approve(@CurrentUser() user: AuthUser, @Param('id') id: string, @Query('companyId') companyId?: string) {
    return this.sales.approve(resolveCompanyId(user, companyId), id);
  }

  @Post('sales-orders/:id/deliver')
  @RequirePermissions('sales.deliver')
  deliver(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: {
    companyId?: string;
    warehouseId: string;
    lines: { soLineId: string; qty: string }[];
    idempotencyKey?: string;
  }) {
    return this.sales.deliver(resolveCompanyId(user, body.companyId), user.id, { ...body, salesOrderId: id });
  }

  @Post('sales-orders/:id/invoice')
  @RequirePermissions('accounting.create')
  invoice(@CurrentUser() user: AuthUser, @Param('id') id: string, @Query('companyId') companyId?: string) {
    return this.sales.invoice(resolveCompanyId(user, companyId), user.id, id);
  }

  @Post('payments')
  @RequirePermissions('accounting.create')
  pay(@CurrentUser() user: AuthUser, @Body() body: { companyId?: string; invoiceId: string; amount: string; method?: string }) {
    return this.sales.recordPayment(resolveCompanyId(user, body.companyId), user.id, body);
  }
}
