/**
 * Kirgandan keyin qaytiladigan manzil (?next=): faqat shu saytning ichki yo‘li. "//evil.com", "/\evil.com",
 * to‘liq URL va boshqaruv belgilari rad etiladi — aks holda havola foydalanuvchini boshqa saytga olib ketardi.
 */
export function safeNext(raw: string | null | undefined): string | null {
  if (!raw || raw.length > 300 || !raw.startsWith("/") || raw.startsWith("//")) return null;
  return /[\\\u0000-\u001F\u007F]/.test(raw) ? null : raw;
}
