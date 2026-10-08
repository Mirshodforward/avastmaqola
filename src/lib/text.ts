/**
 * Foydalanuvchi matni: NFC, boshqaruv belgilarisiz, ortiqcha bo‘sh qatorlarsiz. Yo‘nalishni almashtiruvchi (bidi)
 * va ko‘rinmas belgilar ham olib tashlanadi — ular bilan matn ekranda boshqacha o‘qiladigan qilib soxtalashtiriladi.
 */
export function cleanText(value: string): string {
  return value
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁠-⁤⁦-⁩﻿]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
