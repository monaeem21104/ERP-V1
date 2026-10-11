import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser, RequirePermissions } from '../common/decorators';
import { AuthUser } from '../common/auth.types';
import { resolveCompanyId } from '../common/tenant';

@Controller('audit-logs')
export class AuditController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @RequirePermissions('audit.read')
  async list(
    @CurrentUser() user: AuthUser,
    @Query('companyId') companyId?: string,
    @Query('cursor') cursor?: string,
  ) {
    const cid = resolveCompanyId(user, companyId);
    return this.prisma.auditLog.findMany({
      where: { companyId: cid },
      orderBy: { createdAt: 'desc' },
      take: 50,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
  }
}
