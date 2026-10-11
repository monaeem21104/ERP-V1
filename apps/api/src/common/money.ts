import { Decimal } from 'decimal.js';

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export function d(value: Decimal.Value): Decimal {
  return new Decimal(value ?? 0);
}

export function money(value: Decimal.Value): string {
  return d(value).toFixed(4);
}

export function assertPositive(value: Decimal.Value, field = 'quantity') {
  if (d(value).lte(0)) {
    throw new Error(`${field} must be greater than zero`);
  }
}

export function sum(values: Decimal.Value[]): Decimal {
  return values.reduce<Decimal>((acc, v) => acc.plus(d(v)), d(0));
}
