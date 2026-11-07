const MONTHS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

/**
 * "24 sep" de una fecha que la API entrega como inicio de día en UTC (p. ej. `week_start`). Se lee en UTC a propósito:
 * en Chile (UTC-3/-4) la hora local de esa medianoche cae el día anterior.
 */
export function utcShortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}
