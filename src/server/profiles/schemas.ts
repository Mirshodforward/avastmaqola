import "server-only";
import { z } from "zod";
import { ACADEMIC_DEGREES } from "@/lib/profile-labels";
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
  position: required("Lavozim", 80),
  academicDegree: choice(ACADEMIC_DEGREES),
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
});

export type ProfileInput = z.output<typeof profileSchema>;
