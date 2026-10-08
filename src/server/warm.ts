import "server-only";
import { and, eq } from "drizzle-orm";
import { articleUrl } from "./articles/seo";
import { db } from "./db";
import { articles, profiles } from "./db/schema";
import { profileUrl } from "./profiles/json-ld";

/**
 * Muallifga tegishli ommaviy sahifalarni (profil va chop etilgan maqolalari) darhol qayta yaratadi.
 * Kesh teglari jarayon xotirasida, ISR nusxalari esa diskda: server qayta ishga tushsa, o‘zgarishdan oldingi
 * nusxa (masalan, yopilgan profilning rasmi yoki olib tashlangan maqola) yana berilib qolmasligi uchun.
 */
export async function warmAuthorPages(userId: string, extra: string[] = []) {
  const [[profile], published] = await Promise.all([
    db.select({ slug: profiles.slug }).from(profiles).where(eq(profiles.userId, userId)).limit(1),
    db.select({ id: articles.id }).from(articles).where(and(eq(articles.userId, userId), eq(articles.status, "published"))),
  ]);
  const urls = new Set([...extra, ...(profile ? [profileUrl(profile.slug)] : []), ...published.map((a) => articleUrl(a.id))]);
  // Ketma-ket: ko‘p maqolali muallifda serverga bir zumda yuk tushmasin
  for (const url of urls) await fetch(url).catch(() => undefined);
}
