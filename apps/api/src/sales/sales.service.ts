import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { AccountingService } from '../accounting/accounting.service';
import { d, money } from '../common/money';

@Injectable()
export class SalesService {
  constructor(
    private prisma: PrismaService,
    private inventory: InventoryService,
    private accounting: AccountingService,
  ) {}

  list(companyId: string) {
    return this.prisma.salesOrder.findMany({
      where: { companyId },
      include: { customer: true, lines: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(companyId: string, userId: string, input: {
    customerId: string;
    discountPct?: string;
    lines: { productId: string; qtyOrdered: string; unitPrice: string; taxRate?: string }[];
  }) {
    const customer = await this.prisma.partner.findFirst({ where: { id: input.customerId, companyId } });
    if (!customer) throw new NotFoundException('Customer not found');
    const count = await this.prisma.salesOrder.count({ where: { companyId } });
    return this.prisma.salesOrder.create({
      data: {
        companyId,
        customerId: input.customerId,
        number: `SO-${String(count + 1).padStart(6, '0')}`,
        discountPct: money(input.discountPct ?? 0),
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
      include: { lines: true, customer: true },
    });
  }

  async approve(companyId: string, id: string) {
    const so = await this.prisma.salesOrder.findFirst({ where: { id, companyId }, include: { customer: true, lines: true } });
    if (!so || so.status !== 'DRAFT') throw new BadRequestException('Only draft orders can be approved');
    const outstanding = await this.customerOutstanding(companyId, so.customerId);
    const thisTotal = so.lines.reduce((acc, l) => acc.plus(d(l.qtyOrdered).mul(d(l.unitPrice))), d(0));
    if (d(so.customer.creditLimit).gt(0) && outstanding.plus(thisTotal).gt(d(so.customer.creditLimit))) {
      throw new BadRequestException('Credit limit exceeded');
    }
    return this.prisma.salesOrder.update({ where: { id }, data: { status: 'APPROVED' } });
  }

  async deliver(companyId: string, userId: string, input: {
    salesOrderId: string;
    warehouseId: string;
    lines: { soLineId: string; qty: string }[];
    idempotencyKey?: string;
  }) {
    const so = await this.prisma.salesOrder.findFirst({
      where: { id: input.salesOrderId, companyId },
      include: { lines: true },
    });
    if (!so || !['APPROVED', 'PARTIAL', 'IN_PROGRESS'].includes(so.status)) {
      throw new BadRequestException('Order is not deliverable');
    }
    for (const rec of input.lines) {
      const line = so.lines.find((l) => l.id === rec.soLineId);
      if (!line) throw new NotFoundException();
      const next = d(line.qtyDelivered).plus(d(rec.qty));
      if (next.gt(d(line.qtyOrdered))) throw new BadRequestException('Cannot deliver more than ordered');
      await this.inventory.move({
        companyId,
        warehouseId: input.warehouseId,
        productId: line.productId,
        type: 'ISSUE',
        qty: rec.qty,
        referenceType: 'SalesOrder',
        referenceId: so.id,
        createdById: userId,
        idempotencyKey: input.idempotencyKey ? `${input.idempotencyKey}:${rec.soLineId}` : undefined,
      });
      await this.prisma.salesOrderLine.update({ where: { id: line.id }, data: { qtyDelivered: money(next) } });
    }
    const refreshed = await this.prisma.salesOrder.findUniqueOrThrow({ where: { id: so.id }, include: { lines: true } });
    const complete = refreshed.lines.every((l) => d(l.qtyDelivered).gte(d(l.qtyOrdered)));
    await this.prisma.salesOrder.update({
      where: { id: so.id },
      data: { status: complete ? 'COMPLETED' : 'PARTIAL' },
    });
    const count = await this.prisma.deliveryNote.count({ where: { companyId } });
    return this.prisma.deliveryNote.create({
      data: {
        companyId,
        salesOrderId: so.id,
        warehouseId: input.warehouseId,
        number: `DN-${String(count + 1).padStart(6, '0')}`,
        status: 'COMPLETED',
        createdById: userId,
        lines: {
          create: input.lines.map((l) => {
            const soLine = so.lines.find((x) => x.id === l.soLineId)!;
            return { productId: soLine.productId, qty: money(l.qty), soLineId: l.soLineId };
          }),
        },
      },
      include: { lines: true },
    });
  }

  async invoice(companyId: string, userId: string, salesOrderId: string) {
    const so = await this.prisma.salesOrder.findFirst({
      where: { id: salesOrderId, companyId },
      include: { lines: true },
    });
    if (!so) throw new NotFoundException();
    const subtotal = so.lines.reduce((acc, l) => acc.plus(d(l.qtyDelivered).mul(d(l.unitPrice))), d(0));
    const afterDisc = subtotal.mul(d(1).minus(d(so.discountPct).div(100)));
    const tax = so.lines.reduce(
      (acc, l) => acc.plus(d(l.qtyDelivered).mul(d(l.unitPrice)).mul(d(l.taxRate)).div(100)),
      d(0),
    );
    const total = afterDisc.plus(tax);
    const count = await this.prisma.invoice.count({ where: { companyId } });
    const invoice = await this.prisma.invoice.create({
      data: {
        companyId,
        partnerId: so.customerId,
        salesOrderId: so.id,
        number: `SINV-${String(count + 1).padStart(6, '0')}`,
        type: 'SALES',
        status: 'POSTED',
        subtotal: money(afterDisc),
        taxTotal: money(tax),
        total: money(total),
        lines: {
          create: so.lines.map((l) => ({
            productId: l.productId,
            description: l.description ?? l.productId,
            qty: money(l.qtyDelivered),
            unitPrice: money(l.unitPrice),
            taxRate: money(l.taxRate),
            lineTotal: money(d(l.qtyDelivered).mul(d(l.unitPrice))),
          })),
        },
      },
    });
    const ar = await this.prisma.account.findFirst({ where: { companyId, code: '1200' } });
    const rev = await this.prisma.account.findFirst({ where: { companyId, code: '4000' } });
    if (ar && rev && total.gt(0)) {
      const je = await this.accounting.createDraftJournal(companyId, {
        date: new Date().toISOString(),
        memo: `Sales invoice ${invoice.number}`,
        sourceType: 'Invoice',
        sourceId: invoice.id,
        createdById: userId,
        lines: [
          { accountId: ar.id, debit: money(total), credit: '0' },
          { accountId: rev.id, debit: '0', credit: money(total) },
        ],
      });
      await this.accounting.post(companyId, je.id);
      await this.prisma.invoice.update({ where: { id: invoice.id }, data: { journalEntryId: je.id } });
    }
    return invoice;
  }

  async recordPayment(companyId: string, userId: string, input: { invoiceId: string; amount: string; method?: string }) {
    const invoice = await this.prisma.invoice.findFirst({ where: { id: input.invoiceId, companyId } });
    if (!invoice) throw new NotFoundException();
    const amount = d(input.amount);
    const outstanding = d(invoice.total).minus(d(invoice.amountPaid));
    if (amount.gt(outstanding)) throw new BadRequestException('Payment exceeds outstanding');
    const count = await this.prisma.payment.count({ where: { companyId } });
    const payment = await this.prisma.payment.create({
      data: {
        companyId,
        partnerId: invoice.partnerId,
        number: `PAY-${String(count + 1).padStart(6, '0')}`,
        direction: invoice.type === 'SALES' ? 'IN' : 'OUT',
        amount: money(amount),
        method: input.method ?? 'BANK',
        status: 'POSTED',
        allocations: { create: { invoiceId: invoice.id, amount: money(amount) } },
      },
    });
    await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: { amountPaid: money(d(invoice.amountPaid).plus(amount)) },
    });
    const bank = await this.prisma.account.findFirst({ where: { companyId, code: '1100' } });
    const ar = await this.prisma.account.findFirst({ where: { companyId, code: '1200' } });
    const ap = await this.prisma.account.findFirst({ where: { companyId, code: '2100' } });
    if (bank && invoice.type === 'SALES' && ar) {
      const je = await this.accounting.createDraftJournal(companyId, {
        date: new Date().toISOString(),
        memo: `Payment ${payment.number}`,
        sourceType: 'Payment',
        sourceId: payment.id,
        createdById: userId,
        lines: [
          { accountId: bank.id, debit: money(amount), credit: '0' },
          { accountId: ar.id, debit: '0', credit: money(amount) },
        ],
      });
      await this.accounting.post(companyId, je.id);
    }
    if (bank && invoice.type === 'PURCHASE' && ap) {
      const je = await this.accounting.createDraftJournal(companyId, {
        date: new Date().toISOString(),
        memo: `Supplier payment ${payment.number}`,
        sourceType: 'Payment',
        sourceId: payment.id,
        createdById: userId,
        lines: [
          { accountId: ap.id, debit: money(amount), credit: '0' },
          { accountId: bank.id, debit: '0', credit: money(amount) },
        ],
      });
      await this.accounting.post(companyId, je.id);
    }
    return payment;
  }

  private async customerOutstanding(companyId: string, customerId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { companyId, partnerId: customerId, type: 'SALES', status: 'POSTED' },
    });
    return invoices.reduce((acc, i) => acc.plus(d(i.total).minus(d(i.amountPaid))), d(0));
  }
}
