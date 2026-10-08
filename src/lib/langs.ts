export const LANGS = ["uz", "ru", "en"] as const;
export type Lang = (typeof LANGS)[number];

export const LANG_LABELS: Record<Lang, string> = { uz: "O‘zbekcha", ru: "Русский", en: "English" };
export const ABSTRACT_HEADINGS: Record<Lang, string> = { uz: "Annotatsiya", ru: "Аннотация", en: "Abstract" };
export const KEYWORDS_HEADINGS: Record<Lang, string> = { uz: "Kalit so‘zlar", ru: "Ключевые слова", en: "Keywords" };

/** "titleUz" kabi maydon nomlari uchun */
export const LANG_SUFFIX: Record<Lang, "Uz" | "Ru" | "En"> = { uz: "Uz", ru: "Ru", en: "En" };
