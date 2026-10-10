import type { Lang } from "./langs";

// Server qaysi vaqt mintaqasida ishlashidan qat’i nazar sana Toshkent vaqti bilan ko‘rsatiladi
const TZ = "Asia/Tashkent";
const DATE_OPTIONS = { day: "numeric", month: "long", year: "numeric", timeZone: TZ } as const;
const DATES: Record<Lang, Intl.DateTimeFormat> = {
  uz: new Intl.DateTimeFormat("uz-Latn-UZ", DATE_OPTIONS),
  ru: new Intl.DateTimeFormat("ru-RU", DATE_OPTIONS),
  en: new Intl.DateTimeFormat("en-GB", DATE_OPTIONS),
};
const PARTS = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "numeric", day: "numeric", timeZone: TZ });

export function formatDate(value: Date | string, lang: Lang = "uz"): string {
  return DATES[lang].format(new Date(value));
}

/** Google Scholar formati: 2026/10/8 (oy va kun oldida nol yo‘q) */
export function scholarDate(value: Date | string): string {
  const parts = Object.fromEntries(PARTS.formatToParts(new Date(value)).map((p) => [p.type, p.value]));
  return `${parts.year}/${Number(parts.month)}/${Number(parts.day)}`;
}

/** Toshkent vaqti bo‘yicha yil: 31-dekabr kechasi chop etilgan maqola keyingi yilga tushadi */
export function yearOf(value: Date | string): number {
  return Number(PARTS.formatToParts(new Date(value)).find((p) => p.type === "year")?.value);
}

export function formatBytes(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Meta description uchun: so‘z o‘rtasida kesmasdan qisqartiradi */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${space > max * 0.6 ? cut.slice(0, space) : cut}…`;
}
