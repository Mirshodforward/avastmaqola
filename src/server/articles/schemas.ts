import "server-only";
import { z } from "zod";
import { ARTICLE_LIMITS as L, LICENSES } from "@/lib/article-rules";
import { LANGS } from "@/lib/langs";
import { cleanText } from "@/lib/text";
import { normalizeOrcid } from "@/lib/validation";

const block = (max: number) => z.string().max(max, `Ko‘pi bilan ${max} ta belgi`).transform(cleanText);
const line = (max: number) => block(max).transform((v) => v.replace(/\s+/g, " "));

const keywords = z
  .array(z.string().trim().min(1).max(L.keywordMax, `Kalit so‘z ko‘pi bilan ${L.keywordMax} belgi`))
  .max(L.keywordsMax, `Ko‘pi bilan ${L.keywordsMax} ta kalit so‘z`)
  // Faqat ko‘rinmas belgidan iborat so‘z tozalangach bo‘sh qoladi — u kalit so‘z sifatida sanalmasin
  .transform((list) => [...new Set(list.map(cleanText).filter(Boolean))]);

// Mualliflar ismida bosh harflar uchun nuqta ham bo‘lishi mumkin
const AUTHOR_NAME = /^[\p{L}\p{M}'‘’ʻʼ`.\- ]+$/u;
const authorName = (label: string) =>
  z.string().trim().min(1, `${label}ni kiriting`).max(64, "Juda uzun").regex(AUTHOR_NAME, "Faqat harflar");

const author = z.object({
  givenName: authorName("Ism"),
  familyName: authorName("Familiya"),
  institution: line(150),
  orcid: z
    .string()
    .trim()
    .refine((v) => !v || normalizeOrcid(v) !== null, "ORCID iD noto‘g‘ri")
    .transform((v) => (v ? normalizeOrcid(v)! : "")),
  isMe: z.boolean(),
});

/** Qoralamani saqlash: maydonlar chala bo‘lishi mumkin, to‘liqlik yuborishda tekshiriladi */
export const draftSchema = z.object({
  lang: z.union([z.literal(""), z.enum(LANGS)]).transform((v) => v || null),
  titleUz: line(L.titleMax),
  titleRu: line(L.titleMax),
  titleEn: line(L.titleMax),
  abstractUz: block(L.abstractMax),
  abstractRu: block(L.abstractMax),
  abstractEn: block(L.abstractMax),
  keywordsUz: keywords,
  keywordsRu: keywords,
  keywordsEn: keywords,
  license: z.enum(LICENSES),
  rightsConfirmed: z.boolean(),
  authors: z
    .array(author)
    .min(1, "Kamida bitta muallif kerak")
    .max(L.authorsMax, `Ko‘pi bilan ${L.authorsMax} ta muallif`)
    .refine((list) => list.filter((a) => a.isMe).length === 1, "Mualliflardan biri siz bo‘lishingiz kerak"),
});

export type DraftInput = z.output<typeof draftSchema>;

export const reviewSchema = z.object({
  action: z.enum(["approve", "reject", "unpublish"]),
  note: z.string().trim().max(1000, "Ko‘pi bilan 1000 ta belgi").default(""),
  /** Admin ko‘rgan yuborish vaqti: eski oynadan qayta yuborilgan (ko‘rilmagan) matnni tasdiqlab bo‘lmaydi */
  submittedAt: z.iso.datetime().optional(),
});

export type ReviewAction = z.output<typeof reviewSchema>["action"];

/** URL’dagi maqola raqami: faqat musbat butun son */
export function parseArticleId(raw: string): number | null {
  return /^[1-9][0-9]{0,8}$/.test(raw) ? Number(raw) : null;
}
