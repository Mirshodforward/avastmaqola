import "server-only";
import { randomBytes } from "node:crypto";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { cacheTag, revalidateTag } from "next/cache";
import sharp from "sharp";
import { AuthError } from "../auth/errors";
import { db } from "../db";
import { news } from "../db/schema";
import { MAX_PHOTO_BYTES } from "../profiles/photo";
import { deleteFile, saveFile } from "../storage";
import type { NewsInput } from "./schemas";

export const NEWS_TAG = "news";
const newsTag = (id: number) => `news:${id}`;
/** generateStaticParams uchun: haqiqiy raqamlar 1 dan boshlanadi */
export const PLACEHOLDER_NEWS_ID = "0";

const imageFile = (key: string) => `${key}.webp`;

function invalidate(id: number) {
  // Route handler’dan chaqiriladi, shuning uchun updateTag emas: ro‘yxat va yangilik sahifasi darhol eskiradi
  revalidateTag(NEWS_TAG, { expire: 0 });
  revalidateTag(newsTag(id), { expire: 0 });
}

/** Eski rasmni o‘chirish baza va kesh yangilangandan keyin: xato bo‘lsa faqat yetim fayl qoladi, sahifa buzilmaydi */
function dropImage(key: string) {
  return deleteFile("news", imageFile(key)).catch((error) => console.error("[news] rasmni o‘chirib bo‘lmadi:", error));
}

/** Saytdagi ro‘yxat: faqat chop etilganlar, yangisi birinchi. Matn to‘liq emas — qisqa parcha uchun boshi */
export async function listPublishedNews() {
  "use cache";
  cacheTag(NEWS_TAG);
  return db
    .select({
      id: news.id,
      title: news.title,
      excerpt: sql<string>`left(${news.body}, 400)`,
      imageKey: news.imageKey,
      publishedAt: news.publishedAt,
    })
    .from(news)
    .where(isNotNull(news.publishedAt))
    .orderBy(desc(news.publishedAt), desc(news.id));
}

export async function getPublishedNews(id: number) {
  "use cache";
  cacheTag(newsTag(id));
  const [row] = await db
    .select()
    .from(news)
    .where(and(eq(news.id, id), isNotNull(news.publishedAt)))
    .limit(1);
  return row ?? null;
}

/** Sitemap uchun (keshsiz) */
export function publishedNewsEntries() {
  return db.select({ id: news.id, updatedAt: news.updatedAt }).from(news).where(isNotNull(news.publishedAt));
}

/** Admin ro‘yxati (keshsiz): qoralamalar ham */
export function listAllNews() {
  return db
    .select({ id: news.id, title: news.title, publishedAt: news.publishedAt, updatedAt: news.updatedAt })
    .from(news)
    .orderBy(desc(news.createdAt));
}

export async function getNews(id: number) {
  const [row] = await db.select().from(news).where(eq(news.id, id)).limit(1);
  return row ?? null;
}

/** Bo‘sh qoralama: tugma bosilganda yaratiladi, saqlash uchun darhol manzil bo‘ladi */
export async function createNews(): Promise<number> {
  const [row] = await db.insert(news).values({}).returning({ id: news.id });
  return row.id;
}

export async function updateNews(id: number, { title, body, published }: NewsInput) {
  const [row] = await db
    .update(news)
    // Qayta saqlashda chop etilgan sana o‘zgarmaydi; saytdan olinganda qoralamaga qaytadi
    .set({ title, body, publishedAt: published ? sql`coalesce(${news.publishedAt}, now())` : null })
    .where(eq(news.id, id))
    .returning({ publishedAt: news.publishedAt });
  if (!row) throw new AuthError("not_found");
  invalidate(id);
  return row;
}

export async function deleteNews(id: number) {
  const [row] = await db.delete(news).where(eq(news.id, id)).returning({ imageKey: news.imageKey });
  if (!row) throw new AuthError("not_found");
  invalidate(id);
  if (row.imageKey) await dropImage(row.imageKey);
}

/** Muqova: har qanday JPEG/PNG/WebP → 1200×675 WebP. sharp EXIF va GPS’ni olib tashlaydi, burilishni avval qo‘llaydi */
async function processCover(input: Buffer): Promise<Buffer> {
  const format = await sharp(input)
    .metadata()
    .then((m) => m.format)
    .catch(() => undefined);
  if (format !== "jpeg" && format !== "png" && format !== "webp") throw new AuthError("photo_invalid");
  return sharp(input, { limitInputPixels: 50_000_000 })
    .rotate()
    .resize(1200, 675, { fit: "cover", position: sharp.strategy.attention })
    .webp({ quality: 82 })
    .toBuffer();
}

export async function setNewsImage(id: number, file: File) {
  if (file.size > MAX_PHOTO_BYTES) throw new AuthError("photo_too_large");
  const current = await getNews(id);
  if (!current) throw new AuthError("not_found");

  const image = await processCover(Buffer.from(await file.arrayBuffer()));
  // Har yuklashda yangi kalit: eski URL brauzer keshida qolsa ham yangi rasm darhol ko‘rinadi
  const key = `${id}-${randomBytes(6).toString("hex")}`;
  await saveFile("news", imageFile(key), image);
  const [updated] = await db.update(news).set({ imageKey: key }).where(eq(news.id, id)).returning({ id: news.id });
  // Yuklash davomida yangilik o‘chirilgan bo‘lsa: yangi fayl yetim qolmasin
  if (!updated) {
    await dropImage(key);
    throw new AuthError("not_found");
  }
  invalidate(id);
  if (current.imageKey) await dropImage(current.imageKey);
  return key;
}

export async function removeNewsImage(id: number) {
  const current = await getNews(id);
  if (!current) throw new AuthError("not_found");
  if (!current.imageKey) return;
  await db.update(news).set({ imageKey: null }).where(eq(news.id, id));
  invalidate(id);
  await dropImage(current.imageKey);
}
