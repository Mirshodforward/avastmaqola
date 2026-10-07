// Production uchun: Telegram’ga update’larni APP_URL/api/telegram/webhook manziliga yuborishni aytadi.
// Ishga tushirish: npm run bot:webhook  (APP_URL https bo‘lishi shart)
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());

const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_WEBHOOK_SECRET: secret, APP_URL: appUrl } = process.env;
if (!token || !secret || !appUrl?.startsWith("https://")) {
  console.error("TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET va https bilan boshlanuvchi APP_URL kerak.");
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

const url = new URL("/api/telegram/webhook", appUrl).toString();
const result = await api("setWebhook", {
  url,
  secret_token: secret,
  allowed_updates: ["message"],
  drop_pending_updates: true,
});
console.log("setWebhook:", result.ok ? "OK" : result.description);
console.log(await api("getWebhookInfo"));
