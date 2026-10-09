import "server-only";
import { z } from "zod";
import { ARTICLE_LIMITS as L, LICENSES, VENUE_TYPES, normalizeDoi } from "@/lib/article-rules";
import { ISSUE_MAX } from "@/lib/issue";
import { LANGS } from "@/lib/langs";
import { cleanText } from "@/lib/text";
import { normalizeOrcid } from "@/lib/validation";

const block = (max: number) => z.string().max(max, `Ko‘pi bilan ${max} ta belgi`).transform(cleanText);
const line = (max: number) => block(max).transform((v) => v.replace(/\s+/g, " "));

/** Ixtiyoriy qisqa matn: bo‘sh bo‘lsa bazaga NULL yoziladi */
const optional = (max: number) =>
  line(max)
    .default("")
    .transform((v) => v || null);

const keywords = z
  .array(z.string().trim().min(1).max(L.keywordMax, `Kalit so‘z ko‘pi bilan ${L.keywordMax} belgi`))
  .max(L.keywordsMax, `Ko‘pi bilan ${L.keywordsMax} ta kalit so‘z`)
  // Faqat ko‘rinmas belgidan iborat so‘z tozalangach bo‘sh qoladi — u kalit so‘z sifatida sanalmasin
  .transform((list) => [...new Set(list.map(cleanText).filter(Boolean))]);

// Mualliflar ismida bosh harflar uchun nuqta ham bo‘lishi mumkin
const AUTHOR_NAME = /^[\p{L}\p{M}'‘’ʻʼ`.\- ]+$/u;
const authorName = (label: string) =>
  z.string().trim().min(1, `${label}ni kiriting`).max(64, "Juda uzun").regex(AUTHOR_NAME, "Faqat harflar");

/** O‘qituvchi formasidagi son yoki raqam (matn). Bo‘sh bo‘lsa saqlangani o‘zgarmaydi */
const issueField = z
  .union([z.literal(""), z.string().regex(/^[1-9][0-9]{0,2}$/, `1 dan ${ISSUE_MAX} gacha raqam`)])
  .default("")
  .transform((v) => (v ? Number(v) : undefined));

const issueNumber = z.int(`1 dan ${ISSUE_MAX} gacha raqam`).min(1, `1 dan ${ISSUE_MAX} gacha raqam`).max(ISSUE_MAX, `1 dan ${ISSUE_MAX} gacha raqam`);

/** Moderator yoki admin tasdiqlagan joy: "3-son, 12-maqola" */
const issuePlaceSchema = z.object({ issueNo: issueNumber, issueSeq: issueNumber });

/** Chop etilgan maqolani boshqa joyga ko‘chirish */
export const moveSchema = z.object({ place: issuePlaceSchema });

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
  // Nashr ma’lumotlari — eski klientlar yubormasa ham saqlash ishlayveradi
  venueType: z
    .union([z.literal(""), z.enum(VENUE_TYPES)])
    .default("")
    .transform((v) => v || null),
  venue: optional(300),
  volume: optional(30),
  issue: optional(30),
  pages: optional(30),
  pubYear: z
    .union([z.literal(""), z.string().regex(/^\d{4}$/, "Yilni to‘rt raqam bilan yozing")])
    .default("")
    .transform((v) => (v ? Number(v) : null))
    .refine((v) => v === null || (v >= 1900 && v <= 2100), "Yil noto‘g‘ri"),
  doi: z
    .string()
    .trim()
    .max(200, "Juda uzun")
    .default("")
    .refine((v) => !v || normalizeDoi(v) !== null, "DOI noto‘g‘ri. Masalan: 10.1117/12.3110012")
    .transform((v) => (v ? normalizeDoi(v) : null)),
  issueNo: issueField,
  issueSeq: issueField,
  authors: z
    .array(author)
    .min(1, "Kamida bitta muallif kerak")
    .max(L.authorsMax, `Ko‘pi bilan ${L.authorsMax} ta muallif`)
    .refine((list) => list.filter((a) => a.isMe).length === 1, "Mualliflardan biri siz bo‘lishingiz kerak"),
});

export type DraftInput = z.output<typeof draftSchema>;

export const reviewSchema = z
  .object({
    action: z.enum(["approve", "reject", "unpublish"]),
    note: z.string().trim().max(1000, "Ko‘pi bilan 1000 ta belgi").default(""),
    /** Ko‘rib chiquvchi ko‘rgan yuborish vaqti: eski oynadan qayta yuborilgan (ko‘rilmagan) matnni tasdiqlab bo‘lmaydi */
    submittedAt: z.iso.datetime().optional(),
    /** Chop etishda majburiy: maqola qaysi son va raqamda chiqadi */
    place: issuePlaceSchema.optional(),
  })
  .refine((b) => b.action !== "approve" || b.place, { path: ["place"], message: "Son va raqamni kiriting" });

export type ReviewAction = z.output<typeof reviewSchema>["action"];

/** URL’dagi maqola raqami: faqat musbat butun son */
export function parseArticleId(raw: string): number | null {
  return /^[1-9][0-9]{0,8}$/.test(raw) ? Number(raw) : null;
}
