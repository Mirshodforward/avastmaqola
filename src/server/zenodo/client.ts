import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { normalizeDoi } from "@/lib/article-rules";
import type { ZenodoErrorCode } from "../db/schema";
import { siteUrl } from "../site";
import type { ZenodoRecordBody } from "./record";

// Zenodo HTTP mijozi: sozlama va so‘rovlar, bazasiz. Token faqat chaqiruvchi so‘rovning xotirasida yuradi.

export type ZenodoConfig = { url: string; host: string; clientId: string; clientSecret: string; sandbox: boolean };

// Aniq ro‘yxat: token va client secret boshqa hostga hech qachon ketmasin (localhost — faqat sinov mock’i)
const ALLOWED = /^(https:\/\/(sandbox\.)?zenodo\.org|http:\/\/(localhost|127\.0\.0\.1):\d{2,5})$/;
const VND = "application/vnd.inveniordm.v1+json";
const RECORD_ID = /^[a-z0-9-]{1,40}$/;

let warned = false;

/**
 * Uchala o‘zgaruvchi bo‘lmasa yoki manzil ruxsat etilmagan bo‘lsa — null: panel ko‘rinmaydi, kirish va qolgan API
 * ishlayveradi (env() Zenodo’ni talab qilmaydi). Har chaqiriqda process.env’dan o‘qiladi.
 */
export function zenodoConfig(): ZenodoConfig | null {
  const url = process.env.ZENODO_URL?.trim().replace(/\/+$/, "");
  const clientId = process.env.ZENODO_CLIENT_ID?.trim();
  const clientSecret = process.env.ZENODO_CLIENT_SECRET?.trim();
  if (!url || !clientId || !clientSecret) return null;
  if (!ALLOWED.test(url)) {
    if (!warned) console.error(`[zenodo] ZENODO_URL ruxsat etilmagan (faqat zenodo.org yoki sandbox.zenodo.org): ${url}`);
    warned = true;
    return null;
  }
  return { url, host: new URL(url).host, clientId, clientSecret, sandbox: url !== "https://zenodo.org" };
}

/** Zenodo ilovasida ro‘yxatdan o‘tgan manzilning aynan o‘zi (oxirida "/"siz) */
export const redirectUri = () => `${siteUrl()}/api/zenodo/callback`;

/** Zenodo’ning ruxsat sahifasi. Doimiy scope’lar yo‘q — har safar so‘raladi */
export function authorizeUrl(cfg: ZenodoConfig, state: string): string {
  const query = new URLSearchParams({
    response_type: "code",
    client_id: cfg.clientId,
    scope: "deposit:write deposit:actions",
    redirect_uri: redirectUri(),
    state,
  });
  return `${cfg.url}/oauth/authorize?${query}`;
}

export class ZenodoError extends Error {
  constructor(
    public readonly code: ZenodoErrorCode,
    public readonly detail = "",
  ) {
    super(`zenodo: ${code}`);
  }
}

type Reply = { status: number; json: unknown };
type Options = { token?: string; json?: unknown; bytes?: Buffer; form?: Record<string, string>; timeoutMs?: number };

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Yo‘l faqat sozlamadagi manzil, qat’iy qism va tekshirilgan id’dan yig‘iladi; javobdagi havolalarga o‘tilmaydi */
async function send(cfg: ZenodoConfig, method: string, path: string, o: Options = {}): Promise<Reply> {
  const headers: Record<string, string> = {
    // zenodo.org Node’ning standart UA’siga ("node") HTML 403 qaytaradi (sandbox qaytarmaydi) — UA doim aniq yoziladi
    "user-agent": `Avtomaqola/1.0 (+${siteUrl()})`,
    // vnd sarlavhasisiz /api/records eski (legacy) formatdagi JSON qaytaradi
    accept: path.startsWith("/api/records") ? VND : "application/json",
  };
  if (o.token) headers.authorization = `Bearer ${o.token}`;
  let body: BodyInit | undefined;
  if (o.form) {
    headers["content-type"] = "application/x-www-form-urlencoded";
    body = new URLSearchParams(o.form);
  } else if (o.bytes) {
    headers["content-type"] = "application/octet-stream";
    body = new Uint8Array(o.bytes);
  } else if (o.json !== undefined) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(o.json);
  }
  try {
    // redirect: "error" — token yoki secret boshqa manzilga olib ketilmasin
    const res = await fetch(cfg.url + path, {
      method,
      headers,
      body,
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(o.timeoutMs ?? 30_000),
    });
    const text = await res.text();
    return { status: res.status, json: /\bjson\b/i.test(res.headers.get("content-type") ?? "") ? parseJson(text) : null };
  } catch (error) {
    // Tarmoq, timeout yoki uzilgan ulanish. Faqat xato nomi: URL va sarlavhalar logga tushmaydi
    throw new ZenodoError("unavailable", error instanceof Error ? error.name : "fetch");
  }
}

