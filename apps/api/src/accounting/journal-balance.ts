import { BadRequestException } from '@nestjs/common';
import { d, sum } from '../common/money';

export function assertJournalBalanced(lines: { debit: string; credit: string }[]) {
  const debit = sum(lines.map((l) => l.debit));
  const credit = sum(lines.map((l) => l.credit));
  if (!debit.eq(credit)) throw new BadRequestException('Journal is not balanced');
  if (debit.lte(0)) throw new BadRequestException('Journal has no amounts');
  for (const l of lines) {
    if (d(l.debit).gt(0) && d(l.credit).gt(0)) {
      throw new BadRequestException('A line cannot have both debit and credit');
    }
  }
}
