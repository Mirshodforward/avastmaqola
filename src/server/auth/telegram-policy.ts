/**
 * Kirish paytida kontakt yuborgan Telegram akkaunt foydalanuvchining
 * ro‘yxatdan o‘tishda bog‘langan akkauntidan FARQ qilsa, nima qilamiz?
 *
 * Telefon raqami bu yerga kelguncha tekshirilgan — u mos keladi. Farq faqat
 * Telegram akkauntida. Bu ikki xil holatda yuz beradi:
 *  - o‘qituvchi yangi Telegram akkaunt ochgan (yoki eski akkauntini o‘chirgan), raqami o‘sha;
 *  - uzoq ishlatilmagan raqam operator tomonidan boshqa odamga qayta sotilgan —
 *    ya’ni begona odam o‘qituvchining kabinetiga kirmoqchi.
 * Ikkalasini server ajrata olmaydi, shuning uchun bu xavfsizlik va qulaylik o‘rtasidagi tanlov.
 *
 * Bu funksiya ikki joyda chaqiriladi (toza funksiya bo‘lgani uchun natija bir xil bo‘ladi):
 *  1) bot kontaktni qabul qilganda — "reject" bo‘lsa kod umuman yuborilmaydi va botda `message` chiqadi;
 *  2) saytda kod tasdiqlanganda — "relink" bo‘lsa users.telegram_user_id yangilanadi,
 *     `notifyPrevious: true` bo‘lsa eski akkauntga ogohlantirish yuboriladi.
 * Agar yangi akkaunt allaqachon BOSHQA foydalanuvchiga bog‘langan bo‘lsa, bu funksiyagacha yetib kelmaydi.
 */
export type TelegramAccountDecision =
  | { action: "allow" } // kiritamiz, bog‘lanishni o‘zgartirmaymiz
  | { action: "relink"; notifyPrevious: boolean } // kiritamiz va profilni yangi akkauntga ko‘chiramiz
  | { action: "reject"; message: string }; // rad etamiz

export function decideTelegramAccountChange(input: {
  /** Ro‘yxatdan o‘tishda bog‘langan akkaunt (null — hali bog‘lanmagan) */
  linkedTelegramId: number | null;
  /** Hozir kontakt yuborgan akkaunt (linkedTelegramId dan farq qiladi) */
  incomingTelegramId: number;
}): TelegramAccountDecision {
  // TODO(siz): siyosatni tanlang (5–10 qator). Hozircha bu holatda kirish ishlamaydi.
  throw new Error(
    `decideTelegramAccountChange hali yozilmagan (linked=${input.linkedTelegramId}, incoming=${input.incomingTelegramId})`,
  );
}
