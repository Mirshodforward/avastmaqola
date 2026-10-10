// Profil maydonlari uchun ruxsat etilgan qiymatlar va o‘zbekcha nomlari (klient va server uchun umumiy)
import { profileText } from "@/i18n/profile";
import type { Lang } from "./langs";

export const ACADEMIC_DEGREES = ["phd", "dsc", "fan_nomzodi", "fan_doktori"] as const;
export type AcademicDegree = (typeof ACADEMIC_DEGREES)[number];
export const ACADEMIC_DEGREE_LABELS: Record<AcademicDegree, string> = {
  phd: "Falsafa doktori (PhD)",
  dsc: "Fan doktori (DSc)",
  fan_nomzodi: "Fan nomzodi (eski tizim)",
  fan_doktori: "Fan doktori (eski tizim)",
};

type Credentials = { position: string | null; academicDegree: AcademicDegree | null };

/** "Dotsent, Falsafa doktori (PhD)". Lavozim — o‘qituvchi yozgan matn (o‘zgarmaydi), daraja — sahifa tilida */
export function credentialsLine({ position, academicDegree }: Credentials, lang: Lang = "uz"): string {
  const degree = academicDegree && (lang === "uz" ? ACADEMIC_DEGREE_LABELS : profileText[lang].degrees)[academicDegree];
  return [position, degree].filter(Boolean).join(", ");
}

export const POSITION_SUGGESTIONS = [
  "Assistent",
  "O‘qituvchi",
  "Katta o‘qituvchi",
  "Dotsent",
  "Professor",
  "Kafedra mudiri",
  "Dekan",
];
