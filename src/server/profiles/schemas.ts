import "server-only";
import { z } from "zod";
import { ACADEMIC_DEGREES, ACADEMIC_TITLES } from "@/lib/profile-labels";
import { cleanText } from "@/lib/text";
import { NAME_PATTERN, normalizeOrcid } from "@/lib/validation";
import { personName } from "../auth/schemas";

/** Bo‘sh satr → null */
const optional = (schema: z.ZodType<string>) => schema.transform((v) => v || null);

// Profil moderatsiyasiz ochiladi: bidi va ko‘rinmas belgilar tozalanadi, uzunlik tozalangandan keyin tekshiriladi
const text = (max: number) => z.string().transform(cleanText).pipe(z.string().max(max, `Ko‘pi bilan ${max} ta belgi`));

const required = (label: string, max: number) =>
  z
    .string()
    .transform(cleanText)
    .pipe(z.string().min(2, `${label}ni kiriting`).max(max, `Ko‘pi bilan ${max} ta belgi`));

function link(host: RegExp | null, message: string) {
  return optional(
    z
      .string()
      .trim()
      .refine((v) => {
        if (!v) return true;
        try {
          const url = new URL(v);
          return (url.protocol === "https:" || url.protocol === "http:") && (!host || host.test(url.hostname));
        } catch {
          return false;
        }
      }, message),
  );
}

const choice = <T extends readonly [string, ...string[]]>(values: T) =>
  z.union([z.literal(""), z.enum(values)]).transform((v) => (v === "" ? null : v));

export const profileSchema = z.object({
  firstName: personName("Ism"),
  lastName: personName("Familiya"),
  patronymic: optional(text(60).refine((v) => !v || NAME_PATTERN.test(v), "Faqat harflar bo‘lishi kerak")),
  // Ilmiy nashrlardagi ism: bosh harflar uchun nuqta ham ruxsat
  publishedName: optional(
    text(100).refine((v) => !v || /^[\p{L}\p{M}'‘’ʻʼ`.\- ]+$/u.test(v), "Faqat harflar, nuqta va defis"),
  ),
  position: required("Lavozim", 80),
  academicDegree: choice(ACADEMIC_DEGREES),
  academicTitle: choice(ACADEMIC_TITLES),
  institution: required("Muassasa", 150),
  department: optional(text(150)),
  direction: required("Yo‘nalish", 120),
  bio: optional(text(1500)),
  keywords: z
    .string()
    .transform((v) => [...new Set(v.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean))])
    .pipe(z.array(z.string().max(40, "Har bir kalit so‘z ko‘pi bilan 40 belgi")).max(10, "Ko‘pi bilan 10 ta kalit so‘z")),
  orcid: optional(
    z
      .string()
      .trim()
      .refine((v) => !v || normalizeOrcid(v) !== null, "ORCID iD noto‘g‘ri. U 0000-0000-0000-0000 ko‘rinishida bo‘ladi")
      .transform((v) => (v ? normalizeOrcid(v)! : "")),
  ),
  // Faqat Google domenlari: scholar.google.com, .co.uk, .com.au, .ru … ("scholar.google.evil.com" emas)
  googleScholarUrl: link(
    /^scholar\.google\.(?:com|co\.[a-z]{2}|com\.[a-z]{2}|[a-z]{2})$/,
    "Google Scholar profil havolasini kiriting (scholar.google.com/citations?user=…)",
  ),
  scopusAuthorId: optional(z.string().trim().refine((v) => !v || /^\d{10,11}$/.test(v), "Scopus Author ID 10–11 xonali raqam")),
  researcherId: optional(
    z.string().trim().toUpperCase().refine((v) => !v || /^[A-Z]{1,3}-\d{4}-\d{4}$/.test(v), "ResearcherID ko‘rinishi: ABC-1234-2020"),
  ),
  researchgateUrl: link(/(^|\.)researchgate\.net$/, "ResearchGate profil havolasini kiriting"),
  websiteUrl: link(null, "Havola http:// yoki https:// bilan boshlanishi kerak"),
  publicEmail: optional(z.string().trim().refine((v) => !v || z.email().safeParse(v).success, "Email noto‘g‘ri")),
  isPublic: z.boolean(),
});

export type ProfileInput = z.output<typeof profileSchema>;
