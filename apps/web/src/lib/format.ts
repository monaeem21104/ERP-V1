export function formatMoney(value: string | number | undefined, locale: string, currency = 'USD') {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat(locale === 'ar' ? 'ar' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(n);
}

export function formatDate(value: string | Date | undefined, locale: string) {
  if (!value) return '—';
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
