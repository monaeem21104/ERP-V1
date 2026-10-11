import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ManufacturingService } from './manufacturing.service';
import { CurrentUser, RequirePermissions } from '../common/decorators';
import { AuthUser } from '../common/auth.types';
import { resolveCompanyId } from '../common/tenant';
import { ProductionStatus } from '@prisma/client';

@Controller()
export class ManufacturingController {
  constructor(private mfg: ManufacturingService) {}

  @Get('boms')
  @RequirePermissions('manufacturing.read')
  boms(@CurrentUser() user: AuthUser, @Query('companyId') companyId?: string) {
    return this.mfg.listBom(resolveCompanyId(user, companyId));
  }

  @Post('boms')
  @RequirePermissions('manufacturing.create')
  createBom(@CurrentUser() user: AuthUser, @Body() body: {
    companyId?: string;
    productId: string;
    lines: { componentId: string; qty: string }[];
  }) {
    return this.mfg.createBom(resolveCompanyId(user, body.companyId), body);
  }

  @Get('production-orders')
  @RequirePermissions('manufacturing.read')
  orders(@CurrentUser() user: AuthUser, @Query('companyId') companyId?: string) {
    return this.mfg.listOrders(resolveCompanyId(user, companyId));
  }

  @Post('production-orders')
  @RequirePermissions('manufacturing.create')
  create(@CurrentUser() user: AuthUser, @Body() body: {
    companyId?: string;
    productId: string;
    warehouseId: string;
    qtyPlanned: string;
    bomId?: string;
  }) {
    return this.mfg.createOrder(resolveCompanyId(user, body.companyId), user.id, body);
  }

  @Post('production-orders/:id/status')
  @RequirePermissions('manufacturing.approve')
  status(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { status: ProductionStatus; companyId?: string },
  ) {
    return this.mfg.transition(resolveCompanyId(user, body.companyId), id, body.status);
  }

  @Post('production-orders/:id/consume')
  @RequirePermissions('manufacturing.complete')
  consume(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: {
    companyId?: string;
    productId: string;
    qty: string;
    warehouseId: string;
    idempotencyKey?: string;
  }) {
    return this.mfg.consume(resolveCompanyId(user, body.companyId), user.id, { ...body, productionOrderId: id });
  }

  @Post('production-orders/:id/receive')
  @RequirePermissions('manufacturing.complete')
  receive(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: {
    companyId?: string;
    qty: string;
    warehouseId: string;
    unitCost: string;
    idempotencyKey?: string;
  }) {
    return this.mfg.receiveFg(resolveCompanyId(user, body.companyId), user.id, { ...body, productionOrderId: id });
  }

  @Post('quality-checks/:id')
  @RequirePermissions('manufacturing.complete')
  quality(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { passed: boolean; notes?: string; companyId?: string },
  ) {
    return this.mfg.passQuality(resolveCompanyId(user, body.companyId), id, body.passed, body.notes);
  }
}
