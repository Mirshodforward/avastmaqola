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

/** Taklif qilingan lavozimlarning tarjimasi (POSITION_SUGGESTIONS); o‘qituvchi o‘zi yozgani o‘zgarmaydi */
const POSITIONS: Record<Exclude<Lang, "uz">, Record<string, string>> = {
  ru: {
    Assistent: "Ассистент",
    "O‘qituvchi": "Преподаватель",
    "Katta o‘qituvchi": "Старший преподаватель",
    Dotsent: "Доцент",
    Professor: "Профессор",
    "Kafedra mudiri": "Заведующий кафедрой",
    Dekan: "Декан",
  },
  en: {
    Assistent: "Assistant lecturer",
    "O‘qituvchi": "Lecturer",
    "Katta o‘qituvchi": "Senior lecturer",
    Dotsent: "Associate professor",
    Professor: "Professor",
    "Kafedra mudiri": "Head of department",
    Dekan: "Dean",
  },
};

/** "Dotsent, Falsafa doktori (PhD)" — sahifa tilida: daraja va taklif qilingan lavozim tarjima qilinadi */
export function credentialsLine({ position, academicDegree }: Credentials, lang: Lang = "uz"): string {
  const degree = academicDegree && (lang === "uz" ? ACADEMIC_DEGREE_LABELS : profileText[lang].degrees)[academicDegree];
  const role = position && lang !== "uz" ? (POSITIONS[lang][position.trim()] ?? position) : position;
  return [role, degree].filter(Boolean).join(", ");
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
