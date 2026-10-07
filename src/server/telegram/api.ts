import "server-only";
import type { ReplyMarkup } from "./types";

type SendOptions = { parse_mode?: "HTML"; reply_markup?: ReplyMarkup };

export async function sendMessage(chatId: number, text: string, options: SendOptions = {}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    // Token bo‘lmasa, dev rejimida xabarni server konsoliga chiqaramiz — botsiz ham oqimni sinash mumkin
    if (process.env.NODE_ENV !== "production") {
      console.info(`\n[telegram:dev] chat ${chatId} uchun xabar:\n${text}\n`);
      return;
    }
    throw new Error("TELEGRAM_BOT_TOKEN sozlanmagan");
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, ...options }),
    signal: AbortSignal.timeout(10_000),
  });
  const data = (await res.json().catch(() => null)) as { ok: boolean; description?: string } | null;
  if (!data?.ok) throw new Error(`Telegram sendMessage: ${data?.description ?? `HTTP ${res.status}`}`);
}
