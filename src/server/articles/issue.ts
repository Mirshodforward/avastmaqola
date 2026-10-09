import "server-only";
import { and, eq, inArray, ne, sql } from "drizzle-orm";
import type { ArticleStatus } from "@/lib/article-rules";
import { issueLabel } from "@/lib/issue";
import { AuthError } from "../auth/errors";
import { db } from "../db";
import { articles } from "../db/schema";

/** Son va undagi raqam: o‘qituvchi taklif qiladi, moderator yoki admin chop etishda belgilaydi */
export type IssuePlace = { issueNo: number; issueSeq: number };

/** Sondagi navbatdagi raqam: shu holatdagi maqolalarning eng katta raqamidan keyin */
async function nextSeq(issueNo: number, statuses: ArticleStatus[]) {
  const [row] = await db
    .select({ seq: sql<number>`coalesce(max(${articles.issueSeq}), 0)::int + 1` })
    .from(articles)
    .where(and(eq(articles.issueNo, issueNo), inArray(articles.status, statuses)));
  return row.seq;
}

/**
 * Yangi qoralama uchun taklif: joriy son (chop etilganlar ichida eng kattasi) va undagi navbatdagi raqam.
 * Navbatdagilar ham sanaladi — bir vaqtda yozayotgan o‘qituvchilar bir xil raqamni kamroq oladi
 */
export async function suggestIssuePlace(): Promise<IssuePlace> {
  const [row] = await db
    .select({ issueNo: sql<number>`coalesce(max(${articles.issueNo}), 1)::int` })
    .from(articles)
    .where(eq(articles.status, "published"));
  return { issueNo: row.issueNo, issueSeq: await nextSeq(row.issueNo, ["published", "submitted"]) };
}

/** Ko‘rib chiqish paneli uchun: taklif qilingan joyni boshqa chop etilgan maqola egallaganmi va sondagi bo‘sh raqam */
export async function issuePlaceStatus(id: number, issueNo: number, issueSeq: number | null) {
  const [taken] =
    issueSeq === null
      ? []
      : await db
          .select({ id: articles.id })
          .from(articles)
          .where(
            and(
              eq(articles.issueNo, issueNo),
              eq(articles.issueSeq, issueSeq),
              eq(articles.status, "published"),
              ne(articles.id, id),
            ),
          )
          .limit(1);
  return { takenBy: taken?.id ?? null, nextSeq: await nextSeq(issueNo, ["published"]) };
}

/** Joy band bo‘lsa (unique index) — ko‘rib chiquvchiga bo‘sh raqam bilan tushunarli xato; boshqa xato o‘zgarmaydi */
export async function placeTakenError(error: unknown, place: IssuePlace): Promise<unknown> {
  const pg = (error as { cause?: { code?: string; constraint?: string } }).cause;
  if (pg?.code !== "23505" || pg.constraint !== "articles_issue_slot_uq") return error;
  return new AuthError("validation", {
    fieldErrors: { "place.issueSeq": `${issueLabel(place.issueNo, place.issueSeq)} band.` },
    nextSeq: await nextSeq(place.issueNo, ["published"]),
  });
}
