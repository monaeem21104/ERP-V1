import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'crypto';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto';
import { AuditService } from '../audit/audit.service';

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private audit: AuditService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existing) throw new ConflictException('Email already registered');

    const policy = await this.prisma.platformSetting.findUnique({ where: { id: 'platform' } });
    const requireVerify = policy?.requireEmailVerification ?? true;
    const registrationPolicy = policy?.registrationPolicy ?? 'approval_required';

    const status =
      registrationPolicy === 'open' && !requireVerify
        ? 'ACTIVE'
        : requireVerify
          ? 'PENDING_VERIFICATION'
          : 'PENDING_APPROVAL';

    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
    const standardRole = await this.prisma.role.findFirst({
      where: { code: 'STANDARD_USER', isSystem: true, companyId: null },
    });
    if (!standardRole) throw new BadRequestException('System roles are not seeded');

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        fullName: dto.fullName,
        status,
        emailVerifiedAt: requireVerify ? null : new Date(),
        userRoles: { create: { roleId: standardRole.id } },
      },
    });

    await this.audit.log({
      actorId: user.id,
      action: 'auth.register',
      entityType: 'User',
      entityId: user.id,
      metadata: { role: 'STANDARD_USER' },
    });

    return {
      id: user.id,
      email: user.email,
      status: user.status,
      message: 'Registered as a standard user. Administrator access cannot be self-assigned.',
    };
  }

  async login(dto: LoginDto, res: Response, ip?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { userRoles: { include: { role: true } } },
    });
    const fail = async (reason: string) => {
      if (user) {
        await this.prisma.loginHistory.create({
          data: { userId: user.id, success: false, ipAddress: ip, userAgent, reason },
        });
      }
      throw new UnauthorizedException('Invalid credentials');
    };

    if (!user || user.deletedAt) await fail('not_found');
    if (user!.lockedUntil && user!.lockedUntil > new Date()) {
      throw new UnauthorizedException('Account temporarily locked');
    }
    const valid = await argon2.verify(user!.passwordHash, dto.password);
    if (!valid) {
      const attempts = user!.failedLoginAttempts + 1;
      const lock = attempts >= 8 ? new Date(Date.now() + 15 * 60 * 1000) : null;
      await this.prisma.user.update({
        where: { id: user!.id },
        data: { failedLoginAttempts: attempts, lockedUntil: lock },
      });
      await fail('bad_password');
    }
    if (user!.status !== 'ACTIVE') {
      throw new ForbiddenException('Account is not active');
    }

    await this.prisma.user.update({
      where: { id: user!.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });
    await this.prisma.loginHistory.create({
      data: { userId: user!.id, success: true, ipAddress: ip, userAgent },
    });

    const tokens = await this.issueSession(user!.id, ip, userAgent);
    this.setCookies(res, tokens);
    const isSuperAdmin = user!.userRoles.some((ur) => ur.role.code === 'SUPER_ADMIN' && ur.role.isPlatform);
    return {
      user: this.safeUser(user!),
      redirectTo: isSuperAdmin ? '/admin' : '/dashboard',
      mustChangePassword: user!.mustChangePassword,
    };
  }

  async refresh(refreshToken: string, res: Response, ip?: string, userAgent?: string) {
    if (!refreshToken) throw new UnauthorizedException('Missing refresh token');
    const hash = this.hashToken(refreshToken);
    const session = await this.prisma.session.findFirst({
      where: { refreshTokenHash: hash },
    });
    if (!session) throw new UnauthorizedException('Invalid refresh token');
    if (session.revokedAt) {
      await this.prisma.session.updateMany({
        where: { familyId: session.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token reuse detected');
    }
    if (session.expiresAt < new Date()) throw new UnauthorizedException('Refresh expired');

    const tokens = await this.issueSession(session.userId, ip, userAgent, session.familyId);
    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date(), replacedById: tokens.sessionId },
    });
    this.setCookies(res, tokens);
    return { ok: true };
  }

  async logout(sessionId: string, res: Response) {
    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    res.clearCookie(ACCESS_COOKIE);
    res.clearCookie(REFRESH_COOKIE);
    return { ok: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
        memberships: { include: { company: true } },
      },
    });
    if (!user) throw new UnauthorizedException();
    const isSuperAdmin = user.userRoles.some((ur) => ur.role.code === 'SUPER_ADMIN');
    const permissions = [
      ...new Set(user.userRoles.flatMap((ur) => ur.role.permissions.map((p) => p.permission.key))),
    ];
    return {
      ...this.safeUser(user),
      isSuperAdmin,
      permissions,
      companies: user.memberships.map((m) => ({
        id: m.company.id,
        name: m.company.name,
        status: m.status,
        isDefault: m.isDefault,
      })),
    };
  }

  async changePassword(userId: string, current: string, next: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    const ok = await argon2.verify(user.passwordHash, current);
    if (!ok) throw new UnauthorizedException('Current password is incorrect');
    const passwordHash = await argon2.hash(next, { type: argon2.argon2id });
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: false, passwordChangedAt: new Date() },
    });
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true, message: 'Password updated. Please sign in again.' };
  }

  async bootstrap(res: Response, ip?: string, userAgent?: string) {
    const existing = await this.prisma.role.findFirst({
      where: { code: 'SUPER_ADMIN', isPlatform: true },
      include: { userRoles: true },
    });
    if (existing && existing.userRoles.length > 0) {
      throw new ForbiddenException('Initial administrator setup is disabled');
    }
    const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
    const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
    const name = process.env.BOOTSTRAP_ADMIN_NAME ?? 'System Administrator';
    if (!email || !password || password.length < 12) {
      throw new BadRequestException('BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD must be set');
    }

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    let superRole = existing;
    if (!superRole) {
      superRole = await this.prisma.role.create({
        data: {
          code: 'SUPER_ADMIN',
          name: 'Super Administrator',
          isSystem: true,
          isPlatform: true,
          description: 'Platform operator. Not assignable via public registration.',
        },
        include: { userRoles: true },
      });
    }

    const user = await this.prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        fullName: name,
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
        mustChangePassword: true,
        userRoles: { create: { roleId: superRole.id } },
      },
    });

    await this.prisma.platformSetting.upsert({
      where: { id: 'platform' },
      create: { id: 'platform', initializedAt: new Date() },
      update: { initializedAt: new Date() },
    });

    await this.audit.log({
      actorId: user.id,
      action: 'auth.bootstrap_admin',
      entityType: 'User',
      entityId: user.id,
    });

    const tokens = await this.issueSession(user.id, ip, userAgent);
    this.setCookies(res, tokens);
    return { user: this.safeUser(user), redirectTo: '/admin', mustChangePassword: true };
  }

  async updateLocale(userId: string, locale: 'en' | 'ar') {
    await this.prisma.user.update({ where: { id: userId }, data: { locale } });
    return { locale };
  }

  private async issueSession(userId: string, ip?: string, userAgent?: string, familyId?: string) {
    const refresh = randomBytes(48).toString('hex');
    const session = await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash: this.hashToken(refresh),
        familyId: familyId ?? randomBytes(16).toString('hex'),
        ipAddress: ip,
        userAgent,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    const access = await this.jwt.signAsync(
      { sub: userId, sid: session.id },
      {
        secret: process.env.JWT_ACCESS_SECRET ?? 'dev-only-not-for-production',
        expiresIn: (process.env.JWT_ACCESS_TTL ?? '15m') as any,
      },
    );
    return { access, refresh, sessionId: session.id };
  }

  private setCookies(res: Response, tokens: { access: string; refresh: string }) {
    const secure = process.env.COOKIE_SECURE === 'true';
    const base = {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure,
      path: '/',
    };
    res.cookie(ACCESS_COOKIE, tokens.access, { ...base, maxAge: 15 * 60 * 1000 });
    res.cookie(REFRESH_COOKIE, tokens.refresh, { ...base, maxAge: 7 * 24 * 60 * 60 * 1000 });
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private safeUser(user: { id: string; email: string; fullName: string; status: string; locale: string; mustChangePassword: boolean }) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      status: user.status,
      locale: user.locale,
      mustChangePassword: user.mustChangePassword,
    };
  }
}
