import "server-only";
import { acceptContact, bindTelegram, type BindResult, type TelegramIds } from "../auth/flow";
import { MESSAGES, askContact, sendCode, sendText } from "./messages";
import type { TgContact, TgUpdate } from "./types";

/** Telegram’dan kelgan bitta update’ni qayta ishlaydi (webhook va dev-poller uchun umumiy). */
export async function handleUpdate(update: TgUpdate): Promise<void> {
  const message = update.message;
  if (!message?.from || message.from.is_bot || message.chat.type !== "private") return;
  const tg: TelegramIds = { userId: message.from.id, chatId: message.chat.id };

  if (message.contact) return onContact(message.contact, tg);
  if (message.text?.startsWith("/start")) return onStart(message.text, tg);
  await sendText(tg.chatId, MESSAGES.help);
}

async function onStart(text: string, tg: TelegramIds) {
  const payload = text.split(/\s+/)[1];
  // Kod faqat saytdagi «Kodni olish» havolasi orqali (payload bilan): havolasiz /start — faqat salomlashuv
  if (!payload) return sendText(tg.chatId, MESSAGES.welcome);
  return reply(await bindTelegram(payload, tg), tg);
}

function reply(result: BindResult, tg: TelegramIds) {
  switch (result.kind) {
    case "code_sent":
      return sendCode(tg.chatId, result.code);
    case "bound":
      return askContact(tg.chatId, result.purpose);
    case "wait":
      return sendText(tg.chatId, MESSAGES.codeWait(result.seconds));
    case "codes_exhausted":
      return sendText(tg.chatId, MESSAGES.codesExhausted, { removeKeyboard: true });
    case "invalid":
      return sendText(tg.chatId, MESSAGES.linkInvalid);
  }
}

async function onContact(contact: TgContact, tg: TelegramIds) {
  // Kontakt kartasini boshqa odamniki qilib ham yuborish mumkin. Faqat «Kontaktni yuborish»
  // tugmasi orqali yuborilgan O‘Z kontaktida contact.user_id === message.from.id bo‘ladi.
  if (contact.user_id !== tg.userId) return sendText(tg.chatId, MESSAGES.notOwnContact);

  const result = await acceptContact(tg, contact.phone_number);
  switch (result.kind) {
    case "code_sent":
      return sendCode(tg.chatId, result.code);
    case "phone_mismatch":
      return sendText(tg.chatId, MESSAGES.phoneMismatch);
    case "no_flow":
      return sendText(tg.chatId, MESSAGES.noFlow, { removeKeyboard: true });
    case "telegram_taken":
      return sendText(tg.chatId, MESSAGES.telegramTaken, { removeKeyboard: true });
    case "rejected":
      return sendText(tg.chatId, result.message, { removeKeyboard: true });
  }
}
