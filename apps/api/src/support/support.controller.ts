import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser, Public, RequirePermissions } from '../common/decorators';
import { AuthUser } from '../common/auth.types';
import { resolveCompanyId } from '../common/tenant';
import { InventoryService } from '../inventory/inventory.service';
import { money } from '../common/money';

@Controller()
export class SupportController {
  constructor(
    private prisma: PrismaService,
    private inventory: InventoryService,
  ) {}

  @Public()
  @Get('health/live')
  live() {
    return { status: 'ok', ts: new Date().toISOString() };
  }

  @Public()
  @Get('health/ready')
  async ready() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ready' };
  }

  @Get('uom')
  @RequirePermissions('products.read')
  uom(@CurrentUser() user: AuthUser, @Query('companyId') companyId?: string) {
    return this.prisma.unitOfMeasure.findMany({ where: { companyId: resolveCompanyId(user, companyId) } });
  }

  @Get('returns')
  @RequirePermissions('returns.read')
  returns(@CurrentUser() user: AuthUser, @Query('companyId') companyId?: string) {
    return this.prisma.returnDocument.findMany({
      where: { companyId: resolveCompanyId(user, companyId) },
      include: { lines: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('returns')
  @RequirePermissions('returns.create')
  async createReturn(
    @CurrentUser() user: AuthUser,
    @Body() body: { companyId?: string; type: string; reason?: string; lines: { productId: string; qty: string }[] },
  ) {
    const companyId = resolveCompanyId(user, body.companyId);
    const count = await this.prisma.returnDocument.count({ where: { companyId } });
    return this.prisma.returnDocument.create({
      data: {
        companyId,
        type: body.type,
        reason: body.reason,
        number: `RMA-${String(count + 1).padStart(6, '0')}`,
        lines: { create: body.lines.map((l) => ({ productId: l.productId, qty: money(l.qty) })) },
      },
      include: { lines: true },
    });
  }

  @Post('returns/:id/approve')
  @RequirePermissions('returns.approve')
  async approveReturn(
    @CurrentUser() user: AuthUser,
    @Body() body: { id: string; companyId?: string; warehouseId: string; restock: boolean },
  ) {
    const companyId = resolveCompanyId(user, body.companyId);
    const doc = await this.prisma.returnDocument.findFirst({
      where: { id: body.id, companyId },
      include: { lines: true },
    });
    if (!doc) return { error: 'not_found' };
    if (body.restock) {
      for (const line of doc.lines) {
        await this.inventory.move({
          companyId,
          warehouseId: body.warehouseId,
          productId: line.productId,
          type: doc.type === 'SALES' ? 'RETURN_IN' : 'RETURN_OUT',
          qty: line.qty,
          referenceType: 'Return',
          referenceId: doc.id,
          createdById: user.id,
        });
        await this.prisma.returnLine.update({ where: { id: line.id }, data: { disposition: 'RESTOCK' } });
      }
    }
    return this.prisma.returnDocument.update({ where: { id: doc.id }, data: { status: 'APPROVED' } });
  }

  @Get('employees')
  @RequirePermissions('hr.read')
  employees(@CurrentUser() user: AuthUser, @Query('companyId') companyId?: string) {
    return this.prisma.employee.findMany({ where: { companyId: resolveCompanyId(user, companyId) } });
  }

  @Post('employees')
  @RequirePermissions('hr.create')
  createEmployee(
    @CurrentUser() user: AuthUser,
    @Body() body: { companyId?: string; employeeNo: string; firstName: string; lastName: string; jobTitle?: string },
  ) {
    return this.prisma.employee.create({
      data: { companyId: resolveCompanyId(user, body.companyId), ...body },
    });
  }

  @Get('leave-requests')
  @RequirePermissions('hr.read')
  leaves(@CurrentUser() user: AuthUser, @Query('companyId') companyId?: string) {
    const cid = resolveCompanyId(user, companyId);
    return this.prisma.leaveRequest.findMany({
      where: { employee: { companyId: cid } },
      include: { employee: true },
    });
  }

  @Post('leave-requests')
  @RequirePermissions('hr.create')
  createLeave(@Body() body: { employeeId: string; type: string; startDate: string; endDate: string; reason?: string }) {
    return this.prisma.leaveRequest.create({
      data: {
        employeeId: body.employeeId,
        type: body.type,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        reason: body.reason,
      },
    });
  }

  @Post('leave-requests/:id/decision')
  @RequirePermissions('hr.manage')
  decideLeave(@Body() body: { id: string; status: 'APPROVED' | 'REJECTED' }) {
    return this.prisma.leaveRequest.update({ where: { id: body.id }, data: { status: body.status } });
  }

  @Get('machines')
  @RequirePermissions('maintenance.read')
  machines(@CurrentUser() user: AuthUser, @Query('companyId') companyId?: string) {
    return this.prisma.machine.findMany({
      where: { companyId: resolveCompanyId(user, companyId) },
      include: { downtime: true, orders: true },
    });
  }

  @Post('machines')
  @RequirePermissions('maintenance.create')
  createMachine(@CurrentUser() user: AuthUser, @Body() body: { companyId?: string; code: string; name: string }) {
    return this.prisma.machine.create({ data: { companyId: resolveCompanyId(user, body.companyId), ...body } });
  }

  @Get('maintenance-orders')
  @RequirePermissions('maintenance.read')
  mOrders(@CurrentUser() user: AuthUser, @Query('companyId') companyId?: string) {
    return this.prisma.maintenanceOrder.findMany({
      where: { companyId: resolveCompanyId(user, companyId) },
      include: { machine: true, parts: true },
    });
  }

  @Post('maintenance-orders')
  @RequirePermissions('maintenance.create')
  async createMo(
    @CurrentUser() user: AuthUser,
    @Body() body: { companyId?: string; machineId: string; type: string; notes?: string },
  ) {
    const companyId = resolveCompanyId(user, body.companyId);
    const count = await this.prisma.maintenanceOrder.count({ where: { companyId } });
    return this.prisma.maintenanceOrder.create({
      data: {
        companyId,
        machineId: body.machineId,
        type: body.type,
        notes: body.notes,
        number: `WO-${String(count + 1).padStart(6, '0')}`,
      },
    });
  }

  @Get('notifications')
  notifications(@CurrentUser() user: AuthUser) {
    return this.prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  @Post('notifications/:id/read')
  async readNotif(@CurrentUser() user: AuthUser, @Body() body: { id: string }) {
    return this.prisma.notification.updateMany({
      where: { id: body.id, userId: user.id },
      data: { readAt: new Date() },
    });
  }

  @Get('einvoices')
  @RequirePermissions('einvoicing.read')
  einvoices(@CurrentUser() user: AuthUser, @Query('companyId') companyId?: string) {
    return this.prisma.einvoiceSubmission.findMany({
      where: { companyId: resolveCompanyId(user, companyId) },
      include: { invoice: true },
    });
  }

  @Post('einvoices/validate')
  @RequirePermissions('einvoicing.submit')
  async validateEinvoice(@CurrentUser() user: AuthUser, @Body() body: { invoiceId: string; companyId?: string }) {
    const companyId = resolveCompanyId(user, body.companyId);
    const invoice = await this.prisma.invoice.findFirst({ where: { id: body.invoiceId, companyId }, include: { lines: true } });
    if (!invoice) return { valid: false, errors: ['Invoice not found'] };
    const errors: string[] = [];
    if (invoice.lines.length === 0) errors.push('Invoice has no lines');
    if (Number(invoice.total) <= 0) errors.push('Invoice total must be positive');
    const submission = await this.prisma.einvoiceSubmission.upsert({
      where: { invoiceId: invoice.id },
      create: {
        companyId,
        invoiceId: invoice.id,
        provider: process.env.EINVOICE_PROVIDER ?? 'sandbox',
        status: errors.length ? 'REJECTED' : 'VALIDATED',
        lastError: errors.join('; ') || null,
      },
      update: { status: errors.length ? 'REJECTED' : 'VALIDATED', lastError: errors.join('; ') || null },
    });
    return { valid: errors.length === 0, errors, submission };
  }

  @Get('reports/inventory-valuation')
  @RequirePermissions('reports.read')
  invVal(@CurrentUser() user: AuthUser, @Query('companyId') companyId?: string) {
    return this.inventory.valuation(resolveCompanyId(user, companyId));
  }

  @Get('reports/stock-movements')
  @RequirePermissions('reports.read')
  movements(@CurrentUser() user: AuthUser, @Query('companyId') companyId?: string) {
    return this.prisma.inventoryMovement.findMany({
      where: { companyId: resolveCompanyId(user, companyId) },
      include: { product: true },
      orderBy: { occurredAt: 'desc' },
      take: 200,
    });
  }

  @Get('invoices')
  @RequirePermissions('accounting.read')
  invoices(@CurrentUser() user: AuthUser, @Query('companyId') companyId?: string, @Query('type') type?: string) {
    return this.prisma.invoice.findMany({
      where: { companyId: resolveCompanyId(user, companyId), type: type || undefined },
      include: { partner: true, lines: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
