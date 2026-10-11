import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CurrentUser, RequirePermissions } from '../common/decorators';
import { AuthUser } from '../common/auth.types';
import { resolveCompanyId } from '../common/tenant';

@Controller()
export class InventoryController {
  constructor(private inventory: InventoryService) {}

  @Get('products')
  @RequirePermissions('products.read')
  products(@CurrentUser() user: AuthUser, @Query('companyId') companyId?: string, @Query('q') q?: string) {
    return this.inventory.listProducts(resolveCompanyId(user, companyId), q);
  }

  @Post('products')
  @RequirePermissions('products.create')
  createProduct(@CurrentUser() user: AuthUser, @Body() body: {
    companyId?: string;
    sku: string;
    nameEn: string;
    nameAr: string;
    uomId: string;
    reorderLevel?: string;
  }) {
    return this.inventory.createProduct(resolveCompanyId(user, body.companyId), body);
  }

  @Get('warehouses')
  @RequirePermissions('warehouses.read')
  warehouses(@CurrentUser() user: AuthUser, @Query('companyId') companyId?: string) {
    return this.inventory.listWarehouses(resolveCompanyId(user, companyId));
  }

  @Get('inventory/balances')
  @RequirePermissions('inventory.read')
  balances(
    @CurrentUser() user: AuthUser,
    @Query('companyId') companyId?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.inventory.balances(resolveCompanyId(user, companyId), warehouseId);
  }

  @Get('inventory/low-stock')
  @RequirePermissions('inventory.read')
  low(@CurrentUser() user: AuthUser, @Query('companyId') companyId?: string) {
    return this.inventory.lowStock(resolveCompanyId(user, companyId));
  }

  @Get('inventory/valuation')
  @RequirePermissions('inventory.read')
  val(@CurrentUser() user: AuthUser, @Query('companyId') companyId?: string) {
    return this.inventory.valuation(resolveCompanyId(user, companyId));
  }

  @Post('inventory/adjust')
  @RequirePermissions('inventory.adjust')
  adjust(@CurrentUser() user: AuthUser, @Body() body: {
    companyId?: string;
    warehouseId: string;
    productId: string;
    qtyDelta: string;
    notes?: string;
    idempotencyKey?: string;
  }) {
    return this.inventory.adjust(resolveCompanyId(user, body.companyId), user.id, body);
  }

  @Post('inventory/transfers')
  @RequirePermissions('inventory.transfer')
  transfer(@CurrentUser() user: AuthUser, @Body() body: {
    companyId?: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    lines: { productId: string; qty: string }[];
    idempotencyKey?: string;
  }) {
    return this.inventory.transfer(resolveCompanyId(user, body.companyId), user.id, body);
  }
}
