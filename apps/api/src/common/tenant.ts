import { ForbiddenException } from '@nestjs/common';
import { AuthUser } from './auth.types';

export function resolveCompanyId(user: AuthUser, requested?: string): string {
  if (user.isSuperAdmin) {
    if (!requested && user.companyIds[0]) return user.companyIds[0];
    if (!requested) throw new ForbiddenException('X-Company-Id is required');
    return requested;
  }
  const companyId = requested ?? user.companyIds[0];
  if (!companyId || !user.companyIds.includes(companyId)) {
    throw new ForbiddenException('No access to this company');
  }
  return companyId;
}

export function assertSameCompany(user: AuthUser, recordCompanyId: string) {
  if (user.isSuperAdmin) return;
  if (!user.companyIds.includes(recordCompanyId)) {
    throw new ForbiddenException('Record is outside your company scope');
  }
}
