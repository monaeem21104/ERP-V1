import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class NumberingService {
  async next(tx: Prisma.TransactionClient, companyId: string, documentType: string, prefix: string) {
    const series = await tx.numberingSeries.upsert({
      where: { companyId_documentType: { companyId, documentType } },
      create: { companyId, documentType, prefix, nextNumber: 2 },
      update: { nextNumber: { increment: 1 } },
    });
    const n = series.nextNumber === 2 && series.prefix === prefix ? 1 : series.nextNumber - 1;
    const seq = await tx.numberingSeries.findUniqueOrThrow({
      where: { companyId_documentType: { companyId, documentType } },
    });
    return `${prefix}-${String(seq.nextNumber - 1).padStart(6, '0')}`;
  }
}
