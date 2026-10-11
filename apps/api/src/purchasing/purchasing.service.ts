import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { AccountingService } from '../accounting/accounting.service';
import { d, money } from '../common/money';

@Injectable()
export class PurchasingService {
  constructor(
    private prisma: PrismaService,
    private inventory: InventoryService,
    private accounting: AccountingService,
  ) {}

  list(companyId: string) {
    return this.prisma.purchaseOrder.findMany({
      where: { companyId },
      include: { supplier: true, lines: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(companyId: string, userId: string, input: {
    supplierId: string;
    notes?: string;
    lines: { productId: string; qtyOrdered: string; unitPrice: string; taxRate?: string }[];
  }) {
    const count = await this.prisma.purchaseOrder.count({ where: { companyId } });
    return this.prisma.purchaseOrder.create({
      data: {
        companyId,
        supplierId: input.supplierId,
        number: `PO-${String(count + 1).padStart(6, '0')}`,
        notes: input.notes,
        createdById: userId,
        lines: {
          create: input.lines.map((l) => ({
            productId: l.productId,
            qtyOrdered: money(l.qtyOrdered),
            unitPrice: money(l.unitPrice),
            taxRate: money(l.taxRate ?? 0),
          })),
        },
      },
      include: { lines: true, supplier: true },
    });
  }

  async approve(companyId: string, id: string) {
    const po = await this.prisma.purchaseOrder.findFirst({ where: { id, companyId } });
    if (!po || po.status !== 'DRAFT') throw new BadRequestException('Only draft POs can be approved');
    return this.prisma.purchaseOrder.update({ where: { id }, data: { status: 'APPROVED' } });
  }

  async receive(companyId: string, userId: string, input: {
    purchaseOrderId: string;
    warehouseId: string;
    lines: { poLineId: string; qty: string }[];
    idempotencyKey?: string;
  }) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id: input.purchaseOrderId, companyId },
      include: { lines: true },
    });
    if (!po || !['APPROVED', 'PARTIAL', 'IN_PROGRESS'].includes(po.status)) {
      throw new BadRequestException('PO is not receivable');
    }

    await this.prisma.$transaction(async (tx) => {
      for (const rec of input.lines) {
        const line = po.lines.find((l) => l.id === rec.poLineId);
        if (!line) throw new NotFoundException('PO line not found');
        const next = d(line.qtyReceived).plus(d(rec.qty));
        if (next.gt(d(line.qtyOrdered))) throw new BadRequestException('Cannot receive more than ordered');
        await tx.purchaseOrderLine.update({ where: { id: line.id }, data: { qtyReceived: money(next) } });
      }
    });

    for (const rec of input.lines) {
      const line = po.lines.find((l) => l.id === rec.poLineId)!;
      await this.inventory.move({
        companyId,
        warehouseId: input.warehouseId,
        productId: line.productId,
        type: 'RECEIPT',
        qty: rec.qty,
        unitCost: line.unitPrice,
        referenceType: 'PurchaseOrder',
        referenceId: po.id,
        createdById: userId,
        idempotencyKey: input.idempotencyKey ? `${input.idempotencyKey}:${rec.poLineId}` : undefined,
      });
    }

    const refreshed = await this.prisma.purchaseOrder.findUniqueOrThrow({
      where: { id: po.id },
      include: { lines: true },
    });
    const complete = refreshed.lines.every((l) => d(l.qtyReceived).gte(d(l.qtyOrdered)));
    const any = refreshed.lines.some((l) => d(l.qtyReceived).gt(0));
    await this.prisma.purchaseOrder.update({
      where: { id: po.id },
      data: { status: complete ? 'COMPLETED' : any ? 'PARTIAL' : po.status },
    });

    const count = await this.prisma.goodsReceipt.count({ where: { companyId } });
    return this.prisma.goodsReceipt.create({
      data: {
        companyId,
        purchaseOrderId: po.id,
        warehouseId: input.warehouseId,
        number: `GRN-${String(count + 1).padStart(6, '0')}`,
        status: 'COMPLETED',
        createdById: userId,
        lines: {
          create: input.lines.map((l) => {
            const poLine = po.lines.find((x) => x.id === l.poLineId)!;
            return { productId: poLine.productId, qty: money(l.qty), unitCost: money(poLine.unitPrice), poLineId: l.poLineId };
          }),
        },
      },
      include: { lines: true },
    });
  }

  async supplierInvoice(companyId: string, userId: string, input: { purchaseOrderId: string }) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id: input.purchaseOrderId, companyId },
      include: { lines: true, supplier: true },
    });
    if (!po) throw new NotFoundException();
    const subtotal = po.lines.reduce((acc, l) => acc.plus(d(l.qtyReceived).mul(d(l.unitPrice))), d(0));
    const tax = po.lines.reduce((acc, l) => acc.plus(d(l.qtyReceived).mul(d(l.unitPrice)).mul(d(l.taxRate)).div(100)), d(0));
    const total = subtotal.plus(tax);
    const count = await this.prisma.invoice.count({ where: { companyId } });
    const invoice = await this.prisma.invoice.create({
      data: {
        companyId,
        partnerId: po.supplierId,
        purchaseOrderId: po.id,
        number: `PINV-${String(count + 1).padStart(6, '0')}`,
        type: 'PURCHASE',
        status: 'POSTED',
        subtotal: money(subtotal),
        taxTotal: money(tax),
        total: money(total),
        lines: {
          create: po.lines.map((l) => ({
            productId: l.productId,
            description: l.description ?? l.productId,
            qty: money(l.qtyReceived),
            unitPrice: money(l.unitPrice),
            taxRate: money(l.taxRate),
            lineTotal: money(d(l.qtyReceived).mul(d(l.unitPrice))),
          })),
        },
      },
    });

    const inventory = await this.prisma.account.findFirst({ where: { companyId, code: '1300' } });
    const ap = await this.prisma.account.findFirst({ where: { companyId, code: '2100' } });
    if (inventory && ap && total.gt(0)) {
      const je = await this.accounting.createDraftJournal(companyId, {
        date: new Date().toISOString(),
        memo: `Supplier invoice ${invoice.number}`,
        sourceType: 'Invoice',
        sourceId: invoice.id,
        createdById: userId,
        lines: [
          { accountId: inventory.id, debit: money(total), credit: '0' },
          { accountId: ap.id, debit: '0', credit: money(total) },
        ],
      });
      await this.accounting.post(companyId, je.id);
      await this.prisma.invoice.update({ where: { id: invoice.id }, data: { journalEntryId: je.id } });
    }
    return invoice;
  }
}
