import "server-only";
import { asc, count, eq, gt, gte, sql, type AnyColumn } from "drizzle-orm";
import { titleIn } from "@/lib/article-rules";
import { db } from "../db";
import { aiRequests, articles, authRequests, profiles, sessions, users } from "../db/schema";
import { TZ, countIf, daysStart, monthStart, sumOf } from "./sql";

const author = sql<string>`${users.firstName} || ' ' || ${users.lastName}`;
const waitedHours = (since: AnyColumn) => sql<number>`floor(extract(epoch from now() - ${since}) / 3600)::int`;

/** Admin panel bosh sahifasi: barcha ko‘rsatkichlar bitta so‘rovlar to‘plamida */
export async function getOverview() {
  const since30 = daysStart(30);
  const [[people], [profileStats], [articleStats], [sessionStats], [auth], [ai], months, queue] = await Promise.all([
    db
      .select({
        total: count(),
        admins: countIf(eq(users.role, "admin")),
        new30: countIf(gte(users.createdAt, since30)),
      })
      .from(users),
    db.select({ filled: count(), open: countIf(eq(profiles.isPublic, true)) }).from(profiles),
    db
      .select({
        draft: countIf(eq(articles.status, "draft")),
        submitted: countIf(eq(articles.status, "submitted")),
        published: countIf(eq(articles.status, "published")),
        rejected: countIf(eq(articles.status, "rejected")),
        // published_at — birinchi chop etilgan sana: keyin olib tashlangan maqola ham o‘z oyida qoladi
        publishedThisMonth: countIf(gte(articles.publishedAt, monthStart)),
        oldestWaitHours: sql<number | null>`floor(extract(epoch from now() - min(${articles.submittedAt}) filter (where ${articles.status} = 'submitted')) / 3600)::int`,
      })
      .from(articles),
    db
      .select({ active: count(), people: sql<number>`count(distinct ${sessions.userId})::int` })
      .from(sessions)
      .where(gt(sessions.expiresAt, sql`now()`)),
    db
      .select({
        total: count(),
        verified: countIf(eq(authRequests.status, "verified")),
        failed: countIf(eq(authRequests.status, "failed")),
        // Kod kiritilmay qolgan jarayon: muddati o‘tgan, lekin tasdiqlanmagan
        abandoned: countIf(sql`${authRequests.status} not in ('verified', 'failed') and ${authRequests.expiresAt} <= now()`),
      })
      .from(authRequests)
      .where(gte(authRequests.createdAt, daysStart(7))),
    db
      .select({
        today: countIf(gte(aiRequests.createdAt, daysStart(1))),
        month: count(),
        errors: countIf(eq(aiRequests.status, "error")),
        tokens: sumOf(
          sql`${aiRequests.inputTokens} + ${aiRequests.outputTokens} + ${aiRequests.cacheReadTokens} + ${aiRequests.cacheWriteTokens}`,
        ),
        costMicroUsd: sumOf(aiRequests.costMicroUsd),
      })
      .from(aiRequests)
      .where(gte(aiRequests.createdAt, since30)),
    monthlyActivity(),
    db
      .select({
        id: articles.id,
        lang: articles.lang,
        titleUz: articles.titleUz,
        titleRu: articles.titleRu,
        titleEn: articles.titleEn,
        author,
        waitedHours: waitedHours(articles.submittedAt),
      })
      .from(articles)
      .innerJoin(users, eq(users.id, articles.userId))
      .where(eq(articles.status, "submitted"))
      .orderBy(asc(articles.submittedAt))
      .limit(5),
  ]);

  return {
    people,
    profiles: profileStats,
    articles: articleStats,
    sessions: sessionStats,
    auth,
    ai,
    months,
    queue: queue.map((r) => ({ id: r.id, title: titleIn(r), author: r.author, waitedHours: r.waitedHours })),
  };
}

/**
 * So‘nggi 12 oy (joriy oy bilan): yuborilgan va chop etilgan maqolalar, yangi foydalanuvchilar.
 * generate_series bo‘sh oylarni ham beradi — grafikda bo‘shliq qolmaydi.
 * submitted_at qayta yuborilganda yangilanadi, shuning uchun maqola oxirgi yuborilgan oyida sanaladi.
 */
async function monthlyActivity() {
  const inMonth = (column: AnyColumn) =>
    sql`${column} >= m.start at time zone ${TZ} and ${column} < (m.start + interval '1 month') at time zone ${TZ}`;
  const { rows } = await db.execute<{ month: string; submitted: number; published: number; users: number }>(sql`
    select to_char(m.start, 'YYYY-MM') as month,
      (select count(*) from ${articles} where ${inMonth(articles.submittedAt)})::int as submitted,
      (select count(*) from ${articles} where ${inMonth(articles.publishedAt)})::int as published,
      (select count(*) from ${users} where ${inMonth(users.createdAt)})::int as users
    from generate_series(
      date_trunc('month', now() at time zone ${TZ}) - interval '11 months',
      date_trunc('month', now() at time zone ${TZ}),
      interval '1 month'
    ) as m(start)
    order by m.start
  `);
  return rows;
}
