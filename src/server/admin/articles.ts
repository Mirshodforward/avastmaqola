import "server-only";
import { and, count, eq, ilike, ne, or, sql } from "drizzle-orm";
import { ARTICLE_STATUSES, titleIn, type ArticleStatus } from "@/lib/article-rules";
import { db } from "../db";
import { articles, users } from "../db/schema";
import { PAGE_SIZE, paginate, pageParam, textParam, type SearchParams } from "./params";
import { countIf, likePattern } from "./sql";

/** Qoralama faqat muallifniki: admin ro‘yxatida sarlavhasi ko‘rinmaydi, faqat soni */
export const LISTED_STATUSES = ARTICLE_STATUSES.filter(
  (s): s is Exclude<ArticleStatus, "draft"> => s !== "draft",
);

export function parseArticleFilters(params: SearchParams) {
  const value = textParam(params, "status");
  const status = LISTED_STATUSES.find((s) => s === value) ?? null;
  return { status, q: textParam(params, "q"), page: pageParam(params) };
}

export type ArticleFilters = ReturnType<typeof parseArticleFilters>;

const author = sql<string>`${users.firstName} || ' ' || ${users.lastName}`;

export async function listArticles({ status, q, page }: ArticleFilters) {
  const pattern = likePattern(q);
  // "№286" yoki "286" — maqola raqami bo‘yicha ham topiladi
  const id = /^№?\s*(\d{1,9})$/.exec(q)?.[1];
  const where = and(
    status ? eq(articles.status, status) : ne(articles.status, "draft"),
    q
      ? or(
          ilike(articles.titleUz, pattern),
          ilike(articles.titleRu, pattern),
          ilike(articles.titleEn, pattern),
          sql`${author} ilike ${pattern}`,
          sql`(${users.lastName} || ' ' || ${users.firstName}) ilike ${pattern}`,
          id ? eq(articles.id, Number(id)) : undefined,
        )
      : undefined,
  );

  const [[{ total }], [counts]] = await Promise.all([
    db.select({ total: count() }).from(articles).innerJoin(users, eq(users.id, articles.userId)).where(where),
    db
      .select({
        draft: countIf(eq(articles.status, "draft")),
        submitted: countIf(eq(articles.status, "submitted")),
        published: countIf(eq(articles.status, "published")),
        rejected: countIf(eq(articles.status, "rejected")),
      })
      .from(articles),
  ]);
  const pager = paginate(total, page);

  const rows = await db
    .select({
      id: articles.id,
      status: articles.status,
      lang: articles.lang,
      titleUz: articles.titleUz,
      titleRu: articles.titleRu,
      titleEn: articles.titleEn,
      author,
      submittedAt: articles.submittedAt,
      publishedAt: articles.publishedAt,
    })
    .from(articles)
    .innerJoin(users, eq(users.id, articles.userId))
    .where(where)
    .orderBy(sql`${articles.submittedAt} desc nulls last`, sql`${articles.id} desc`)
    .limit(PAGE_SIZE)
    .offset(pager.offset);

  return { items: rows.map((r) => ({ ...r, title: titleIn(r) })), total, counts, page: pager.page, pages: pager.pages };
}
