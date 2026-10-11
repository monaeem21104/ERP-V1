import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { IamService } from './iam.service';
import { CurrentUser, RequirePermissions } from '../common/decorators';
import { AuthUser } from '../common/auth.types';
import { resolveCompanyId } from '../common/tenant';

@Controller()
export class IamController {
  constructor(private iam: IamService) {}

  @Get('users')
  @RequirePermissions('users.read')
  listUsers(@CurrentUser() user: AuthUser, @Query('companyId') companyId?: string) {
    return this.iam.listUsers(resolveCompanyId(user, companyId));
  }

  @Post('users')
  @RequirePermissions('users.create')
  createUser(
    @CurrentUser() user: AuthUser,
    @Body() body: { email: string; fullName: string; roleIds: string[]; companyId?: string },
  ) {
    return this.iam.createUser(user, resolveCompanyId(user, body.companyId), body);
  }

  @Patch('users/:id/status')
  @RequirePermissions('users.manage')
  setStatus(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: { status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED' }) {
    return this.iam.setStatus(user, id, body.status);
  }

  @Post('users/:id/roles')
  @RequirePermissions('roles.manage')
  assignRoles(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { roleIds: string[]; companyId?: string },
  ) {
    return this.iam.assignRoles(user, id, resolveCompanyId(user, body.companyId), body.roleIds);
  }

  @Get('users/:id/login-history')
  @RequirePermissions('users.read')
  loginHistory(@Param('id') id: string) {
    return this.iam.loginHistory(id);
  }

  @Post('users/:id/revoke-sessions')
  @RequirePermissions('users.manage')
  revoke(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.iam.revokeSessions(user, id);
  }

  @Post('users/:id/reset-password')
  @RequirePermissions('users.reset_password')
  reset(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.iam.resetPassword(user, id);
  }

  @Get('roles')
  @RequirePermissions('roles.read')
  roles(@CurrentUser() user: AuthUser, @Query('companyId') companyId?: string) {
    return this.iam.listRoles(resolveCompanyId(user, companyId));
  }

  @Get('permissions')
  @RequirePermissions('roles.read')
  permissions() {
    return this.iam.listPermissions();
  }

  @Post('roles/:id/permissions')
  @RequirePermissions('roles.manage')
  setPerms(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: { permissionKeys: string[] }) {
    return this.iam.setRolePermissions(user, id, body.permissionKeys);
  }
}
