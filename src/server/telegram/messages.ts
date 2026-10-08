import "server-only";
import { AUTH } from "../auth/config";
import { sendMessage } from "./api";

const BRAND = "Avtomaqola";
export const CONTACT_BUTTON = "📱 Kontaktni yuborish";

export const MESSAGES = {
  welcome:
    `Assalomu alaykum! Bu ${BRAND} saytining boti.\n\n` +
    "Ro‘yxatdan o‘tish yoki kirish uchun saytdagi «Kodni olish» tugmasini bosing — " +
    "shunda bot telefon raqamingizni tasdiqlashni so‘raydi.",
  help:
    "Kod olish uchun saytdagi «Kodni olish» tugmasini bosing, " +
    `so‘ng shu yerda «${CONTACT_BUTTON}» tugmasini bosing.`,
  linkInvalid: "Havola eskirgan yoki noto‘g‘ri. Saytga qaytib, jarayonni qaytadan boshlang.",
  codeWait: (seconds: number) =>
    `Kod yaqinda yuborildi. Yangisini ${seconds} soniyadan keyin olishingiz mumkin — ` +
    "oldingi kod hali amal qilsa, o‘shani saytda kiriting.",
  codesExhausted: "Bu urinish uchun kodlar limiti tugadi. Saytda jarayonni qaytadan boshlang.",
  notOwnContact: `Faqat o‘zingizning raqamingizni pastdagi «${CONTACT_BUTTON}» tugmasi orqali yuboring.`,
  noFlow:
    "Faol so‘rov topilmadi. Saytda «Ro‘yxatdan o‘tish» yoki «Kirish» tugmasini qaytadan bosing.",
  phoneMismatch:
    "Bu Telegram akkaunt raqami saytda kiritilgan raqamga mos kelmadi. " +
    "Saytda kiritgan raqamingiz ulangan Telegram akkauntdan foydalaning.",
  telegramTaken: "Bu Telegram akkaunt boshqa foydalanuvchi profiliga bog‘langan.",
  accountRelinked:
    `${BRAND} profilingiz boshqa Telegram akkauntga ko‘chirildi. ` +
    "Agar buni siz qilmagan bo‘lsangiz, darhol administratorga murojaat qiling.",
} as const;

export function askContact(chatId: number, purpose: "register" | "login") {
  const action = purpose === "register" ? "ro‘yxatdan o‘tish" : "kirish";
  return sendMessage(
    chatId,
    `${BRAND} saytida ${action} uchun telefon raqamingizni tasdiqlang.\n\n` +
      `Pastdagi «${CONTACT_BUTTON}» tugmasini bosing.`,
    {
      reply_markup: {
        keyboard: [[{ text: CONTACT_BUTTON, request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
        input_field_placeholder: "Kontaktni yuboring",
      },
    },
  );
}

export function sendCode(chatId: number, code: string) {
  return sendMessage(
    chatId,
    `Tasdiqlash kodi: <code>${code}</code>\n\n` +
      `Kod ${AUTH.codeTtlSeconds / 60} daqiqa amal qiladi. Uni saytdagi maydonga kiriting.\n` +
      `Kodni hech kimga bermang — ${BRAND} xodimlari uni hech qachon so‘ramaydi.\n` +
      "Saytga kirishni siz boshlamagan bo‘lsangiz, bu xabarga e’tibor bermang.",
    { parse_mode: "HTML", reply_markup: { remove_keyboard: true } },
  );
}

export function sendText(chatId: number, text: string, opts: { removeKeyboard?: boolean } = {}) {
  return sendMessage(
    chatId,
    text,
    opts.removeKeyboard ? { reply_markup: { remove_keyboard: true } } : undefined,
  );
}
