import "server-only";
import { createHmac } from "node:crypto";
import { and, eq, gt, ne, sql } from "drizzle-orm";
import { LICENSE_INFO, titleIn } from "@/lib/article-rules";
import { doiUrl } from "@/lib/citation";
import { getOwnArticle, type OwnArticle } from "../articles/service";
import { newToken } from "../auth/crypto";
import { AuthError } from "../auth/errors";
import type { SessionUser } from "../auth/session";
import { db } from "../db";
import { aiRequests, articles, zenodoDeposits, type ZenodoErrorCode } from "../db/schema";
import { env } from "../env";
import { siteUrl } from "../site";
import { readStoredFile } from "../storage";
import { ZenodoError, depositRecord, exchangeCode, type ZenodoConfig } from "./client";
import { fileKey, previewOf, recordHash, zenodoRecord } from "./record";

export const ZENODO_COOKIE = "am_zenodo";
// am_flow kabi faqat callback’ga yuboriladi. Path tufayli __Host- bo‘lolmaydi — yaxlitlikni HMAC state ta’minlaydi
export const ZENODO_COOKIE_PATH = "/api/zenodo";

/** OAuth state (43 belgi): oqimni joriy sessiya foydalanuvchisi, maqola va o‘qituvchi tasdiqlagan yozuvga bog‘laydi */
export function zenodoState(userId: string, articleId: number, nonce: string, hash: string): string {
  return createHmac("sha256", env().AUTH_SECRET)
    .update(`zenodo-state:${userId}:${articleId}:${nonce}:${hash}`)
    .digest("base64url");
}

export type ZenodoFlow = { articleId: number; nonce: string; hash: string };

/** Cookie: `{maqola}.{nonce}.{xesh}`. Qiymatga ishonilmaydi — callback state, egalik va xeshni qayta tekshiradi */
export function parseFlowCookie(raw?: string): ZenodoFlow | null {
  const m = raw?.match(/^([1-9][0-9]{0,8})\.([\w-]{43})\.([\w-]{43})$/);
  return m ? { articleId: Number(m[1]), nonce: m[2], hash: m[3] } : null;
}

const FLASHES = ["denied", "expired", "changed", "failed"] as const;
export type ZenodoFlash = (typeof FLASHES)[number];

/** Callback qaytargan ?zenodo= belgisi. busy — matnsiz: holat panelning o‘zida ko‘rinadi */
export const zenodoFlash = (value: unknown): ZenodoFlash | null =>
  FLASHES.find((flash) => flash === value) ?? null;

/** Faqat shu saytda birinchi chop etilgan to‘liq maqola: jurnal yoki nashriyot DOI’li maqola Zenodo’ga joylanmaydi */
export function isEligible(a: OwnArticle["article"]): boolean {
  return a.status === "published" && !a.venue && !a.doi && a.pdfKey !== null && a.lang !== null && a.publishedAt !== null;
}

export type ZenodoPanelData =
  | { state: "ineligible" }
  | { state: "in_progress" }
  | { state: "published"; doi: string; doiHref: string; recordUrl: string }
  | {
      state: "ready";
      hash: string;
      preview: [string, string][];
      licenseLabel: string;
      error: { code: ZenodoErrorCode | "interrupted"; detail: string | null } | null;
    };

const at = (cfg: ZenodoConfig, articleId: number) =>
  and(eq(zenodoDeposits.articleId, articleId), eq(zenodoDeposits.host, cfg.host));
const recordUrlOf = (cfg: ZenodoConfig, recordId: string) => `${cfg.url}/records/${recordId}`;

async function depositRow(cfg: ZenodoConfig, articleId: number) {
  const [row] = await db
    .select({
      status: zenodoDeposits.status,
      doi: zenodoDeposits.doi,
      recordId: zenodoDeposits.recordId,
      error: zenodoDeposits.error,
      errorDetail: zenodoDeposits.errorDetail,
      // Baza soati bilan: render paytida Date.now() o‘qilmaydi. 10 daqiqadan eski in_progress — uzilgan urinish
      stale: sql<boolean>`${zenodoDeposits.updatedAt} < now() - interval '10 minutes'`,
    })
    .from(zenodoDeposits)
    .where(at(cfg, articleId))
    .limit(1);
  return row ?? null;
}

