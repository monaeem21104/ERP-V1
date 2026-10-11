import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(input: {
    actorId?: string;
    companyId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    metadata?: Prisma.InputJsonValue;
    ipAddress?: string;
    userAgent?: string;
  }) {
    await this.prisma.auditLog.create({ data: input });
  }
}
