import "server-only";
import { count, desc, eq, gte, sql, type SQL } from "drizzle-orm";
import { db } from "../db";
import { aiRequests, articles, users, type AiRequestStatus } from "../db/schema";
import { TZ, countIf, daysStart, sumOf } from "./sql";

const tokens = sql`${aiRequests.inputTokens} + ${aiRequests.outputTokens} + ${aiRequests.cacheReadTokens} + ${aiRequests.cacheWriteTokens}`;
const teacher = sql<string>`${users.firstName} || ' ' || ${users.lastName}`;

/** Bitta oyna (bugun / 7 / 30 kun) uchun ko‘rsatkichlar: hammasi bitta so‘rovda, filter orqali */
function usage(since: SQL) {
  const inside = sql`${aiRequests.createdAt} >= ${since}`;
  const withStatus = (status: AiRequestStatus) => countIf(sql`${inside} and ${aiRequests.status} = ${status}`);
  return {
    requests: countIf(inside),
    ok: withStatus("ok"),
    error: withStatus("error"),
    refusal: withStatus("refusal"),
    truncated: withStatus("truncated"),
    aborted: withStatus("aborted"),
    running: withStatus("running"),
    inputTokens: sumOf(aiRequests.inputTokens, inside),
    outputTokens: sumOf(aiRequests.outputTokens, inside),
    cacheReadTokens: sumOf(aiRequests.cacheReadTokens, inside),
    cacheWriteTokens: sumOf(aiRequests.cacheWriteTokens, inside),
    costMicroUsd: sumOf(aiRequests.costMicroUsd, inside),
  };
}

export async function getAiUsage() {
  const since30 = daysStart(30);
  const [[totals], daily, top, latest] = await Promise.all([
    db
      .select({ today: usage(daysStart(1)), week: usage(daysStart(7)), month: usage(since30) })
      .from(aiRequests)
      .where(gte(aiRequests.createdAt, since30)),
    dailyUsage(),
    db
      .select({
        userId: users.id,
        teacher,
        requests: count(),
        errors: countIf(eq(aiRequests.status, "error")),
        tokens: sumOf(tokens),
        costMicroUsd: sumOf(aiRequests.costMicroUsd),
      })
      .from(aiRequests)
      .innerJoin(users, eq(users.id, aiRequests.userId))
      .where(gte(aiRequests.createdAt, since30))
      .groupBy(users.id)
      .orderBy(desc(count()), desc(sumOf(aiRequests.costMicroUsd)), users.id)
      .limit(10),
    db
      .select({
        id: aiRequests.id,
        createdAt: aiRequests.createdAt,
        status: aiRequests.status,
        model: aiRequests.model,
        withPdf: aiRequests.withPdf,
        inputTokens: aiRequests.inputTokens,
        outputTokens: aiRequests.outputTokens,
        cacheReadTokens: aiRequests.cacheReadTokens,
        cacheWriteTokens: aiRequests.cacheWriteTokens,
        costMicroUsd: aiRequests.costMicroUsd,
        durationMs: aiRequests.durationMs,
        error: aiRequests.error,
        articleId: aiRequests.articleId,
        articleStatus: articles.status,
        teacher,
      })
      .from(aiRequests)
      .innerJoin(users, eq(users.id, aiRequests.userId))
      .leftJoin(articles, eq(articles.id, aiRequests.articleId))
      .orderBy(desc(aiRequests.createdAt), desc(aiRequests.id))
      .limit(50),
  ]);
  return { totals, daily, top, latest };
}

/** So‘nggi 30 kun, bugun bilan: so‘rovsiz kunlar ham 0 bilan qaytadi */
async function dailyUsage() {
  const { rows } = await db.execute<{ day: string; requests: number }>(sql`
    select to_char(d.start, 'YYYY-MM-DD') as day, count(${aiRequests.id})::int as requests
    from generate_series(
      date_trunc('day', now() at time zone ${TZ}) - interval '29 days',
      date_trunc('day', now() at time zone ${TZ}),
      interval '1 day'
    ) as d(start)
    left join ${aiRequests} on ${aiRequests.createdAt} >= d.start at time zone ${TZ}
      and ${aiRequests.createdAt} < (d.start + interval '1 day') at time zone ${TZ}
    group by d.start
    order by d.start
  `);
  return rows;
}