/** AI yordamchi maydon taklif qilgan bo‘lsa — Zenodo yozuviga AI izohi qo‘shiladi */
async function aiUsed(articleId: number): Promise<boolean> {
  const [row] = await db
    .select({ id: aiRequests.id })
    .from(aiRequests)
    .where(and(eq(aiRequests.articleId, articleId), eq(aiRequests.status, "ok"), gt(aiRequests.proposedFields, 0)))
    .limit(1);
  return Boolean(row);
}

/** O‘qituvchi panelining holati. Chop etilgan DOI maqola keyin o‘zgargan bo‘lsa ham ko‘rsatiladi */
export async function loadZenodoPanel(cfg: ZenodoConfig, own: OwnArticle): Promise<ZenodoPanelData> {
  const { article } = own;
  const row = await depositRow(cfg, article.id);
  if (row?.status === "published" && row.doi && row.recordId) {
    const recordUrl = recordUrlOf(cfg, row.recordId);
    // Sinov serverining DOI’si ochilmaydi — havola yozuvning o‘ziga
    return { state: "published", doi: row.doi, doiHref: cfg.sandbox ? recordUrl : doiUrl(row.doi), recordUrl };
  }
  if (row?.status === "in_progress" && !row.stale) return { state: "in_progress" };
  if (!isEligible(article)) return { state: "ineligible" };

  const record = zenodoRecord(own, await aiUsed(article.id));
  return {
    state: "ready",
    hash: recordHash(record, article.pdfKey!),
    preview: previewOf(record, article),
    licenseLabel: LICENSE_INFO[article.license].label,
    error:
      row?.status === "failed"
        ? { code: row.error ?? "internal", detail: row.errorDetail }
        : row
          ? { code: "interrupted", detail: null }
          : null,
  };
}

/** Start: o‘qituvchi ko‘rgan yozuv hali o‘sha ekanini tekshiradi va yangi oqim uchun nonce beradi */
export async function startDeposit(cfg: ZenodoConfig, userId: string, id: number, hash: string): Promise<string> {
  const own = await getOwnArticle(userId, id);
  if (!own) throw new AuthError("not_found");
  if (!isEligible(own.article)) throw new AuthError("state_conflict");
  const row = await depositRow(cfg, id);
  // Allaqachon chop etilgan yoki hozir joylanmoqda — sahifani yangilash kerak
  if (row && (row.status === "published" || (row.status === "in_progress" && !row.stale))) {
    throw new AuthError("state_conflict");
  }
  // Sahifa ochilgandan beri maqola yoki PDF o‘zgargan bo‘lsa, yangi ko‘rinish qayta tasdiqlanadi
  const record = zenodoRecord(own, await aiUsed(id));
  if (recordHash(record, own.article.pdfKey!) !== hash) throw new AuthError("state_conflict");
  return newToken();
}

export type DepositResult = {
  /** Bazada hech narsa o‘zgarmadi: maqola o‘zgargan yoki joylash allaqachon boshqa oynada */
  flag?: "changed" | "busy";
  published?: { doi: string; recordUrl: string; title: string };
  adminAlert?: string;
};

// O‘qituvchi o‘zi tuzata olmaydigan xatolar — adminlarga Telegram
const ALERT: ReadonlySet<ZenodoErrorCode> = new Set(["rejected", "blocked", "config", "internal"]);

/**
 * Callback ichida, sinxron: kod → token → qoralama → PDF → chop etish. Token faqat shu so‘rov xotirasida.
 * Avval bazada da’vo (compare-and-set): parallel callback’lar kodni ikki marta almashtirmaydi — Zenodo yangi token
 * berganda oldingisini o‘chiradi va birinchi joylash yarim yo‘lda to‘xtab qolardi.
 */
