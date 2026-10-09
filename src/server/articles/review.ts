import "server-only";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { titleIn } from "@/lib/article-rules";
import { AuthError } from "../auth/errors";
import { db } from "../db";
import { articles, users } from "../db/schema";
import { authorTag } from "../profiles/service";
import { placeTakenError, type IssuePlace } from "./issue";
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
  issueNo: articles.issueNo,
  issueSeq: articles.issueSeq,
  author: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
};

const changed = {
  userId: articles.userId,
  lang: articles.lang,
  titleUz: articles.titleUz,
  titleRu: articles.titleRu,
  titleEn: articles.titleEn,
  issueNo: articles.issueNo,
  issueSeq: articles.issueSeq,
};

/** O‘zgarmagan maqola: umuman yo‘q — 404, holati boshqa — 409 */
async function notChanged(id: number) {
  const [exists] = await db.select({ id: articles.id }).from(articles).where(eq(articles.id, id)).limit(1);
  return new AuthError(exists ? "state_conflict" : "not_found");
}

/** Chop etish, olib tashlash va joy o‘zgarishi saytda darhol ko‘rinishi kerak */
function refresh(id: number, userId: string) {
  for (const tag of [articleTag(id), ARTICLES_TAG, authorTag(userId)]) revalidateTag(tag, { expire: 0 });
}

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
 * Moderator yoki admin qarori. Holat compare-and-set bilan o‘zgaradi: ikkisi bir vaqtda bossa, ikkinchisi 409 oladi.
 * approve — ko‘rib chiquvchi tasdiqlagan joy (son, raqam) bilan; joy band bo‘lsa unique index rad etadi.
 * unpublish — chop etilgan maqolani izoh bilan o‘qituvchiga qaytarish (sahifa darhol yopiladi).
 */
export async function reviewArticle(id: number, action: ReviewAction, note: string, submittedAt?: string, place?: IssuePlace) {
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
        ? { status: "published", ...place, publishedAt: sql`coalesce(${articles.publishedAt}, now())`, reviewedAt: sql`now()`, reviewNote: null }
        : { status: "rejected", reviewNote: note, reviewedAt: sql`now()` },
    )
    .where(and(eq(articles.id, id), eq(articles.status, action === "unpublish" ? "published" : "submitted"), sameVersion))
    .returning(changed)
    .catch(async (error: unknown) => {
      throw place ? await placeTakenError(error, place) : error;
    });
  if (!row) throw await notChanged(id);

  refresh(id, row.userId);
  return { userId: row.userId, title: titleIn(row), issueNo: row.issueNo, issueSeq: row.issueSeq };
}

/** Chop etilgan maqolani boshqa songa yoki raqamga ko‘chirish (moderator, admin). URL /maqola/{id} o‘zgarmaydi */
export async function moveArticle(id: number, place: IssuePlace) {
  const [row] = await db
    .update(articles)
    .set(place)
    .where(and(eq(articles.id, id), eq(articles.status, "published")))
    .returning(changed)
    .catch(async (error: unknown) => {
      throw await placeTakenError(error, place);
    });
  if (!row) throw await notChanged(id);

  refresh(id, row.userId);
  return { userId: row.userId, title: titleIn(row) };
}
