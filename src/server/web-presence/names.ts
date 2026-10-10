import { slugify } from "@/lib/slug";

/**
 * Ismlarni turli yozuv va imloda solishtirish kaliti: kirill → lotin, x/kh/h, q/k, j/dj/zh bir xil,
 * birinchi harfdan keyingi unlilar tashlanadi. "Ismoilov", "Ismailov", "Исмоилов", "Исмаилов" → "smlv".
 */
export function nameKey(name: string): string {
  const s = slugify(name)
    .replace(/-/g, "")
    .replace(/kh/g, "h")
    .replace(/x/g, "h")
    .replace(/q/g, "k")
    .replace(/dj|zh/g, "j")
    .replace(/w/g, "v");
  return (s.charAt(0) + s.slice(1).replace(/[aeiouy]/g, "")).replace(/(.)\1+/g, "$1");
}

/** Profildagi familiya shu ismlardan birida bormi (ORCID’dagi asosiy, "credit" va boshqa ismlar) */
export function hasSurname(lastName: string, names: string[]): boolean {
  const key = nameKey(lastName);
  if (key.length < 2) return false;
  return names.some((name) => name.split(/[\s,.\-‘’ʻʼ']+/).some((token) => token.length > 1 && nameKey(token) === key));
}