export async function runDeposit(cfg: ZenodoConfig, user: SessionUser, flow: ZenodoFlow, code: string): Promise<DepositResult> {
  const own = await getOwnArticle(user.id, flow.articleId);
  if (!own || !isEligible(own.article)) return { flag: "changed" };
  const { article } = own;
  const record = zenodoRecord(own, await aiUsed(article.id));
  if (recordHash(record, article.pdfKey!) !== flow.hash) return { flag: "changed" };

  const where = at(cfg, article.id);
  const [claimed] = await db
    .insert(zenodoDeposits)
    .values({ articleId: article.id, host: cfg.host, status: "in_progress", updatedAt: sql`now()` })
    .onConflictDoUpdate({
      target: [zenodoDeposits.articleId, zenodoDeposits.host],
      set: { status: "in_progress", error: null, errorDetail: null, updatedAt: sql`now()` },
      // Faqat xato bilan tugagan yoki uzilib qolgan urinish qayta boshlanadi
      setWhere: sql`${zenodoDeposits.status} = 'failed'
        or (${zenodoDeposits.status} = 'in_progress' and ${zenodoDeposits.updatedAt} < now() - interval '10 minutes')`,
    })
    .returning({ recordId: zenodoDeposits.recordId });
  if (!claimed) return { flag: "busy" };

  const title = titleIn(article);
  try {
    const { token, zenodoUserId } = await exchangeCode(cfg, code);
    // Bitta Zenodo akkaunti — bitta o‘qituvchi: umumiy (kafedra) akkaunti boshqalar nomidan DOI yig‘masin
    const [taken] = await db
      .select({ articleId: zenodoDeposits.articleId })
      .from(zenodoDeposits)
      .innerJoin(articles, eq(articles.id, zenodoDeposits.articleId))
      .where(
        and(
          eq(zenodoDeposits.host, cfg.host),
          eq(zenodoDeposits.zenodoUserId, zenodoUserId),
          eq(zenodoDeposits.status, "published"),
          ne(articles.userId, user.id),
        ),
      )
      .limit(1);
    if (taken) throw new ZenodoError("account_taken");

    const done = await depositRecord(cfg, token, {
      record,
      pdf: await readStoredFile("articles", article.pdfKey!),
      fileKey: fileKey(article.id),
      previousId: claimed.recordId,
      onDraft: async (recordId) => {
        await db.update(zenodoDeposits).set({ recordId, zenodoUserId, updatedAt: sql`now()` }).where(where);
      },
      // Shu orada admin maqolani olib tashlagan bo‘lsa — chop etilmaydi
      beforePublish: async () => {
        const [current] = await db.select({ status: articles.status }).from(articles).where(eq(articles.id, article.id)).limit(1);
        if (current?.status !== "published") throw new ZenodoError("article_changed");
      },
    });
    await db
      .update(zenodoDeposits)
      .set({ status: "published", recordId: done.recordId, doi: done.doi, error: null, errorDetail: null, updatedAt: sql`now()` })
      .where(where);
    return { published: { doi: done.doi, recordUrl: recordUrlOf(cfg, done.recordId), title } };
  } catch (e) {
    // Kutilmagan xato (masalan, PDF diskda yo‘q) logga; Zenodo xatolarining matni bazada (tokensiz)
    if (!(e instanceof ZenodoError)) console.error(`[zenodo] maqola ${article.id}:`, e);
    const error = e instanceof ZenodoError ? e : new ZenodoError("internal");
    await db
      .update(zenodoDeposits)
      .set({ status: "failed", error: error.code, errorDetail: error.detail.slice(0, 300) || null, updatedAt: sql`now()` })
      .where(where);
    if (!ALERT.has(error.code)) return {};
    return {
      adminAlert:
        `Zenodo xatosi: №${article.id} «${title}» — ${error.code}${error.detail ? `: ${error.detail}` : ""}\n` +
        `${siteUrl()}/admin/articles/${article.id}`,
    };
  }
}
