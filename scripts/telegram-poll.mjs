// Lokal ishlab chiqish uchun: Telegram’dan update’larni long-polling bilan olib,
// ishlayotgan `npm run dev` serverining webhook’iga uzatadi. Shunday qilib ngrok kerak emas,
// bot mantig‘i esa production’dagi bilan bir xil kodda ishlaydi.
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd(), true);

const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const target = process.env.TELEGRAM_DEV_WEBHOOK_URL ?? "http://localhost:3000/api/telegram/webhook";

if (!token || !secret) {
  console.error(".env.local’da TELEGRAM_BOT_TOKEN va TELEGRAM_WEBHOOK_SECRET bo‘lishi kerak.");
  process.exit(1);
}

async function api(method, body = {}) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Webhook o‘rnatilgan bo‘lsa, getUpdates ishlamaydi
await api("deleteWebhook");
const me = await api("getMe");
if (!me.ok) {
  console.error("Bot token noto‘g‘ri:", me.description);
  process.exit(1);
}
console.log(`@${me.result.username} update’lari → ${target}`);

let offset = 0;
for (;;) {
  try {
    const res = await api("getUpdates", { offset, timeout: 30, allowed_updates: ["message"] });
    if (!res.ok) {
      console.error("getUpdates:", res.description);
      await sleep(3000);
      continue;
    }
    for (const update of res.result) {
      // Dev server o‘chiq bo‘lsa, fetch xato beradi va offset oshmaydi — Telegram update’ni qayta beradi
      const forwarded = await fetch(target, {
        method: "POST",
        headers: { "content-type": "application/json", "x-telegram-bot-api-secret-token": secret },
        body: JSON.stringify(update),
      });
      console.log(`update ${update.update_id} → HTTP ${forwarded.status}`);
      if (forwarded.status === 403) {
        console.error("Webhook secret mos kelmadi — .env.local’dagi TELEGRAM_WEBHOOK_SECRET’ni tekshiring.");
      }
      offset = update.update_id + 1;
    }
  } catch (error) {
    console.error("Xato:", error.message, "— 3 soniyadan keyin qayta urinamiz");
    await sleep(3000);
  }
}
