// Klient va server uchun umumiy tekshiruvlar: toza funksiyalar, server bog‘liqligi yo‘q.

/** Ism/familiya: lotin yoki kirill harflari, o‘zbekcha tutuq belgilari, defis, bo‘sh joy. */
export const NAME_PATTERN = /^[\p{L}\p{M}'‘’ʻʼ`\- ]+$/u;

/** "+998 90 123-45-67", "998901234567", "901234567" → "+998901234567" */
export function normalizeUzPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("998")) return `+${digits}`;
  if (digits.length === 9) return `+998${digits}`;
  return null;
}

/** "+998901234567" → "+998 90 123 45 67" */
export function formatUzPhone(phone: string): string {
  const d = phone.slice(4);
  return `+998 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7)}`;
}

/** "+998901234567" → "+998 90 ••• •• 67" */
export function maskUzPhone(phone: string): string {
  const d = phone.slice(4);
  return `+998 ${d.slice(0, 2)} ••• •• ${d.slice(7)}`;
}

/**
 * "https://orcid.org/0000-0002-1825-0097" yoki "0000000218250097" → "0000-0002-1825-0097".
 * Oxirgi belgi ISO 7064 MOD 11-2 nazorat raqami: bitta raqam xato yozilsa yoki
 * qo‘shni raqamlar o‘rni almashsa, tekshiruvdan o‘tmaydi.
 */
export function normalizeOrcid(input: string): string | null {
  const compact = input
    .trim()
    .toUpperCase()
    .replace(/^HTTPS?:\/\/(WWW\.)?ORCID\.ORG\//, "")
    .replace(/[\s-]/g, "");
  if (!/^\d{15}[\dX]$/.test(compact)) return null;

  let total = 0;
  for (let i = 0; i < 15; i++) total = (total + Number(compact[i])) * 2;
  const check = (12 - (total % 11)) % 11;
  if (compact[15] !== (check === 10 ? "X" : String(check))) return null;

  return compact.replace(/^(\d{4})(\d{4})(\d{4})(\d{3}[\dX])$/, "$1-$2-$3-$4");
}
