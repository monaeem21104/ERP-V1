import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { d, money, sum } from '../common/money';
import { assertJournalBalanced } from './journal-balance';

@Injectable()
export class AccountingService {
  constructor(private prisma: PrismaService) {}

  listAccounts(companyId: string) {
    return this.prisma.account.findMany({ where: { companyId }, orderBy: { code: 'asc' } });
  }

  createAccount(companyId: string, data: { code: string; nameEn: string; nameAr: string; type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'; isBank?: boolean; isCash?: boolean }) {
    return this.prisma.account.create({ data: { companyId, ...data } });
  }

  async createDraftJournal(companyId: string, input: {
    date: string;
    memo?: string;
    lines: { accountId: string; debit: string; credit: string; memo?: string }[];
    sourceType?: string;
    sourceId?: string;
    createdById?: string;
  }) {
    assertJournalBalanced(input.lines);
    const count = await this.prisma.journalEntry.count({ where: { companyId } });
    return this.prisma.journalEntry.create({
      data: {
        companyId,
        number: `JE-${String(count + 1).padStart(6, '0')}`,
        date: new Date(input.date),
        memo: input.memo,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        createdById: input.createdById,
        status: 'DRAFT',
        lines: {
          create: input.lines.map((l) => ({
            accountId: l.accountId,
            debit: money(l.debit),
            credit: money(l.credit),
            memo: l.memo,
          })),
        },
      },
      include: { lines: true },
    });
  }

  async post(companyId: string, journalId: string) {
    const je = await this.prisma.journalEntry.findFirst({
      where: { id: journalId, companyId },
      include: { lines: true },
    });
    if (!je) throw new NotFoundException();
    if (je.status === 'POSTED') return je;
    if (je.status !== 'DRAFT') throw new BadRequestException('Only draft journals can be posted');
    assertJournalBalanced(je.lines.map((l) => ({ debit: l.debit.toString(), credit: l.credit.toString() })));
    return this.prisma.journalEntry.update({
      where: { id: journalId },
      data: { status: 'POSTED', postedAt: new Date() },
      include: { lines: true },
    });
  }

  async reverse(companyId: string, journalId: string, createdById: string) {
    const je = await this.prisma.journalEntry.findFirst({
      where: { id: journalId, companyId },
      include: { lines: true },
    });
    if (!je || je.status !== 'POSTED') throw new BadRequestException('Only posted journals can be reversed');
    const reversal = await this.createDraftJournal(companyId, {
      date: new Date().toISOString(),
      memo: `Reversal of ${je.number}`,
      sourceType: 'REVERSAL',
      sourceId: je.id,
      createdById,
      lines: je.lines.map((l) => ({
        accountId: l.accountId,
        debit: money(l.credit),
        credit: money(l.debit),
      })),
    });
    const posted = await this.post(companyId, reversal.id);
    await this.prisma.journalEntry.update({
      where: { id: je.id },
      data: { reversedById: posted.id, status: 'VOID' },
    });
    return posted;
  }

  async trialBalance(companyId: string) {
    const lines = await this.prisma.journalLine.findMany({
      where: { journalEntry: { companyId, status: 'POSTED' } },
      include: { account: true },
    });
    const map = new Map<string, { code: string; nameEn: string; debit: ReturnType<typeof d>; credit: ReturnType<typeof d> }>();
    for (const l of lines) {
      const cur = map.get(l.accountId) ?? { code: l.account.code, nameEn: l.account.nameEn, debit: d(0), credit: d(0) };
      cur.debit = cur.debit.plus(d(l.debit));
      cur.credit = cur.credit.plus(d(l.credit));
      map.set(l.accountId, cur);
    }
    const rows = [...map.values()].map((r) => ({
      code: r.code,
      nameEn: r.nameEn,
      debit: money(r.debit),
      credit: money(r.credit),
    }));
    return {
      rows,
      totalDebit: money(sum(rows.map((r) => r.debit))),
      totalCredit: money(sum(rows.map((r) => r.credit))),
    };
  }

  async profitAndLoss(companyId: string) {
    const posted = await this.prisma.journalLine.findMany({
      where: { journalEntry: { companyId, status: 'POSTED' }, account: { type: { in: ['REVENUE', 'EXPENSE'] } } },
      include: { account: true },
    });
    let revenue = d(0);
    let expense = d(0);
    for (const l of posted) {
      const net = d(l.credit).minus(d(l.debit));
      if (l.account.type === 'REVENUE') revenue = revenue.plus(net);
      else expense = expense.plus(d(l.debit).minus(d(l.credit)));
    }
    return {
      revenue: money(revenue),
      expenses: money(expense),
      netIncome: money(revenue.minus(expense)),
    };
  }

  async receivables(companyId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { companyId, type: 'SALES', status: { in: ['POSTED', 'APPROVED'] } },
    });
    const outstanding = invoices.reduce((acc, i) => acc.plus(d(i.total).minus(d(i.amountPaid))), d(0));
    return { outstandingReceivables: money(outstanding) };
  }

  async payables(companyId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { companyId, type: 'PURCHASE', status: { in: ['POSTED', 'APPROVED'] } },
    });
    const outstanding = invoices.reduce((acc, i) => acc.plus(d(i.total).minus(d(i.amountPaid))), d(0));
    return { outstandingPayables: money(outstanding) };
  }

}
