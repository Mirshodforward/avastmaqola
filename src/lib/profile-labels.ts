// Profil maydonlari uchun ruxsat etilgan qiymatlar va o‘zbekcha nomlari (klient va server uchun umumiy)

export const ACADEMIC_DEGREES = ["phd", "dsc", "fan_nomzodi", "fan_doktori"] as const;
export type AcademicDegree = (typeof ACADEMIC_DEGREES)[number];
export const ACADEMIC_DEGREE_LABELS: Record<AcademicDegree, string> = {
  phd: "Falsafa doktori (PhD)",
  dsc: "Fan doktori (DSc)",
  fan_nomzodi: "Fan nomzodi (eski tizim)",
  fan_doktori: "Fan doktori (eski tizim)",
};

export const ACADEMIC_TITLES = ["dotsent", "professor", "katta_ilmiy_xodim"] as const;
export type AcademicTitle = (typeof ACADEMIC_TITLES)[number];
export const ACADEMIC_TITLE_LABELS: Record<AcademicTitle, string> = {
  dotsent: "Dotsent",
  professor: "Professor",
  katta_ilmiy_xodim: "Katta ilmiy xodim",
};

type Credentials = { position: string | null; academicDegree: AcademicDegree | null; academicTitle: AcademicTitle | null };

/** "Dotsent, Falsafa doktori (PhD)": lavozim va unvon bir xil bo‘lsa (Dotsent / Dotsent), bir marta yoziladi */
export function credentialsLine({ position, academicDegree, academicTitle }: Credentials): string {
  const parts = [position, academicDegree && ACADEMIC_DEGREE_LABELS[academicDegree], academicTitle && ACADEMIC_TITLE_LABELS[academicTitle]];
  const seen = new Set<string>();
  return parts
    .filter((part): part is string => {
      const key = part?.trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join(", ");
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