const ok = (r: Reply) => r.status >= 200 && r.status < 300;

const errorBody = z.object({
  message: z.string().optional().catch(undefined),
  errors: z
    .array(z.object({ field: z.string(), messages: z.array(z.string()) }))
    .optional()
    .catch(undefined),
});

/** "A validation error occurred. — metadata.title: Missing data; …" (ko‘pi bilan 300 belgi) */
function describe(json: unknown): { message: string; detail: string } {
  const { message = "", errors = [] } = errorBody.safeParse(json).data ?? {};
  const fields = errors.map((e) => `${e.field}: ${e.messages.join(", ")}`).join("; ");
  return { message, detail: [message, fields].filter(Boolean).join(" — ").slice(0, 300) };
}

/** Muvaffaqiyatsiz javob → xato kodi */
function failure(r: Reply): ZenodoError {
  if (r.status === 429) return new ZenodoError("rate_limited");
  if (r.status >= 500) return new ZenodoError("unavailable", `HTTP ${r.status}`);
  // JSON emas: tarmoq chekkasining HTML 403’i (masalan, UA) yoki noto‘g‘ri manzil — bizning sozlama xatosi
  if (r.json === null) return new ZenodoError("config", `HTTP ${r.status}`);
  const { message, detail } = describe(r.json);
  // Spam filtri (400) yoki IP bloki (403)
  return new ZenodoError(/blocked/i.test(message) ? "blocked" : "rejected", detail || `HTTP ${r.status}`);
}

const oauthError = z.object({ error: z.string() });
const tokenBody = z.object({
  access_token: z.string().min(1),
  user: z.object({ id: z.union([z.string(), z.number()]) }).optional().catch(undefined),
});
const meBody = z.object({ id: z.union([z.string(), z.number()]) });

/**
 * Kodni tokenga almashtirish — darhol va bir marta (Zenodo’da vaqti-vaqti bilan invalid_grant beradigan xato bor:
 * qayta urinish yangi ruxsat bilan). Ikkala client ma’lumoti formada: Zenodo HTTP Basic’ni o‘qimaydi.
 * Faqat access_token va Zenodo foydalanuvchi id’si olinadi; refresh_token tashlab yuboriladi.
 */
export async function exchangeCode(cfg: ZenodoConfig, code: string): Promise<{ token: string; zenodoUserId: string }> {
  const r = await send(cfg, "POST", "/oauth/token", {
    form: {
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri(),
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
    },
    timeoutMs: 15_000,
  });
  if (r.status === 429 || r.status >= 500) throw failure(r);
  const error = oauthError.safeParse(r.json).data?.error;
  // HTML javob (noto‘g‘ri client yoki server) yoki noto‘g‘ri secret — sozlama xatosi
  if (r.json === null || error === "invalid_client") throw new ZenodoError("config", `token: HTTP ${r.status}`);
  if (!ok(r)) throw new ZenodoError("grant", error ?? `HTTP ${r.status}`);
  const body = tokenBody.safeParse(r.json);
  if (!body.success) throw new ZenodoError("config", "token: access_token yo‘q");

  const token = body.data.access_token;
  let id = body.data.user?.id;
  if (id === undefined) {
    const me = await send(cfg, "GET", "/api/me", { token });
    if (me.status === 429 || me.status >= 500) throw failure(me);
    id = ok(me) ? meBody.safeParse(me.json).data?.id : undefined;
  }
  const zenodoUserId = String(id ?? "");
  if (!/^[\w-]{1,64}$/.test(zenodoUserId)) throw new ZenodoError("config", "Zenodo foydalanuvchi id’si yo‘q");
  return { token, zenodoUserId };
}

const draftBody = z.object({
  id: z.union([z.string(), z.number()]),
  errors: z.array(z.unknown()).optional().catch(undefined),
});
const commitBody = z.object({ checksum: z.string() });
const publishedBody = z.object({ is_published: z.literal(true), pids: z.object({ doi: z.object({ identifier: z.string() }) }) });

const doiOf = (json: unknown) => {
  const r = publishedBody.safeParse(json);
  return r.success ? normalizeDoi(r.data.pids.doi.identifier) : null;
};

type Deposited = { recordId: string; doi: string };

