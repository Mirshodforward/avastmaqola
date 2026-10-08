import "server-only";
import { z } from "zod";
import { NAME_PATTERN, normalizeUzPhone } from "@/lib/validation";

export const personName = (label: string) =>
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

// ORCID iD bu yerda so‘ralmaydi — u profil tahririda kiritiladi
export const registerSchema = z.object({
  firstName: personName("Ism"),
  lastName: personName("Familiya"),
  phone,
});

export const loginSchema = z.object({ phone });

export const verifySchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, "6 xonali kodni kiriting"),
});

export type RegisterInput = z.output<typeof registerSchema>;
