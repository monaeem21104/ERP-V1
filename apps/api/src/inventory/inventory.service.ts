import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import { PrismaService } from '../prisma/prisma.service';
import { d, money } from '../common/money';
import { InventoryMoveType } from '@prisma/client';

type MoveInput = {
  companyId: string;
  warehouseId: string;
  productId: string;
  type: InventoryMoveType;
  qty: Decimal.Value;
  unitCost?: Decimal.Value;
  lotId?: string;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  createdById?: string;
  idempotencyKey?: string;
  allowNegative?: boolean;
};

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async listProducts(companyId: string, q?: string) {
    return this.prisma.product.findMany({
      where: {
        companyId,
        OR: q
          ? [
              { sku: { contains: q, mode: 'insensitive' } },
              { nameEn: { contains: q, mode: 'insensitive' } },
              { nameAr: { contains: q, mode: 'insensitive' } },
            ]
          : undefined,
      },
      include: { uom: true, category: true },
      orderBy: { sku: 'asc' },
      take: 100,
    });
  }

  async createProduct(companyId: string, data: {
    sku: string;
    nameEn: string;
    nameAr: string;
    uomId: string;
    reorderLevel?: string;
    trackBatch?: boolean;
  }) {
    return this.prisma.product.create({
      data: { companyId, ...data, reorderLevel: data.reorderLevel ?? '0' },
    });
  }

  async listWarehouses(companyId: string) {
    return this.prisma.warehouse.findMany({ where: { companyId }, orderBy: { code: 'asc' } });
  }

  async balances(companyId: string, warehouseId?: string) {
    return this.prisma.stockBalance.findMany({
      where: { companyId, warehouseId },
      include: { product: true, warehouse: true },
    });
  }

  async lowStock(companyId: string) {
    const products = await this.prisma.product.findMany({ where: { companyId, isActive: true } });
    const balances = await this.prisma.stockBalance.groupBy({
      by: ['productId'],
      where: { companyId },
      _sum: { qtyOnHand: true },
    });
    const map = new Map(balances.map((b) => [b.productId, d(b._sum.qtyOnHand ?? 0)]));
    return products
      .filter((p) => map.get(p.id)?.lte(d(p.reorderLevel)) ?? true)
      .map((p) => ({
        productId: p.id,
        sku: p.sku,
        nameEn: p.nameEn,
        nameAr: p.nameAr,
        onHand: money(map.get(p.id) ?? 0),
        reorderLevel: money(p.reorderLevel),
      }));
  }

  async valuation(companyId: string) {
    const rows = await this.prisma.stockBalance.findMany({ where: { companyId } });
    const total = rows.reduce((acc, r) => acc.plus(d(r.qtyOnHand).mul(d(r.avgCost))), d(0));
    return { inventoryValuation: money(total), lines: rows.length };
  }

  async move(input: MoveInput) {
    if (input.idempotencyKey) {
      const existing = await this.prisma.inventoryMovement.findUnique({
        where: { companyId_idempotencyKey: { companyId: input.companyId, idempotencyKey: input.idempotencyKey } },
      });
      if (existing) return existing;
    }

    const qty = d(input.qty);
    if (qty.lte(0)) throw new BadRequestException('Quantity must be positive');

    return this.prisma.$transaction(async (tx) => {
      const company = await tx.company.findUnique({ where: { id: input.companyId } });
      if (!company) throw new NotFoundException('Company not found');
      const inbound = ['RECEIPT', 'TRANSFER_IN', 'PRODUCTION_RECEIPT', 'RETURN_IN', 'COUNT'].includes(input.type);
      const signedQty = inbound ? qty : qty.neg();

      const existing = await tx.stockBalance.findFirst({
        where: {
          warehouseId: input.warehouseId,
          productId: input.productId,
          lotId: input.lotId ?? null,
        },
      });

      let avgCost = d(existing?.avgCost ?? 0);
      const unitCost = d(input.unitCost ?? existing?.avgCost ?? 0);
      const onHand = d(existing?.qtyOnHand ?? 0);
      const nextQty = onHand.plus(signedQty);
      const allowNeg = input.allowNegative ?? company.allowNegativeStock;
      if (nextQty.lt(0) && !allowNeg) {
        throw new BadRequestException('Insufficient stock');
      }
      if (inbound && qty.gt(0)) {
        if (onHand.lte(0)) avgCost = unitCost;
        else avgCost = onHand.mul(avgCost).plus(qty.mul(unitCost)).div(onHand.plus(qty));
      }

      if (existing) {
        const updated = await tx.stockBalance.updateMany({
          where: { id: existing.id, version: existing.version },
          data: {
            qtyOnHand: money(nextQty),
            avgCost: money(avgCost),
            version: { increment: 1 },
          },
        });
        if (updated.count !== 1) throw new BadRequestException('Concurrent stock update, retry');
      } else {
        await tx.stockBalance.create({
          data: {
            companyId: input.companyId,
            warehouseId: input.warehouseId,
            productId: input.productId,
            lotId: input.lotId,
            qtyOnHand: money(nextQty),
            avgCost: money(avgCost),
          },
        });
      }

      return tx.inventoryMovement.create({
        data: {
          companyId: input.companyId,
          warehouseId: input.warehouseId,
          productId: input.productId,
          type: input.type,
          qty: money(qty),
          unitCost: money(unitCost),
          lotId: input.lotId,
          referenceType: input.referenceType,
          referenceId: input.referenceId,
          notes: input.notes,
          createdById: input.createdById,
          idempotencyKey: input.idempotencyKey,
        },
      });
    });
  }

  async transfer(companyId: string, userId: string, input: {
    fromWarehouseId: string;
    toWarehouseId: string;
    lines: { productId: string; qty: string }[];
    idempotencyKey?: string;
  }) {
    if (input.fromWarehouseId === input.toWarehouseId) {
      throw new BadRequestException('Warehouses must differ');
    }
    return this.prisma.$transaction(async () => {
      for (const line of input.lines) {
        await this.move({
          companyId,
          warehouseId: input.fromWarehouseId,
          productId: line.productId,
          type: 'TRANSFER_OUT',
          qty: line.qty,
          createdById: userId,
          idempotencyKey: input.idempotencyKey ? `${input.idempotencyKey}:out:${line.productId}` : undefined,
        });
        const bal = await this.prisma.stockBalance.findFirst({
          where: { warehouseId: input.fromWarehouseId, productId: line.productId },
        });
        await this.move({
          companyId,
          warehouseId: input.toWarehouseId,
          productId: line.productId,
          type: 'TRANSFER_IN',
          qty: line.qty,
          unitCost: bal?.avgCost,
          createdById: userId,
          idempotencyKey: input.idempotencyKey ? `${input.idempotencyKey}:in:${line.productId}` : undefined,
        });
      }
      const count = await this.prisma.stockTransfer.count({ where: { companyId } });
      return this.prisma.stockTransfer.create({
        data: {
          companyId,
          number: `TR-${String(count + 1).padStart(6, '0')}`,
          fromWarehouseId: input.fromWarehouseId,
          toWarehouseId: input.toWarehouseId,
          status: 'COMPLETED',
          lines: { create: input.lines.map((l) => ({ productId: l.productId, qty: l.qty })) },
        },
        include: { lines: true },
      });
    });
  }

  async adjust(companyId: string, userId: string, input: {
    warehouseId: string;
    productId: string;
    qtyDelta: string;
    notes?: string;
    idempotencyKey?: string;
  }) {
    const delta = d(input.qtyDelta);
    if (delta.eq(0)) throw new BadRequestException('Adjustment cannot be zero');
    return this.move({
      companyId,
      warehouseId: input.warehouseId,
      productId: input.productId,
      type: 'ADJUSTMENT',
      qty: delta.abs(),
      notes: input.notes,
      createdById: userId,
      idempotencyKey: input.idempotencyKey,
      allowNegative: delta.lt(0) ? false : undefined,
    });
  }
}
