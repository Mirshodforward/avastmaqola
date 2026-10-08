import "server-only";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { titleIn } from "@/lib/article-rules";
import { AuthError } from "../auth/errors";
import { db } from "../db";
import { articles, users } from "../db/schema";
import { authorTag } from "../profiles/service";
import { ARTICLES_TAG, articleTag } from "./public";
import type { ReviewAction } from "./schemas";

const queueColumns = {
  id: articles.id,
  status: articles.status,
  lang: articles.lang,
  titleUz: articles.titleUz,
  titleRu: articles.titleRu,
  titleEn: articles.titleEn,
  submittedAt: articles.submittedAt,
  reviewedAt: articles.reviewedAt,
  author: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
};

/** Ko‘rib chiqish navbati: eng eskisi birinchi (adolatli tartib) */
export async function listReviewQueue() {
  const rows = await db
    .select(queueColumns)
    .from(articles)
    .innerJoin(users, eq(users.id, articles.userId))
    .where(eq(articles.status, "submitted"))
    .orderBy(asc(articles.submittedAt));
  return rows.map((r) => ({ ...r, title: titleIn(r) }));
}

export async function listRecentlyReviewed(limit = 20) {
  const rows = await db
    .select(queueColumns)
    .from(articles)
    .innerJoin(users, eq(users.id, articles.userId))
    .where(inArray(articles.status, ["published", "rejected"]))
    .orderBy(desc(articles.reviewedAt))
    .limit(limit);
  return rows.map((r) => ({ ...r, title: titleIn(r) }));
}

/**
 * Admin qarori. Holat compare-and-set bilan o‘zgaradi: ikki admin bir vaqtda bossa, ikkinchisi 409 oladi.
 * unpublish — chop etilgan maqolani izoh bilan o‘qituvchiga qaytarish (sahifa darhol yopiladi).
 */
export async function reviewArticle(id: number, action: ReviewAction, note: string, submittedAt?: string) {
  if (action !== "approve" && note.length < 10) throw new AuthError("note_required");
  // Postgres mikrosekund saqlaydi, JS Date esa millisekund — taqqoslash millisekundgacha
  const sameVersion =
    action !== "unpublish" && submittedAt
      ? sql`date_trunc('milliseconds', ${articles.submittedAt}) = ${submittedAt}::timestamptz`
      : undefined;

  const [row] = await db
    .update(articles)
    .set(
      action === "approve"
        ? { status: "published", publishedAt: sql`coalesce(${articles.publishedAt}, now())`, reviewedAt: sql`now()`, reviewNote: null }
        : { status: "rejected", reviewNote: note, reviewedAt: sql`now()` },
    )
    .where(and(eq(articles.id, id), eq(articles.status, action === "unpublish" ? "published" : "submitted"), sameVersion))
    .returning({
      userId: articles.userId,
      lang: articles.lang,
      titleUz: articles.titleUz,
      titleRu: articles.titleRu,
      titleEn: articles.titleEn,
    });
  if (!row) {
    const [exists] = await db.select({ id: articles.id }).from(articles).where(eq(articles.id, id)).limit(1);
    throw new AuthError(exists ? "state_conflict" : "not_found");
  }

  // Chop etish ham, olib tashlash ham darhol ko‘rinishi kerak
  for (const tag of [articleTag(id), ARTICLES_TAG, authorTag(row.userId)]) revalidateTag(tag, { expire: 0 });
  return { userId: row.userId, title: titleIn(row) };
}
