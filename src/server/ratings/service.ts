import "server-only";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { cacheTag, revalidateTag } from "next/cache";
import { titleIn } from "@/lib/article-rules";
import type { RatingStatus } from "@/lib/rating-rules";
import { AuthError } from "../auth/errors";
import { db } from "../db";
import { articleAuthors, articleRatings, articles, profiles, users } from "../db/schema";
import { authorTag } from "../profiles/service";
import type { RatingAction, RatingInput } from "./schemas";

export const ratingsTag = (articleId: number) => `ratings:${articleId}`;

export type RatingItem = {
  id: number;
  stars: number;
  body: string;
  name: string;
  /** Profil ochiq bo‘lsa — /oqituvchi/{slug} havolasi uchun */
  slug: string | null;
  date: Date;
};

export type ArticleRatings = {
  count: number;
  /** Baho bo‘lmasa 0 */
  avg: number;
  /** dist[0] — 1 yulduzli baholar soni, dist[4] — 5 yulduzlilar */
  dist: number[];
  items: RatingItem[];
};

/** Maqola sahifasi: faqat tasdiqlangan baholar, eng yangisi birinchi. Admin qarori yoki baholovchi profili o‘zgarsa yangilanadi */
export async function getArticleRatings(articleId: number): Promise<ArticleRatings> {
  "use cache";
  cacheTag(ratingsTag(articleId));
  const rows = await db
    .select({
      id: articleRatings.id,
      userId: articleRatings.userId,
      stars: articleRatings.stars,
      body: articleRatings.body,
      date: articleRatings.updatedAt,
      firstName: users.firstName,
      lastName: users.lastName,
      slug: profiles.slug,
      isPublic: profiles.isPublic,
    })
    .from(articleRatings)
    .innerJoin(users, eq(users.id, articleRatings.userId))
    .leftJoin(profiles, eq(profiles.userId, articleRatings.userId))
    .where(and(eq(articleRatings.articleId, articleId), eq(articleRatings.status, "approved")))
    .orderBy(desc(articleRatings.updatedAt), desc(articleRatings.id));

  // Baholovchi ismini o‘zgartirsa yoki profilini yopsa, bu sahifa ham yangilansin (bitta chaqiruvda ko‘pi bilan 128 teg)
  const reviewers = [...new Set(rows.map((r) => authorTag(r.userId)))].slice(0, 128);
  if (reviewers.length) cacheTag(...reviewers);

  const dist = [0, 0, 0, 0, 0];
  for (const r of rows) dist[r.stars - 1]++;
  return {
    count: rows.length,
    avg: rows.length ? rows.reduce((sum, r) => sum + r.stars, 0) / rows.length : 0,
    dist,
    items: rows.map((r) => ({
      id: r.id,
      stars: r.stars,
      body: r.body,
      name: `${r.firstName} ${r.lastName}`,
      slug: r.isPublic ? r.slug : null,
      date: r.date,
    })),
  };
}

export type MyRating = {
  /** Muallif o‘z maqolasini baholay olmaydi */
  isAuthor: boolean;
  rating: { stars: number; body: string; status: RatingStatus } | null;
};

/** Forma holati: foydalanuvchining shu maqoladagi bahosi. Maqola chop etilmagan bo‘lsa — 404 */
export async function getMyRating(articleId: number, userId: string): Promise<MyRating> {
  const [row] = await db
    .select({
      isAuthor: sql<boolean>`${articles.userId} = ${userId} or exists (select 1 from ${articleAuthors} where ${articleAuthors.articleId} = ${articles.id} and ${articleAuthors.userId} = ${userId})`,
      stars: articleRatings.stars,
      body: articleRatings.body,
      status: articleRatings.status,
    })
    .from(articles)
    .leftJoin(articleRatings, and(eq(articleRatings.articleId, articles.id), eq(articleRatings.userId, userId)))
    .where(and(eq(articles.id, articleId), eq(articles.status, "published")))
    .limit(1);
  if (!row) throw new AuthError("not_found");
  return {
    isAuthor: row.isAuthor,
    rating: row.stars !== null && row.body !== null && row.status !== null ? { stars: row.stars, body: row.body, status: row.status } : null,
  };
}

/**
 * Baho yangisi yoziladi yoki eskisi tahrirlanadi — ikkala holda ham yana moderatsiyaga tushadi.
 * wasPublic: chop etilgan baho o‘zgardi — sahifadan tushishi uchun kesh yangilanadi (faqat shunda: aks holda
 * har bir so‘rov birovning maqola sahifasini qayta yaratishga majburlardi).
 */
