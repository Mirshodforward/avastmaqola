import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { cacheTag } from "next/cache";
import { titleIn } from "@/lib/article-rules";
import { venueLine } from "@/lib/citation";
import { yearOf } from "@/lib/format";
import { db } from "../db";
import { articleAuthors, articles, profiles } from "../db/schema";
import { authorTag } from "../profiles/service";
import { loadArticleView } from "./view";

export const ARTICLES_TAG = "articles";
export const articleTag = (id: number) => `article:${id}`;
/** generateStaticParams uchun: haqiqiy maqola raqamlari 1 dan boshlanadi */
export const PLACEHOLDER_ARTICLE_ID = "0";

/** Ommaviy maqola. Admin chop etganda yoki muallif profili o‘zgarganda teglar orqali yangilanadi. */
export async function getPublishedArticle(id: number) {
  "use cache";
  cacheTag(articleTag(id));
  const view = await loadArticleView(id, true);
  if (view) cacheTag(authorTag(view.ownerId));
  return view;
}

const byline = sql<string>`(select string_agg(${articleAuthors.givenName} || ' ' || ${articleAuthors.familyName}, ', ' order by ${articleAuthors.position}) from ${articleAuthors} where ${articleAuthors.articleId} = ${articles.id})`;

const listColumns = {
  id: articles.id,
  lang: articles.lang,
  titleUz: articles.titleUz,
  titleRu: articles.titleRu,
  titleEn: articles.titleEn,
  publishedAt: articles.publishedAt,
  venue: articles.venue,
  volume: articles.volume,
  issue: articles.issue,
  pages: articles.pages,
  pubYear: articles.pubYear,
  issueNo: articles.issueNo,
  issueSeq: articles.issueSeq,
  byline,
};

type ListRow = Parameters<typeof titleIn>[0] &
  Parameters<typeof venueLine>[0] & {
    id: number;
    publishedAt: Date | null;
    pubYear: number | null;
    issueNo: number;
    issueSeq: number | null;
    byline: string;
  };
const toItem = (r: ListRow) => ({
  id: r.id,
  title: titleIn(r),
  byline: r.byline,
  publishedAt: r.publishedAt,
  // Portaldagi joyi: "3-son, 12-maqola" (maqola raqami moderator belgilagunicha bo‘lmasligi mumkin)
  issueNo: r.issueNo,
  issueSeq: r.issueSeq,
  venue: venueLine(r),
  // Asl nashr yili, bo‘lmasa saytda chop etilgan yil (chop etilgan maqolada sana doim bor — DB CHECK)
  year: r.pubYear ?? yearOf(r.publishedAt!),
});

/** limit berilmasa — hammasi (/maqolalar Scholar uchun barcha maqolalarga yo‘l ochishi kerak) */
export async function listPublishedArticles(limit?: number) {
  "use cache";
  cacheTag(ARTICLES_TAG);
  const query = db
    .select(listColumns)
    .from(articles)
    .where(eq(articles.status, "published"))
    .orderBy(desc(articles.publishedAt), desc(articles.id))
    .$dynamic();
  const rows = await (limit ? query.limit(limit) : query);
  return rows.map(toItem);
}

export async function listPublishedByAuthor(userId: string) {
  "use cache";
  cacheTag(authorTag(userId), ARTICLES_TAG);
  const rows = await db
    .select(listColumns)
    .from(articles)
    .where(and(eq(articles.userId, userId), eq(articles.status, "published")))
    .orderBy(desc(articles.publishedAt));
  // Profilda Scholar’dagidek yil ustuni bor: eski nashr yuqorida turib qolmasin (bir yil ichida — saytdagi tartib)
  return rows.map(toItem).sort((a, b) => b.year - a.year);
}

/** PDF so‘rovi uchun (keshsiz): kimga ko‘rsatish mumkinligini route hal qiladi */
export async function findArticlePdf(id: number) {
  const [row] = await db
    .select({ status: articles.status, userId: articles.userId, pdfKey: articles.pdfKey })
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1);
  return row ?? null;
}

/** Sitemap: chop etilgan maqolalar va kamida bitta maqolasi bor ochiq profillar (bo‘sh sahifalarsiz) */
export async function sitemapEntries() {
  const [published, teachers] = await Promise.all([
    db.select({ id: articles.id, updatedAt: articles.updatedAt }).from(articles).where(eq(articles.status, "published")),
    db
      .select({
        slug: profiles.slug,
        // Yangi maqola chiqsa ham profil sahifasi o‘zgaradi (maqolalar ro‘yxati, noindex olib tashlanadi)
        updatedAt: sql<Date>`greatest(${profiles.updatedAt}, max(${articles.updatedAt}))`.mapWith(profiles.updatedAt),
      })
      .from(profiles)
      .innerJoin(articles, and(eq(articles.userId, profiles.userId), eq(articles.status, "published")))
      .where(eq(profiles.isPublic, true))
      .groupBy(profiles.slug, profiles.updatedAt),
  ]);
  return { published, teachers };
}
