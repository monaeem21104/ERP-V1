import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { CurrentUser, RequirePermissions } from '../common/decorators';
import { AuthUser } from '../common/auth.types';
import { resolveCompanyId } from '../common/tenant';

@Controller()
export class AccountingController {
  constructor(private accounting: AccountingService) {}

  @Get('accounts')
  @RequirePermissions('accounting.read')
  accounts(@CurrentUser() user: AuthUser, @Query('companyId') companyId?: string) {
    return this.accounting.listAccounts(resolveCompanyId(user, companyId));
  }

  @Post('accounts')
  @RequirePermissions('accounting.create')
  createAccount(@CurrentUser() user: AuthUser, @Body() body: {
    companyId?: string;
    code: string;
    nameEn: string;
    nameAr: string;
    type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  }) {
    return this.accounting.createAccount(resolveCompanyId(user, body.companyId), body);
  }

  @Post('journals')
  @RequirePermissions('accounting.create')
  createJe(@CurrentUser() user: AuthUser, @Body() body: {
    companyId?: string;
    date: string;
    memo?: string;
    lines: { accountId: string; debit: string; credit: string }[];
  }) {
    return this.accounting.createDraftJournal(resolveCompanyId(user, body.companyId), { ...body, createdById: user.id });
  }

  @Post('journals/:id/post')
  @RequirePermissions('accounting.post')
  post(@CurrentUser() user: AuthUser, @Param('id') id: string, @Query('companyId') companyId?: string) {
    return this.accounting.post(resolveCompanyId(user, companyId), id);
  }

  @Post('journals/:id/reverse')
  @RequirePermissions('accounting.reverse')
  reverse(@CurrentUser() user: AuthUser, @Param('id') id: string, @Query('companyId') companyId?: string) {
    return this.accounting.reverse(resolveCompanyId(user, companyId), id, user.id);
  }

  @Get('reports/trial-balance')
  @RequirePermissions('reports.read')
  tb(@CurrentUser() user: AuthUser, @Query('companyId') companyId?: string) {
    return this.accounting.trialBalance(resolveCompanyId(user, companyId));
  }

  @Get('reports/profit-loss')
  @RequirePermissions('reports.read')
  pl(@CurrentUser() user: AuthUser, @Query('companyId') companyId?: string) {
    return this.accounting.profitAndLoss(resolveCompanyId(user, companyId));
  }
}