/** Oldingi urinishning yozuvi: chop etilgan bo‘lsa — olinadi; faqat qoralama bo‘lsa — o‘chiriladi (null) */
async function adoptOrDiscard(cfg: ZenodoConfig, token: string, id: string): Promise<Deposited | null> {
  const adopt = async (): Promise<Deposited | null> => {
    const r = await send(cfg, "GET", `/api/records/${id}`, { token });
    // 404 — faqat qoralama (DOI hali ro‘yxatdan o‘tmagan), 410 — o‘chirilgan
    if (r.status === 404 || r.status === 410) return null;
    if (!ok(r)) throw failure(r);
    const doi = doiOf(r.json);
    // Ochiq, lekin DOI’siz yozuv — tushunarsiz holat: ikkinchi yozuv yaratmasdan to‘xtaymiz
    if (!doi) throw new ZenodoError("unavailable", `${id}-yozuvda DOI yo‘q`);
    return { recordId: id, doi };
  };

  const found = await adopt();
  if (found) return found;
  const deleted = await send(cfg, "DELETE", `/api/records/${id}/draft`, { token });
  // Qoralama yo‘q: sekin chop etish shu orada tugagan bo‘lishi mumkin — yana bir bor tekshiriladi
  if (deleted.status === 404 || deleted.status === 410) return adopt();
  // Qoralama boshqa Zenodo akkauntida (o‘qituvchi oldin boshqasi bilan kirgan): yopiq va DOI’siz — tashlab ketiladi
  if (deleted.status === 403) {
    console.warn(`[zenodo] ${id}-qoralama boshqa Zenodo akkauntida — tashlab ketildi`);
    return null;
  }
  if (!ok(deleted)) throw failure(deleted);
  return null;
}

/**
 * Joylash: (qayta urinishda oldingi yozuvni olish yoki o‘chirish) → qoralama → PDF → md5 tekshiruvi → chop etish.
 * Chop etishni qaytarib bo‘lmaydi, shuning uchun har qanday shubhada undan oldin to‘xtaydi.
 */
export async function depositRecord(
  cfg: ZenodoConfig,
  token: string,
  d: {
    record: ZenodoRecordBody;
    pdf: Buffer;
    fileKey: string;
    previousId: string | null;
    onDraft: (recordId: string) => Promise<void>;
    beforePublish: () => Promise<void>;
  },
): Promise<Deposited> {
  if (d.previousId) {
    const adopted = await adoptOrDiscard(cfg, token, d.previousId);
    if (adopted) return adopted;
  }

  const created = await send(cfg, "POST", "/api/records", { token, json: d.record });
  if (!ok(created)) throw failure(created);
  const draft = draftBody.safeParse(created.json);
  const id = draft.success ? String(draft.data.id) : "";
  if (!RECORD_ID.test(id)) throw new ZenodoError("unavailable", "qoralama id’si yo‘q");
  // Darhol bazaga: javob yo‘qolsa ham keyingi urinish bu qoralamani topib oladi yoki o‘chiradi
  await d.onDraft(id);
  // 201, lekin metama’lumotda xato: qoralama yopiq, keyingi urinish uni o‘chiradi
  if (draft.data?.errors?.length) throw new ZenodoError("rejected", describe(created.json).detail);

  const files = `/api/records/${id}/draft/files`;
  const file = `${files}/${encodeURIComponent(d.fileKey)}`;
  const init = await send(cfg, "POST", files, { token, json: [{ key: d.fileKey }] });
  if (!ok(init)) throw failure(init);
  const upload = await send(cfg, "PUT", `${file}/content`, { token, bytes: d.pdf, timeoutMs: 120_000 });
  if (!ok(upload)) throw failure(upload);
  const commit = await send(cfg, "POST", `${file}/commit`, { token });
  if (!ok(commit)) throw failure(commit);
  const checksum = commitBody.safeParse(commit.json).data?.checksum;
  if (checksum !== `md5:${createHash("md5").update(d.pdf).digest("hex")}`) {
    throw new ZenodoError("file", checksum ? `Zenodo’dagi fayl: ${checksum}` : "checksum yo‘q");
  }

  await d.beforePublish();
  const published = await send(cfg, "POST", `/api/records/${id}/draft/actions/publish`, { token, timeoutMs: 60_000 });
  if (!ok(published)) throw failure(published);
  const doi = doiOf(published.json);
  // DOI’siz javob: keyingi urinish GET orqali chop etilganini topib oladi
  if (!doi) throw new ZenodoError("unavailable", "javobda DOI yo‘q");
  return { recordId: id, doi };
}
