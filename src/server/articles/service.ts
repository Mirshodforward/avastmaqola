import "server-only";
import { randomBytes } from "node:crypto";
import { and, asc, desc, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import {
  ARTICLE_LIMITS,
  EDITABLE_STATUSES,
  articleProblems,
  type ArticleFields,
} from "@/lib/article-rules";
import { UNIVERSITY_NAME } from "@/lib/brand";
import { AuthError } from "../auth/errors";
import { db, type Db, type Tx } from "../db";
import { articleAuthors, articles, profiles, users } from "../db/schema";
import { deleteFile, saveFile } from "../storage";
import { suggestIssuePlace } from "./issue";
import type { DraftInput } from "./schemas";

/** Qoralama, navbatdagi va tuzatishdagi maqolalar birgalikda: bitta akkaunt navbatni (va adminlar Telegram’ini) to‘ldira olmasin */
const MAX_UNPUBLISHED = 10;
const editable = [...EDITABLE_STATUSES];

const owned = (userId: string, id: number) => and(eq(articles.id, id), eq(articles.userId, userId));

/** Begona yoki mavjud bo‘lmagan maqola — 404, tahrirlab bo‘lmaydigan holat — 409 */
async function assertEditable(executor: Db | Tx, userId: string, id: number) {
  const [row] = await executor
    .select({ status: articles.status, pdfKey: articles.pdfKey })
    .from(articles)
    .where(owned(userId, id))
    .limit(1);
  if (!row) throw new AuthError("not_found");
  if (!editable.includes(row.status)) throw new AuthError("state_conflict");
  return row;
}

export async function createDraft(userId: string): Promise<number> {
  // "3-son, 12-maqola" o‘qituvchiga oldindan yozib qo‘yiladi: o‘zgartirishi mumkin, ko‘rib chiquvchi tasdiqlaydi
  const place = await suggestIssuePlace();
  const [owner] = await db
    .select({
      firstName: users.firstName,
      lastName: users.lastName,
      orcid: users.orcid,
      institution: profiles.institution,
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(users.id, userId))
    .limit(1);

  return db.transaction(async (tx) => {
    // Bir akkauntning parallel so‘rovlari navbatma-navbat: hammasi "10 dan kam" ko‘rib chegarani oshirib ketmasin
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${userId}, 0))`);

    // Hech narsa yozilmagan qoralama bo‘lsa, o‘sha ochiladi: «Yangi maqola»ni qayta bosish ro‘yxatni
    // «Sarlavhasiz maqola»lar bilan to‘ldirmasin (va chegarani band qilmasin)
    const blank = (column: unknown) => sql`btrim(coalesce(${column}, '')) = ''`;
    const [empty] = await tx
      .select({ id: articles.id })
      .from(articles)
      .where(
        and(
          eq(articles.userId, userId),
          eq(articles.status, "draft"),
          isNull(articles.pdfKey),
          isNull(articles.venue),
          isNull(articles.doi),
          blank(articles.titleUz),
          blank(articles.titleRu),
          blank(articles.titleEn),
          blank(articles.abstractUz),
          blank(articles.abstractRu),
          blank(articles.abstractEn),
          sql`cardinality(${articles.keywordsUz}) + cardinality(${articles.keywordsRu}) + cardinality(${articles.keywordsEn}) = 0`,
          // Hammualliflar qo‘shilgan bo‘lsa — bu allaqachon boshlangan ish
          sql`(select count(*) from ${articleAuthors} where ${articleAuthors.articleId} = ${articles.id}) <= 1`,
        ),
      )
      .orderBy(desc(articles.updatedAt))
      .limit(1);
    if (empty) {
      // Kabinetdagi «So‘nggi maqolalar» tepasiga chiqadi
      await tx.update(articles).set({ updatedAt: sql`now()` }).where(eq(articles.id, empty.id));
      return empty.id;
    }

    const [{ open }] = await tx
      .select({ open: sql<number>`count(*)::int` })
      .from(articles)
      .where(and(eq(articles.userId, userId), ne(articles.status, "published")));
    if (open >= MAX_UNPUBLISHED) throw new AuthError("limit_reached");

    const [row] = await tx.insert(articles).values({ userId, ...place }).returning({ id: articles.id });
    // Birinchi muallif — o‘qituvchining o‘zi (keyin tartibini o‘zgartirishi mumkin)
    await tx.insert(articleAuthors).values({
      articleId: row.id,
      position: 1,
      userId,
      givenName: owner.firstName,
      familyName: owner.lastName,
      institution: owner.institution ?? UNIVERSITY_NAME,
      orcid: owner.orcid,
    });
    return row.id;
  });
}

/** lock — yuborishda qator qulflanadi: tekshiruv va holat o‘zgarishi orasida boshqa oynadagi saqlash kira olmaydi */
export async function getOwnArticle(userId: string, id: number, executor: Db | Tx = db, lock = false) {
  const query = executor.select().from(articles).where(owned(userId, id)).limit(1);
  const [article] = await (lock ? query.for("update") : query);
  if (!article) return null;
  const authors = await executor
    .select()
    .from(articleAuthors)
    .where(eq(articleAuthors.articleId, id))
    .orderBy(asc(articleAuthors.position));
  return { article, authors };
}

export type OwnArticle = NonNullable<Awaited<ReturnType<typeof getOwnArticle>>>;

export function listOwnArticles(userId: string) {
  return db
    .select({
      id: articles.id,
      status: articles.status,
      lang: articles.lang,
      titleUz: articles.titleUz,
      titleRu: articles.titleRu,
      titleEn: articles.titleEn,
      reviewNote: articles.reviewNote,
      updatedAt: articles.updatedAt,
    })
    .from(articles)
    .where(eq(articles.userId, userId))
    .orderBy(desc(articles.updatedAt));
}

export function toFields({ article: a, authors }: OwnArticle): ArticleFields {
  return {
    lang: a.lang,
    license: a.license,
    hasPdf: a.pdfKey !== null,
    titleUz: a.titleUz ?? "",
    titleRu: a.titleRu ?? "",
    titleEn: a.titleEn ?? "",
    abstractUz: a.abstractUz ?? "",
    abstractRu: a.abstractRu ?? "",
    abstractEn: a.abstractEn ?? "",
    keywordsUz: a.keywordsUz,
    keywordsRu: a.keywordsRu,
    keywordsEn: a.keywordsEn,
    venueType: a.venueType,
    venue: a.venue ?? "",
    volume: a.volume ?? "",
    issue: a.issue ?? "",
    pages: a.pages ?? "",
    pubYear: a.pubYear,
    doi: a.doi ?? "",
    authors: authors.map((x) => ({
      givenName: x.givenName,
      familyName: x.familyName,
      institution: x.institution ?? "",
      orcid: x.orcid ?? "",
      isMe: x.userId !== null,
    })),
  };
}

export async function saveDraft(userId: string, id: number, input: DraftInput) {
  const { authors, ...fields } = input;
  await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(articles)
      .set(fields)
      .where(and(owned(userId, id), inArray(articles.status, editable)))
      .returning({ id: articles.id });
    if (!updated) {
      await assertEditable(tx, userId, id);
      throw new AuthError("state_conflict");
    }
    // Mualliflar har saqlashda to‘liq almashtiriladi (ko‘pi bilan 15 qator)
    await tx.delete(articleAuthors).where(eq(articleAuthors.articleId, id));
    await tx.insert(articleAuthors).values(
      authors.map((a, i) => ({
        articleId: id,
        position: i + 1,
        userId: a.isMe ? userId : null,
        givenName: a.givenName,
        familyName: a.familyName,
        institution: a.institution || null,
        orcid: a.orcid || null,
      })),
    );
  });
}

export async function uploadPdf(userId: string, id: number, file: File) {
  if (file.size > ARTICLE_LIMITS.pdfMaxBytes) throw new AuthError("file_too_large");
  const current = await assertEditable(db, userId, id);
  const data = Buffer.from(await file.arrayBuffer());
  // Kengaytmaga emas, faylning boshidagi imzoga qaraymiz
  if (data.subarray(0, 5).toString("latin1") !== "%PDF-") throw new AuthError("file_invalid");

  const key = `${id}-${randomBytes(8).toString("hex")}.pdf`;
  await saveFile("articles", key, data);
  const [row] = await db
    .update(articles)
    .set({ pdfKey: key, pdfBytes: data.length })
    .where(and(owned(userId, id), inArray(articles.status, editable)))
    .returning({ id: articles.id });
  if (!row) {
    await deleteFile("articles", key);
    throw new AuthError("state_conflict");
  }
  if (current.pdfKey) await deleteFile("articles", current.pdfKey);
  return { pdfBytes: data.length };
}

export async function submitArticle(userId: string, id: number) {
  // Tekshirilgan nusxa aynan yuborilgani bo‘lishi uchun o‘qish, tekshirish va holat o‘zgarishi bitta tranzaksiyada
  return db.transaction(async (tx) => {
    const own = await getOwnArticle(userId, id, tx, true);
    if (!own) throw new AuthError("not_found");
    const problems = articleProblems(toFields(own));
    const [profile] = await tx.select({ userId: profiles.userId }).from(profiles).where(eq(profiles.userId, userId)).limit(1);
    if (!profile) problems.unshift({ field: "profile", message: "Avval profilingizni to‘ldiring" });
    if (problems.length) throw new AuthError("incomplete", { problems });

    const [row] = await tx
      .update(articles)
      // Yuborishning o‘zi huquq tasdig‘i (alohida belgi yo‘q): vaqt birinchi yuborishda yoziladi
      .set({
        status: "submitted",
        submittedAt: sql`now()`,
        reviewNote: null,
        rightsConfirmedAt: sql`coalesce(${articles.rightsConfirmedAt}, now())`,
      })
      .where(and(owned(userId, id), inArray(articles.status, editable)))
      .returning({ id: articles.id });
    if (!row) throw new AuthError("state_conflict");
    return own;
  });
}

/** Hech qachon chop etilmagan qoralama yoki rad etilgan maqolani o‘chirish */
export async function deleteArticle(userId: string, id: number) {
  const [row] = await db
    .delete(articles)
    .where(and(owned(userId, id), inArray(articles.status, editable), isNull(articles.publishedAt)))
    .returning({ pdfKey: articles.pdfKey });
  if (!row) {
    await assertEditable(db, userId, id);
    throw new AuthError("state_conflict");
  }
  if (row.pdfKey) await deleteFile("articles", row.pdfKey);
}
