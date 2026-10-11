import { Injectable } from '@nestjs/common';
import { PartnerType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PartnersService {
  constructor(private prisma: PrismaService) {}

  list(companyId: string, type?: PartnerType) {
    return this.prisma.partner.findMany({
      where: { companyId, type: type ? { in: [type, 'BOTH'] } : undefined },
      include: { addresses: true },
      orderBy: { name: 'asc' },
    });
  }

  create(companyId: string, data: {
    type: PartnerType;
    code: string;
    name: string;
    email?: string;
    phone?: string;
    taxId?: string;
    creditLimit?: string;
    paymentTerms?: string;
  }) {
    return this.prisma.partner.create({ data: { companyId, ...data } });
  }
}
