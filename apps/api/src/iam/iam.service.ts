import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../common/auth.types';

@Injectable()
export class IamService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async listUsers(companyId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { companyId },
      include: {
        user: {
          include: { userRoles: { include: { role: true } } },
        },
      },
    });
    return memberships.map((m) => ({
      id: m.user.id,
      email: m.user.email,
      fullName: m.user.fullName,
      status: m.user.status,
      membershipStatus: m.status,
      roles: m.user.userRoles.filter((r) => r.companyId === companyId || r.role.isPlatform).map((r) => r.role.code),
    }));
  }

  async createUser(actor: AuthUser, companyId: string, input: { email: string; fullName: string; roleIds: string[] }) {
    this.assertCanManage(actor);
    const temp = randomBytes(12).toString('base64url') + 'Aa1!';
    const passwordHash = await argon2.hash(temp, { type: argon2.argon2id });
    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: input.email.toLowerCase(),
          fullName: input.fullName,
          passwordHash,
          status: 'ACTIVE',
          emailVerifiedAt: new Date(),
          mustChangePassword: true,
          memberships: { create: { companyId, status: 'ACTIVE', joinedAt: new Date(), isDefault: true } },
        },
      });
      for (const roleId of input.roleIds) {
        const role = await tx.role.findUnique({ where: { id: roleId } });
        if (!role) throw new NotFoundException('Role not found');
        if (role.isPlatform && !actor.isSuperAdmin) {
          throw new ForbiddenException('Cannot assign platform roles');
        }
        if (role.code === 'SUPER_ADMIN') {
          throw new ForbiddenException('Super Administrator cannot be assigned this way');
        }
        await tx.userRole.create({ data: { userId: created.id, roleId, companyId } });
      }
      return created;
    });
    await this.audit.log({
      actorId: actor.id,
      companyId,
      action: 'users.create',
      entityType: 'User',
      entityId: user.id,
    });
    return { id: user.id, email: user.email, temporaryPasswordIssued: true };
  }

  async setStatus(actor: AuthUser, userId: string, status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED') {
    this.assertCanManage(actor);
    const target = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userRoles: { include: { role: true } } },
    });
    if (!target) throw new NotFoundException();
    if (target.userRoles.some((r) => r.role.code === 'SUPER_ADMIN') && !actor.isSuperAdmin) {
      throw new ForbiddenException();
    }
    await this.prisma.user.update({ where: { id: userId }, data: { status } });
    if (status !== 'ACTIVE') {
      await this.prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    }
    await this.audit.log({ actorId: actor.id, action: 'users.status', entityType: 'User', entityId: userId, metadata: { status } });
    return { ok: true };
  }

  async assignRoles(actor: AuthUser, userId: string, companyId: string, roleIds: string[]) {
    this.assertCanManage(actor);
    await this.prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({ where: { userId, companyId } });
      for (const roleId of roleIds) {
        const role = await tx.role.findUnique({ where: { id: roleId } });
        if (!role) throw new NotFoundException('Role not found');
        if (role.isPlatform) throw new ForbiddenException('Use platform APIs for platform roles');
        await tx.userRole.create({ data: { userId, roleId, companyId } });
      }
    });
    await this.audit.log({
      actorId: actor.id,
      companyId,
      action: 'roles.assign',
      entityType: 'User',
      entityId: userId,
      metadata: { roleIds },
    });
    return { ok: true };
  }

  async listRoles(companyId: string) {
    return this.prisma.role.findMany({
      where: { OR: [{ companyId }, { companyId: null, isSystem: true, isPlatform: false }] },
      include: { permissions: { include: { permission: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async listPermissions() {
    return this.prisma.permission.findMany({ orderBy: { key: 'asc' } });
  }

  async setRolePermissions(actor: AuthUser, roleId: string, permissionKeys: string[]) {
    this.assertCanManage(actor);
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException();
    if (role.isPlatform && !actor.isSuperAdmin) throw new ForbiddenException();
    const permissions = await this.prisma.permission.findMany({ where: { key: { in: permissionKeys } } });
    await this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId } });
      await tx.rolePermission.createMany({
        data: permissions.map((p) => ({ roleId, permissionId: p.id })),
      });
    });
    await this.audit.log({
      actorId: actor.id,
      action: 'roles.permissions',
      entityType: 'Role',
      entityId: roleId,
      metadata: { permissionKeys },
    });
    return { ok: true };
  }

  async loginHistory(userId: string) {
    return this.prisma.loginHistory.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 });
  }

  async revokeSessions(actor: AuthUser, userId: string) {
    this.assertCanManage(actor);
    await this.prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    await this.audit.log({ actorId: actor.id, action: 'sessions.revoke', entityType: 'User', entityId: userId });
    return { ok: true };
  }

  async resetPassword(actor: AuthUser, userId: string) {
    this.assertCanManage(actor);
    const temp = randomBytes(12).toString('base64url') + 'Aa1!';
    const passwordHash = await argon2.hash(temp, { type: argon2.argon2id });
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: true },
    });
    await this.prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    await this.audit.log({ actorId: actor.id, action: 'users.reset_password', entityType: 'User', entityId: userId });
    return { temporaryPassword: temp };
  }

  private assertCanManage(actor: AuthUser) {
    if (!actor.isSuperAdmin && !actor.permissions.includes('users.manage')) {
      throw new ForbiddenException();
    }
  }
}
