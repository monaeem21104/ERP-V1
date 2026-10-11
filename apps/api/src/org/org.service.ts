import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrgService {
  constructor(private prisma: PrismaService) {}

  companies() {
    return this.prisma.company.findMany({ orderBy: { name: 'asc' } });
  }

  async createCompany(input: { code: string; name: string; currencyCode?: string }) {
    const company = await this.prisma.company.create({
      data: { code: input.code, name: input.name, currencyCode: input.currencyCode ?? 'USD' },
    });
    await this.seedCompanyDefaults(company.id);
    return company;
  }

  async seedCompanyDefaults(companyId: string) {
    const uom = await this.prisma.unitOfMeasure.create({
      data: { companyId, code: 'EA', nameEn: 'Each', nameAr: 'قطعة' },
    });
    await this.prisma.warehouse.create({
      data: { companyId, code: 'MAIN', name: 'Main Warehouse' },
    });
    const accounts = [
      ['1100', 'Cash and Bank', 'النقد والبنك', 'ASSET', true, true],
      ['1200', 'Accounts Receivable', 'الذمم المدينة', 'ASSET', false, false],
      ['1300', 'Inventory', 'المخزون', 'ASSET', false, false],
      ['2100', 'Accounts Payable', 'الذمم الدائنة', 'LIABILITY', false, false],
      ['3100', 'Equity', 'حقوق الملكية', 'EQUITY', false, false],
      ['4000', 'Revenue', 'الإيرادات', 'REVENUE', false, false],
      ['5000', 'Cost of Goods Sold', 'تكلفة المبيعات', 'EXPENSE', false, false],
      ['5100', 'Operating Expenses', 'المصروفات التشغيلية', 'EXPENSE', false, false],
    ] as const;
    for (const [code, nameEn, nameAr, type, isBank, isCash] of accounts) {
      await this.prisma.account.create({
        data: { companyId, code, nameEn, nameAr, type, isBank, isCash },
      });
    }
    return { uomId: uom.id };
  }
}
