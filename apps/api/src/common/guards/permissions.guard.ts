import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators';
import { AuthUser } from '../auth.types';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;
    const req = context.switchToHttp().getRequest();
    const user = req.user as AuthUser | undefined;
    if (!user) throw new ForbiddenException('Not authenticated');
    if (user.isSuperAdmin) return true;
    const ok = required.every((p) => user.permissions.includes(p));
    if (!ok) throw new ForbiddenException('Insufficient permissions');
    return true;
  }
}
