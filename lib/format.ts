/**
 * Formato de la UI en español de Chile. Sin `Intl` para dinero y fechas relativas: el resultado es el
 * mismo en Node (tests), Hermes (iOS/Android) y el navegador. La única excepción es el día calendario de
 * Santiago en `endsIn`, que usa `Intl.DateTimeFormat` si existe y, si no, la hora del dispositivo.
 */

/** CLP sin decimales y con punto de miles: 1090 → "$1.090", 1234567 → "$1.234.567". */
export function money(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const whole = Math.round(Math.abs(n));
  const digits = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${n < 0 && whole > 0 ? "-" : ""}$${digits}`;
}

/** Precio por unidad de medida: (1090, "L") → "$1.090 / L". Sin unidad, solo el monto. */
export function ppumLabel(ppum: number, unit?: string | null): string {
  const u = unit?.trim();
  return u ? `${money(ppum)} / ${u}` : money(ppum);
}

/** Descuento entero en %: (1290, 1090) → 16. 0 si no hay rebaja. */
export function pct(from: number, to: number): number {
  if (!(from > 0) || to >= from) return 0;
  return Math.round(((from - to) / from) * 100);
}

/** Distancia legible: 0.85 → "850 m", 2.34 → "2,3 km", 12.6 → "13 km". */
export function km(distance: number): string {
  if (!Number.isFinite(distance) || distance < 0) return "";
  if (distance < 1) return `${Math.max(10, Math.round((distance * 1000) / 10) * 10)} m`;
  if (distance < 10) return `${distance.toFixed(1).replace(".", ",")} km`;
  return `${Math.round(distance)} km`;
}

const MIN = 60;
const HOUR = 3600;
const DAY = 86400;

type Instant = number | Date;
const ms = (t: Instant) => (typeof t === "number" ? t : t.getTime());

/** Antigüedad de un instante ISO: "hace un momento", "hace 5 min", "hace 2 h", "hace 3 días", "hace 2 meses". */
export function timeAgo(iso: string, now: Instant = Date.now()): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "sin fecha";
  const sec = Math.floor((ms(now) - then) / 1000);
  // un reloj levemente adelantado no debe decir "en el futuro"
  if (sec < MIN) return "hace un momento";
  if (sec < HOUR) return `hace ${Math.floor(sec / MIN)} min`;
  if (sec < DAY) return `hace ${Math.floor(sec / HOUR)} h`;
  const days = Math.floor(sec / DAY);
  if (days < 30) return days === 1 ? "hace 1 día" : `hace ${days} días`;
  if (days < 365) {
    const months = Math.floor(days / 30);
    return months === 1 ? "hace 1 mes" : `hace ${months} meses`;
  }
  const years = Math.floor(days / 365);
  return years === 1 ? "hace 1 año" : `hace ${years} años`;
}

const SANTIAGO = "America/Santiago";
let dayFormat: Intl.DateTimeFormat | null | undefined;

/** Número de día calendario (días desde 1970) de un instante, en hora de Santiago; en la del dispositivo si no hay Intl. */
function calendarDay(date: Date): number {
  if (dayFormat === undefined) {
    try {
      dayFormat = new Intl.DateTimeFormat("en-US", { timeZone: SANTIAGO, year: "numeric", month: "numeric", day: "numeric" });
    } catch {
      dayFormat = null;
    }
  }
  if (dayFormat) {
    try {
      const parts = dayFormat.formatToParts(date);
      const part = (type: string) => Number(parts.find((p) => p.type === type)?.value);
      const [y, m, d] = [part("year"), part("month"), part("day")];
      if (y && m && d) return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
    } catch {
      /* cae a la hora del dispositivo */
    }
  }
  return Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
}

/**
 * Vigencia de una oferta (`promo_ends_at`, ISO): "vence hoy", "vence mañana", "vence en 5 días".
 * Null si no hay fecha, no se entiende o la oferta ya venció. El día se cuenta en hora de Santiago.
 */
export function endsIn(iso: string | null | undefined, now: Instant = Date.now()): string | null {
  if (!iso) return null;
  const end = new Date(iso);
  if (Number.isNaN(end.getTime())) return null;
  const current = new Date(ms(now));
  if (end.getTime() < current.getTime()) return null;
  const days = calendarDay(end) - calendarDay(current);
  if (days <= 0) return "vence hoy";
  if (days === 1) return "vence mañana";
  return `vence en ${days} días`;
}

/** `true` si la fecha de término ya pasó (la oferta venció). Sin fecha o ilegible, `false`. */
export function isExpired(iso: string | null | undefined, now: Instant = Date.now()): boolean {
  if (!iso) return false;
  const end = Date.parse(iso);
  return !Number.isNaN(end) && end < ms(now);
}