export async function saveMyRating(articleId: number, userId: string, input: RatingInput) {
  const { isAuthor } = await getMyRating(articleId, userId);
  if (isAuthor) throw new AuthError("forbidden");

  const result = await db.transaction(async (tx) => {
    // Qator qulflanadi: admin shu payt qaror qilsa, u bizdan keyin ishlaydi va eski versiya bilan 409 oladi
    const [old] = await tx
      .select({ stars: articleRatings.stars, body: articleRatings.body, status: articleRatings.status })
      .from(articleRatings)
      .where(and(eq(articleRatings.articleId, articleId), eq(articleRatings.userId, userId)))
      .for("update");
    // O‘zgarmagan matnni qayta yuborish chop etilgan iqtibosni saytdan tushirmasin
    if (old && old.stars === input.stars && old.body === input.body) return { rating: old, changed: false, wasPublic: false };

    await tx
      .insert(articleRatings)
      .values({ articleId, userId, stars: input.stars, body: input.body })
      .onConflictDoUpdate({
        target: [articleRatings.articleId, articleRatings.userId],
        set: { stars: input.stars, body: input.body, status: "pending", reviewedAt: null, updatedAt: sql`now()` },
      });
    return { rating: { ...input, status: "pending" as RatingStatus }, changed: true, wasPublic: old?.status === "approved" };
  });

  if (result.wasPublic) revalidateTag(ratingsTag(articleId), { expire: 0 });
  return result;
}

const moderationColumns = {
  id: articleRatings.id,
  articleId: articleRatings.articleId,
  status: articleRatings.status,
  stars: articleRatings.stars,
  body: articleRatings.body,
  updatedAt: articleRatings.updatedAt,
  reviewedAt: articleRatings.reviewedAt,
  name: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
  lang: articles.lang,
  titleUz: articles.titleUz,
  titleRu: articles.titleRu,
  titleEn: articles.titleEn,
};

function moderationQuery() {
  return db
    .select(moderationColumns)
    .from(articleRatings)
    .innerJoin(users, eq(users.id, articleRatings.userId))
    .innerJoin(articles, eq(articles.id, articleRatings.articleId))
    .$dynamic();
}

type ModerationRow = Awaited<ReturnType<typeof moderationQuery>>[number];
const withTitle = (rows: ModerationRow[]) => rows.map((r) => ({ ...r, title: titleIn(r) }));

/** Moderatsiya navbati: eng eskisi birinchi */
export async function listPendingRatings() {
  return withTitle(await moderationQuery().where(eq(articleRatings.status, "pending")).orderBy(asc(articleRatings.updatedAt)));
}

export async function listRecentRatingDecisions(limit = 20) {
  return withTitle(
    await moderationQuery()
      .where(inArray(articleRatings.status, ["approved", "rejected"]))
      .orderBy(desc(articleRatings.reviewedAt))
      .limit(limit),
  );
}

/**
 * Admin qarori: chop etish yoki rad etish (chop etilganini olib tashlash ham). Muallif shu orada tahrirlagan bo‘lsa — 409.
 * Qaytaradi: maqola raqami (sahifani yangilash uchun).
 */
export async function decideRating(id: number, action: RatingAction, updatedAt: string) {
  const [row] = await db
    .update(articleRatings)
    .set({
      status: action === "approve" ? "approved" : "rejected",
      reviewedAt: sql`now()`,
      // Kartadagi sana — muallif yozgan vaqt: admin qarori uni o‘zgartirmasin ($onUpdate o‘rniga eski qiymat)
      updatedAt: sql`${articleRatings.updatedAt}`,
    })
    // Postgres mikrosekund saqlaydi, JS Date esa millisekund — taqqoslash millisekundgacha
    .where(and(eq(articleRatings.id, id), sql`date_trunc('milliseconds', ${articleRatings.updatedAt}) = ${updatedAt}::timestamptz`))
    .returning({ articleId: articleRatings.articleId });
  if (!row) {
    const [exists] = await db.select({ id: articleRatings.id }).from(articleRatings).where(eq(articleRatings.id, id)).limit(1);
    throw new AuthError(exists ? "state_conflict" : "not_found");
  }
  revalidateTag(ratingsTag(row.articleId), { expire: 0 });
  return row.articleId;
}
