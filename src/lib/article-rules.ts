// Maqola qoidalari: klientdagi tekshiruv ro‘yxati va serverdagi yuborish shlyuzi BITTA funksiyadan foydalanadi.
import { LANGS, LANG_LABELS, LANG_SUFFIX, type Lang } from "./langs";

export const ARTICLE_STATUSES = ["draft", "submitted", "published", "rejected"] as const;
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];
/** O‘qituvchi tahrirlay oladigan holatlar */
export const EDITABLE_STATUSES: readonly ArticleStatus[] = ["draft", "rejected"];

export const STATUS_LABELS: Record<ArticleStatus, string> = {
  draft: "Qoralama",
  submitted: "Ko‘rib chiqilmoqda",
  published: "Chop etilgan",
  rejected: "Tuzatish kerak",
};

export const LICENSES = ["cc-by-4.0", "cc-by-nc-4.0", "all-rights-reserved"] as const;
export type License = (typeof LICENSES)[number];
export const LICENSE_INFO: Record<License, { label: string; url: string | null; hint: string }> = {
  "cc-by-4.0": {
    label: "CC BY 4.0",
    url: "https://creativecommons.org/licenses/by/4.0/",
    hint: "Tavsiya etiladi: muallifni ko‘rsatgan holda hamma o‘qishi va tarqatishi mumkin.",
  },
  "cc-by-nc-4.0": {
    label: "CC BY-NC 4.0",
    url: "https://creativecommons.org/licenses/by-nc/4.0/",
    hint: "Faqat notijorat maqsadda tarqatish mumkin.",
  },
  "all-rights-reserved": {
    label: "Barcha huquqlar himoyalangan",
    url: null,
    hint: "O‘qish mumkin, tarqatish uchun muallif ruxsati kerak.",
  },
};

export const ARTICLE_LIMITS = {
  titleMin: 10,
  titleMax: 300,
  abstractMin: 300,
  abstractMax: 3000,
  keywordsMin: 3,
  keywordsMax: 10,
  keywordMax: 60,
  authorsMax: 15,
  pdfMaxBytes: 10 * 1024 * 1024,
  /** Google Scholar shu hajmgacha PDF’larni ishonchli indekslaydi */
  pdfScholarBytes: 5 * 1024 * 1024,
} as const;

export type AuthorInput = {
  givenName: string;
  familyName: string;
  institution: string;
  orcid: string;
  isMe: boolean;
};

export type ArticleFields = {
  lang: Lang | null;
  license: License;
  rightsConfirmed: boolean;
  hasPdf: boolean;
  authors: AuthorInput[];
} & Record<`title${"Uz" | "Ru" | "En"}` | `abstract${"Uz" | "Ru" | "En"}`, string> &
  Record<`keywords${"Uz" | "Ru" | "En"}`, string[]>;

export type Problem = { field: string; message: string };

type TitledRow = { lang: Lang | null; titleUz: string | null; titleRu: string | null; titleEn: string | null };

/** Asosiy (PDF) tildagi sarlavha; u bo‘sh bo‘lsa — birinchi to‘ldirilgani */
export function titleIn(row: TitledRow): string {
  const byLang = row.lang ? row[`title${LANG_SUFFIX[row.lang]}`] : null;
  return byLang || row.titleUz || row.titleRu || row.titleEn || "Sarlavhasiz maqola";
}

export function splitKeywords(value: string): string[] {
  return [...new Set(value.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean))];
}

const cyrillicShare = (text: string) => {
  const letters = text.match(/\p{L}/gu) ?? [];
  if (letters.length === 0) return 0;
  return letters.filter((ch) => /\p{Script=Cyrillic}/u.test(ch)).length / letters.length;
};

const normalize = (text: string) => text.toLowerCase().replace(/\s+/g, " ").trim();

/** Yuborishdan oldin nima yetishmaydi. Bo‘sh ro‘yxat = yuborish mumkin. */
export function articleProblems(a: ArticleFields): Problem[] {
  const problems: Problem[] = [];
  const add = (field: string, message: string) => problems.push({ field, message });
  const L = ARTICLE_LIMITS;

  if (!a.lang) add("lang", "Maqola tilini tanlang");
  if (a.authors.length === 0) add("authors", "Kamida bitta muallif kerak");

  for (const lang of LANGS) {
    const s = LANG_SUFFIX[lang];
    const name = LANG_LABELS[lang];
    const title = a[`title${s}`].trim();
    const abstract = a[`abstract${s}`].trim();
    const keywords = a[`keywords${s}`];
    if (title.length < L.titleMin) add(`title${s}`, `${name}: sarlavha kamida ${L.titleMin} belgi`);
    if (abstract.length < L.abstractMin) add(`abstract${s}`, `${name}: annotatsiya kamida ${L.abstractMin} belgi`);
    if (keywords.length < L.keywordsMin) add(`keywords${s}`, `${name}: kamida ${L.keywordsMin} ta kalit so‘z`);
    // Eng ko‘p uchraydigan xato: o‘zbekcha matnni rus yoki ingliz maydoniga qo‘yib yuborish.
    // Sarlavha ham tekshiriladi: u tarjima sarlavhasi va (asosiy tilda) citation_title bo‘ladi
    const checkScript = (field: string, label: string, text: string, min: number) => {
      if (text.length < min) return;
      if (lang === "ru" && cyrillicShare(text) < 0.5) add(field, `${name}: ${label} rus tilida (kirill yozuvida) bo‘lishi kerak`);
      if (lang === "en" && cyrillicShare(text) > 0.1) add(field, `${name}: ${label} ingliz tilida bo‘lishi kerak`);
    };
    checkScript(`title${s}`, "sarlavha", title, L.titleMin);
    checkScript(`abstract${s}`, "annotatsiya", abstract, L.abstractMin);
  }

  const distinct = (part: "title" | "abstract") => {
    const texts = LANGS.map((l) => normalize(a[`${part}${LANG_SUFFIX[l]}`])).filter(Boolean);
    return new Set(texts).size === texts.length;
  };
  if (!distinct("title")) add("titleEn", "Sarlavhalar har xil tilda bo‘lishi kerak, nusxa emas");
  if (!distinct("abstract")) add("abstractEn", "Annotatsiyalar har xil tilda bo‘lishi kerak, nusxa emas");

  if (!a.hasPdf) add("pdf", "Maqolaning PDF faylini yuklang");
  if (!a.rightsConfirmed) add("rightsConfirmed", "Mualliflik huquqini tasdiqlang");
  return problems;
}
