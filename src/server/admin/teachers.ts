import "server-only";
import { count, desc, eq, or, sql, type SQL } from "drizzle-orm";
import type { ArticleStatus } from "@/lib/article-rules";
import { db } from "../db";
import { aiRequests, articles, authRequests, profiles, sessions, users } from "../db/schema";
import { PAGE_SIZE, paginate, pageParam, textParam, type SearchParams } from "./params";
import { daysStart, likePattern } from "./sql";

export function parseTeacherFilters(params: SearchParams) {
  return { q: textParam(params, "q"), page: pageParam(params) };
}

export type TeacherFilters = ReturnType<typeof parseTeacherFilters>;

const articleCount = (status: ArticleStatus) =>
  sql<number>`(select count(*) from ${articles} where ${articles.userId} = ${users.id} and ${articles.status} = ${status})::int`;

/** Barcha ro‘yxatdan o‘tganlar (adminlar ham), yangilari birinchi */
export async function listTeachers({ q, page }: TeacherFilters) {
  const pattern = likePattern(q);
  const digits = q.replace(/\D/g, "");
  const where = q
    ? or(
        sql`(${users.firstName} || ' ' || ${users.lastName}) ilike ${pattern}`,
        sql`(${users.lastName} || ' ' || ${users.firstName}) ilike ${pattern}`,
        // "+998 90 123-45-67" kabi yozilgan raqam ham topilsin
        digits.length >= 3 ? sql`${users.phone} like ${`%${digits}%`}` : undefined,
      )
    : undefined;

  const [{ total }] = await db.select({ total: count() }).from(users).where(where);
  const pager = paginate(total, page);

  const rows = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
      role: users.role,
      createdAt: users.createdAt,
      slug: profiles.slug,
      isPublic: profiles.isPublic,
      draft: articleCount("draft"),
      submitted: articleCount("submitted"),
      published: articleCount("published"),
      rejected: articleCount("rejected"),
      ai30: sql<number>`(select count(*) from ${aiRequests} where ${aiRequests.userId} = ${users.id} and ${aiRequests.createdAt} >= ${daysStart(30)})::int`,
      // Chiqishda sessiya qatori o‘chiriladi, shuning uchun tasdiqlangan kirish kodlari ham hisobga olinadi.
      // mapWith turini Date qilib qo‘yadi, lekin hech qachon kirmaganlarda null keladi
      lastLogin: sql`greatest(
        (select max(${sessions.createdAt}) from ${sessions} where ${sessions.userId} = ${users.id}),
        (select max(${authRequests.completedAt}) from ${authRequests}
          where ${authRequests.phone} = ${users.phone} and ${authRequests.status} = 'verified')
      )`.mapWith(sessions.createdAt) as SQL<Date | null>,
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(where)
    .orderBy(desc(users.createdAt), desc(users.id))
    .limit(PAGE_SIZE)
    .offset(pager.offset);

  return { items: rows, total, page: pager.page, pages: pager.pages };
}
