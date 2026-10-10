import { LANGS, type Lang } from "@/lib/langs";

/** Asosiy til prefikssiz (/maqolalar), qolganlari prefiks bilan (/ru/maqolalar) — Scholar’dagi manzillar o‘zgarmaydi */
export const DEFAULT_LANG: Lang = "uz";

export const isLang = (value: unknown): value is Lang => LANGS.includes(value as Lang);

/** Bitta tilda qoladigan yo‘llar: kabinet, kirish, API, media fayllar va maqola PDF’i */
const UNLOCALIZED = /^\/(dashboard|admin|moderator|login|register|api|media)(?=[/?#]|$)|^\/maqola\/[^/?#]+\/pdf/;

/** Ichki havolaning shu tildagi manzili: localePath("ru", "/maqolalar") → "/ru/maqolalar"; "#..." va tashqi — o‘zgarmaydi */
export function localePath(lang: Lang, path: string): string {
  if (lang === DEFAULT_LANG || !path.startsWith("/") || UNLOCALIZED.test(path)) return path;
  return path === "/" ? `/${lang}` : `/${lang}${path}`;
}

const PREFIX = new RegExp(`^/(${LANGS.join("|")})(?=/|$)`);

/** Brauzer manzilidan til prefiksini olib tashlaydi: "/ru/maqolalar" → "/maqolalar", "/ru" → "/" */
export function stripLang(pathname: string): string {
  const match = pathname.match(PREFIX);
  return match ? pathname.slice(match[0].length) || "/" : pathname;
}

/**
 * Sahifa metadata’si uchun: o‘z tilidagi canonical va boshqa tillarga hreflang (o‘zbekchasi — x-default).
 * path — prefikssiz yo‘l ("/maqolalar").
 */
export function langAlternates(lang: Lang, path: string) {
  return {
    canonical: localePath(lang, path),
    languages: { ...Object.fromEntries(LANGS.map((l) => [l, localePath(l, path)])), "x-default": path },
  };
}
