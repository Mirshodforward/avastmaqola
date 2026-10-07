import { safeEqualString } from "@/server/auth/crypto";
import { handleUpdate } from "@/server/telegram/bot";
import type { TgUpdate } from "@/server/telegram/types";

export async function POST(request: Request) {
  // setWebhook’da berilgan secret_token’ni Telegram har so‘rovda shu sarlavhada yuboradi
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  const received = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
  if (!expected || !safeEqualString(received, expected)) {
    return new Response("Forbidden", { status: 403 });
  }

  let update: TgUpdate;
  try {
    update = (await request.json()) as TgUpdate;
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  try {
    await handleUpdate(update);
  } catch (error) {
    // Har doim 200 qaytaramiz: aks holda Telegram shu update’ni qayta-qayta yuboraveradi
    console.error("[telegram] update qayta ishlanmadi:", update.update_id, error);
  }
  return Response.json({ ok: true });
}
