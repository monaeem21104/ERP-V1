import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PurchasingService } from './purchasing.service';
import { CurrentUser, RequirePermissions } from '../common/decorators';
import { AuthUser } from '../common/auth.types';
import { resolveCompanyId } from '../common/tenant';

@Controller('purchase-orders')
export class PurchasingController {
  constructor(private purchasing: PurchasingService) {}

  @Get()
  @RequirePermissions('purchasing.read')
  list(@CurrentUser() user: AuthUser, @Query('companyId') companyId?: string) {
    return this.purchasing.list(resolveCompanyId(user, companyId));
  }

  @Post()
  @RequirePermissions('purchasing.create')
  create(@CurrentUser() user: AuthUser, @Body() body: {
    companyId?: string;
    supplierId: string;
    notes?: string;
    lines: { productId: string; qtyOrdered: string; unitPrice: string; taxRate?: string }[];
  }) {
    return this.purchasing.create(resolveCompanyId(user, body.companyId), user.id, body);
  }

  @Post(':id/approve')
  @RequirePermissions('purchasing.approve')
  approve(@CurrentUser() user: AuthUser, @Param('id') id: string, @Query('companyId') companyId?: string) {
    return this.purchasing.approve(resolveCompanyId(user, companyId), id);
  }

  @Post(':id/receive')
  @RequirePermissions('purchasing.receive')
  receive(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: {
    companyId?: string;
    warehouseId: string;
    lines: { poLineId: string; qty: string }[];
    idempotencyKey?: string;
  }) {
    return this.purchasing.receive(resolveCompanyId(user, body.companyId), user.id, { ...body, purchaseOrderId: id });
  }

  @Post(':id/invoice')
  @RequirePermissions('accounting.create')
  invoice(@CurrentUser() user: AuthUser, @Param('id') id: string, @Query('companyId') companyId?: string) {
    return this.purchasing.supplierInvoice(resolveCompanyId(user, companyId), user.id, { purchaseOrderId: id });
  }
}
