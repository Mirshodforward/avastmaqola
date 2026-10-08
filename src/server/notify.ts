import "server-only";
import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "./db";
import { users } from "./db/schema";
import { sendMessage } from "./telegram/api";

// Telegram xabarnomalari "eng yaxshi urinish": xato faqat logga yoziladi, asosiy amalni to‘xtatmaydi.
// Oddiy matn (parse_mode yo‘q), shuning uchun sarlavhadagi <, > va & belgilari xavfsiz.

export async function notifyUser(userId: string, text: string) {
  const [user] = await db.select({ chat: users.telegramUserId }).from(users).where(eq(users.id, userId)).limit(1);
  if (user?.chat) await sendMessage(user.chat, text).catch((e) => console.error("[notify] o‘qituvchi:", e));
}

export async function notifyAdmins(text: string) {
  const admins = await db
    .select({ chat: users.telegramUserId })
    .from(users)
    .where(and(eq(users.role, "admin"), isNotNull(users.telegramUserId)));
  await Promise.all(
    admins.map((a) => sendMessage(a.chat!, text).catch((e) => console.error("[notify] admin:", e))),
  );
}
