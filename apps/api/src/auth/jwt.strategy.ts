import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/auth.types';

type JwtPayload = { sub: string; sid: string };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.access_token ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: process.env.JWT_ACCESS_SECRET ?? 'dev-only-not-for-production',
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const session = await this.prisma.session.findUnique({
      where: { id: payload.sid },
      include: {
        user: {
          include: {
            userRoles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
            memberships: true,
          },
        },
      },
    });
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expired');
    }
    const user = session.user;
    if (user.status !== 'ACTIVE' || user.deletedAt) {
      throw new UnauthorizedException('Account is not active');
    }
    const isSuperAdmin = user.userRoles.some((ur) => ur.role.isPlatform && ur.role.code === 'SUPER_ADMIN');
    const permissions = [
      ...new Set(
        user.userRoles.flatMap((ur) => ur.role.permissions.map((rp) => rp.permission.key)),
      ),
    ];
    const companyIds = user.memberships.filter((m) => m.status === 'ACTIVE').map((m) => m.companyId);
    return {
      id: user.id,
      email: user.email,
      sessionId: session.id,
      isSuperAdmin,
      permissions,
      companyIds,
      locale: user.locale,
      mustChangePassword: user.mustChangePassword,
    };
  }
}
