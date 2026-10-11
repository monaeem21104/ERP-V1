import { d, money, sum } from './money';

describe('money helpers', () => {
  it('does not use floating point for currency totals', () => {
    const total = sum(['0.10', '0.20']);
    expect(money(total)).toBe('0.3000');
    expect(d('0.1').plus('0.2').toString()).toBe('0.3');
  });

  it('rejects treating JS number 0.1+0.2 as source of truth', () => {
    expect(0.1 + 0.2).not.toBe(0.3);
    expect(d(0.1).plus(d(0.2)).toFixed(1)).toBe('0.3');
  });
});
