import "server-only";
import { sql, type AnyColumn, type SQL } from "drizzle-orm";

/** Kun va oy chegaralari Toshkent vaqti bilan: baza qaysi mintaqada ishlashiga bog‘liq emas */
export const TZ = sql.raw("'Asia/Tashkent'");

/**
 * "N kun" — bugun bilan birga so‘nggi N kalendar kuni (grafikdagi kunlar bilan bir xil); daysStart(1) — bugun.
 * Hisob Toshkent devor soatida: sessiya mintaqasidagi yozgi vaqt o‘tishi chegarani surmaydi.
 */
export const daysStart = (days: number) =>
  sql`(date_trunc('day', now() at time zone ${TZ}) - make_interval(days => ${days - 1})) at time zone ${TZ}`;

export const monthStart = sql`date_trunc('month', now() at time zone ${TZ}) at time zone ${TZ}`;

/** pg count() natijasini bigint (satr) qilib qaytaradi — ::int bilan son */
export const countIf = (condition: SQL) => sql<number>`(count(*) filter (where ${condition}))::int`;

export const sumOf = (value: SQL | AnyColumn, condition?: SQL) =>
  sql<number>`coalesce(sum(${value})${condition ? sql` filter (where ${condition})` : sql``}, 0)`.mapWith(Number);

/** ILIKE uchun: kiritilgan % va _ belgilar shablon emas, oddiy belgi sifatida qidiriladi */
export const likePattern = (text: string) => `%${text.replace(/[\\%_]/g, "\\$&")}%`;
