import { BadRequestException } from '@nestjs/common';
import { assertJournalBalanced } from './journal-balance';

describe('journal balance rules', () => {
  it('rejects unbalanced journals', () => {
    expect(() =>
      assertJournalBalanced([
        { debit: '10', credit: '0' },
        { debit: '0', credit: '9' },
      ]),
    ).toThrow(BadRequestException);
  });

  it('accepts balanced journals', () => {
    expect(() =>
      assertJournalBalanced([
        { debit: '10.5000', credit: '0' },
        { debit: '0', credit: '10.5000' },
      ]),
    ).not.toThrow();
  });
});
