import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { d, money } from '../common/money';
import { ProductionStatus } from '@prisma/client';

const FLOW: ProductionStatus[] = ['DRAFT', 'APPROVED', 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED'];

@Injectable()
export class ManufacturingService {
  constructor(
    private prisma: PrismaService,
    private inventory: InventoryService,
  ) {}

  listBom(companyId: string) {
    return this.prisma.billOfMaterials.findMany({
      where: { companyId },
      include: { product: true, lines: { include: { component: true } }, routings: true },
    });
  }

  createBom(companyId: string, input: {
    productId: string;
    quantity?: string;
    lines: { componentId: string; qty: string; scrapPct?: string }[];
    operations?: { sequence: number; name: string; setupMinutes?: number; runMinutes?: number }[];
  }) {
    return this.prisma.billOfMaterials.create({
      data: {
        companyId,
        productId: input.productId,
        quantity: money(input.quantity ?? 1),
        lines: {
          create: input.lines.map((l) => ({
            componentId: l.componentId,
            qty: money(l.qty),
            scrapPct: money(l.scrapPct ?? 0),
          })),
        },
        routings: {
          create: (input.operations ?? []).map((o) => ({
            sequence: o.sequence,
            name: o.name,
            setupMinutes: o.setupMinutes ?? 0,
            runMinutes: o.runMinutes ?? 0,
          })),
        },
      },
      include: { lines: true, routings: true },
    });
  }

  listOrders(companyId: string) {
    return this.prisma.productionOrder.findMany({
      where: { companyId },
      include: { consumptions: true, receipts: true, qualityChecks: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createOrder(companyId: string, userId: string, input: {
    productId: string;
    warehouseId: string;
    qtyPlanned: string;
    bomId?: string;
  }) {
    const count = await this.prisma.productionOrder.count({ where: { companyId } });
    return this.prisma.productionOrder.create({
      data: {
        companyId,
        productId: input.productId,
        warehouseId: input.warehouseId,
        bomId: input.bomId,
        qtyPlanned: money(input.qtyPlanned),
        createdById: userId,
        number: `MO-${String(count + 1).padStart(6, '0')}`,
        qualityChecks: { create: { name: 'Final inspection', mandatory: true } },
      },
    });
  }

  async transition(companyId: string, id: string, next: ProductionStatus) {
    const order = await this.prisma.productionOrder.findFirst({
      where: { id, companyId },
      include: { qualityChecks: true, consumptions: true, receipts: true },
    });
    if (!order) throw new NotFoundException();
    const from = FLOW.indexOf(order.status);
    const to = FLOW.indexOf(next);
    if (to !== from + 1 && next !== 'CANCELLED') {
      throw new BadRequestException(`Invalid transition ${order.status} → ${next}`);
    }
    if (next === 'COMPLETED') {
      const mandatoryFail = order.qualityChecks.some((q) => q.mandatory && q.passed !== true);
      if (mandatoryFail) throw new BadRequestException('Mandatory quality checks are incomplete');
      if (d(order.qtyCompleted).lte(0)) throw new BadRequestException('No finished goods received');
    }
    return this.prisma.productionOrder.update({ where: { id }, data: { status: next } });
  }

  async consume(companyId: string, userId: string, input: {
    productionOrderId: string;
    productId: string;
    qty: string;
    warehouseId: string;
    idempotencyKey?: string;
  }) {
    const order = await this.prisma.productionOrder.findFirst({
      where: { id: input.productionOrderId, companyId },
    });
    if (!order || !['PLANNED', 'IN_PROGRESS'].includes(order.status)) {
      throw new BadRequestException('Order is not in a consumable state');
    }
    if (order.status === 'PLANNED') {
      await this.prisma.productionOrder.update({ where: { id: order.id }, data: { status: 'IN_PROGRESS' } });
    }
    await this.inventory.move({
      companyId,
      warehouseId: input.warehouseId,
      productId: input.productId,
      type: 'PRODUCTION_CONSUME',
      qty: input.qty,
      referenceType: 'ProductionOrder',
      referenceId: order.id,
      createdById: userId,
      idempotencyKey: input.idempotencyKey,
    });
    return this.prisma.productionConsumption.create({
      data: {
        productionOrderId: order.id,
        productId: input.productId,
        qty: money(input.qty),
        warehouseId: input.warehouseId,
      },
    });
  }

  async receiveFg(companyId: string, userId: string, input: {
    productionOrderId: string;
    qty: string;
    warehouseId: string;
    unitCost: string;
    idempotencyKey?: string;
  }) {
    const order = await this.prisma.productionOrder.findFirst({ where: { id: input.productionOrderId, companyId } });
    if (!order || !['IN_PROGRESS', 'PLANNED'].includes(order.status)) {
      throw new BadRequestException('Order cannot receive finished goods');
    }
    await this.inventory.move({
      companyId,
      warehouseId: input.warehouseId,
      productId: order.productId,
      type: 'PRODUCTION_RECEIPT',
      qty: input.qty,
      unitCost: input.unitCost,
      referenceType: 'ProductionOrder',
      referenceId: order.id,
      createdById: userId,
      idempotencyKey: input.idempotencyKey,
    });
    const qtyCompleted = d(order.qtyCompleted).plus(d(input.qty));
    await this.prisma.productionOrder.update({
      where: { id: order.id },
      data: { qtyCompleted: money(qtyCompleted), status: 'IN_PROGRESS' },
    });
    return this.prisma.productionReceipt.create({
      data: {
        productionOrderId: order.id,
        productId: order.productId,
        qty: money(input.qty),
        warehouseId: input.warehouseId,
        unitCost: money(input.unitCost),
      },
    });
  }

  async passQuality(companyId: string, checkId: string, passed: boolean, notes?: string) {
    const check = await this.prisma.qualityCheck.findUnique({
      where: { id: checkId },
      include: { productionOrder: true },
    });
    if (!check || check.productionOrder.companyId !== companyId) throw new NotFoundException();
    return this.prisma.qualityCheck.update({
      where: { id: checkId },
      data: { passed, notes, checkedAt: new Date() },
    });
  }
}
