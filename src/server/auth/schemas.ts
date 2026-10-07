import "server-only";
import { z } from "zod";
import { NAME_PATTERN, normalizeOrcid, normalizeUzPhone } from "@/lib/validation";

const personName = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label}ni kiriting`)
    .max(64, `${label} juda uzun`)
    .regex(NAME_PATTERN, `${label}da faqat harflar bo‘lishi kerak`);

const phone = z
  .string()
  .refine((v) => normalizeUzPhone(v) !== null, "Raqamni +998901234567 ko‘rinishida kiriting")
  .transform((v) => normalizeUzPhone(v)!);

const orcid = z
  .string()
  .refine(
    (v) => normalizeOrcid(v) !== null,
    "ORCID iD noto‘g‘ri. U 0000-0000-0000-0000 ko‘rinishida bo‘ladi",
  )
  .transform((v) => normalizeOrcid(v)!);

export const registerSchema = z.object({
  firstName: personName("Ism"),
  lastName: personName("Familiya"),
  phone,
  orcid,
});

export const loginSchema = z.object({ phone });

export const verifySchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, "6 xonali kodni kiriting"),
});

export type RegisterInput = z.output<typeof registerSchema>;
