import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { AccountingService } from '../accounting/accounting.service';
import { d, money } from '../common/money';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private inventory: InventoryService,
    private accounting: AccountingService,
  ) {}

  async summary(companyId: string) {
    const [
      salesOrders,
      productionActive,
      pendingPo,
      valuation,
      lowStock,
      pnl,
      ar,
      ap,
      recentPayments,
      activity,
      downtimeMinutes,
      maintenanceOpen,
    ] = await Promise.all([
      this.prisma.salesOrder.count({ where: { companyId } }),
      this.prisma.productionOrder.count({
        where: { companyId, status: { in: ['APPROVED', 'PLANNED', 'IN_PROGRESS'] } },
      }),
      this.prisma.purchaseOrder.count({ where: { companyId, status: { in: ['DRAFT', 'SUBMITTED', 'APPROVED'] } } }),
      this.inventory.valuation(companyId),
      this.inventory.lowStock(companyId),
      this.accounting.profitAndLoss(companyId),
      this.accounting.receivables(companyId),
      this.accounting.payables(companyId),
      this.prisma.payment.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: { partner: true },
      }),
      this.prisma.activityFeed.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' }, take: 10 }),
      this.prisma.downtimeRecord.aggregate({
        where: { machine: { companyId }, endedAt: null },
        _sum: { minutes: true },
      }),
      this.prisma.maintenanceOrder.count({ where: { companyId, status: { notIn: ['COMPLETED', 'CLOSED', 'CANCELLED'] } } }),
    ]);

    const completed = await this.prisma.productionOrder.aggregate({
      where: { companyId, status: { in: ['COMPLETED', 'CLOSED'] } },
      _sum: { qtyCompleted: true, qtyPlanned: true },
    });
    const planned = d(completed._sum.qtyPlanned ?? 0);
    const done = d(completed._sum.qtyCompleted ?? 0);
    const efficiency = planned.gt(0) ? done.div(planned).mul(100) : d(0);

    return {
      totalOrders: salesOrders,
      activeProductionOrders: productionActive,
      revenue: pnl.revenue,
      expenses: pnl.expenses,
      outstandingReceivables: ar.outstandingReceivables,
      outstandingPayables: ap.outstandingPayables,
      inventoryValuation: valuation.inventoryValuation,
      lowStockAlerts: lowStock.length,
      lowStock,
      pendingPurchaseOrders: pendingPo,
      productionEfficiency: money(efficiency),
      machineDowntimeMinutes: downtimeMinutes._sum.minutes ?? 0,
      openMaintenanceOrders: maintenanceOpen,
      cashFlowNet: money(d(pnl.revenue).minus(d(pnl.expenses))),
      recentTransactions: recentPayments.map((p) => ({
        id: p.id,
        number: p.number,
        partner: p.partner.name,
        amount: p.amount,
        direction: p.direction,
        date: p.date,
      })),
      activity,
    };
  }
}
