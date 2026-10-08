// Admin panel raqamlari va vaqtlari: serverda, Toshkent vaqti bilan
const LOCALE = "uz-Latn-UZ";
const NUMBER = new Intl.NumberFormat(LOCALE);
const usd = (maxDigits: number) =>
  new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: "USD",
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 2,
    maximumFractionDigits: maxDigits,
  });
const USD = usd(2);
// Bitta so‘rov sentdan arzon bo‘lishi mumkin: 2 xonada hammasi "0,00 $" bo‘lib qolardi
const USD_FINE = usd(4);
const PERCENT = new Intl.NumberFormat(LOCALE, { style: "percent", maximumFractionDigits: 1 });
const DATE_TIME = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Tashkent",
});
// Oy va kun kalitlari SQL’dan Toshkent bo‘yicha keladi — bu yerda faqat nomini olamiz (UTC, siljishsiz)
const MONTH_SHORT = new Intl.DateTimeFormat(LOCALE, { month: "short", timeZone: "UTC" });
const MONTH_LONG = new Intl.DateTimeFormat(LOCALE, { month: "long", timeZone: "UTC" });
const DAY = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short", timeZone: "UTC" });

export const formatNumber = (value: number) => NUMBER.format(value);

/** cost_micro_usd → dollar (1 USD = 1 000 000) */
export const formatUsd = (microUsd: number, fine = false) => (fine ? USD_FINE : USD).format(microUsd / 1_000_000);

export const formatShare = (part: number, total: number) => (total > 0 ? PERCENT.format(part / total) : "—");

export const formatDateTime = (value: Date | string) => DATE_TIME.format(new Date(value));

export function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  return ms < 1000 ? `${ms} ms` : `${NUMBER.format(Math.round(ms / 100) / 10)} s`;
}

export function formatWait(hours: number): string {
  if (hours < 1) return "1 soatdan kam";
  return hours < 48 ? `${hours} soat` : `${Math.floor(hours / 24)} kun`;
}

/** "2026-10" → "Okt" yoki "Oktabr 2026" */
export function monthLabel(key: string, long = false): string {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  return long ? `${MONTH_LONG.format(date)} ${year}` : MONTH_SHORT.format(date);
}

/** "2026-10-08" → "8-okt" */
export function dayLabel(key: string): string {
  const [year, month, day] = key.split("-").map(Number);
  return DAY.format(new Date(Date.UTC(year, month - 1, day)));
}
