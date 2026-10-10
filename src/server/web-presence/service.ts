import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { BetaMessageStream } from "@anthropic-ai/sdk/lib/BetaMessageStream";
import type { BetaContentBlock, BetaMessageParam, BetaUsage } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import { and, desc, eq, gt, isNotNull, sql } from "drizzle-orm";
import { cleanText } from "@/lib/text";
import type { PresenceConfidence, PresenceEvent, PresenceResult } from "@/lib/web-presence";
import { AI_LIMITS, AI_MODEL, aiClient, costMicroUsd, type AiUsage } from "../ai/client";
import { AuthError } from "../auth/errors";
import { db } from "../db";
import { aiRequests, type AiRequestStatus } from "../db/schema";
import { getEditableProfile } from "../profiles/service";
import { REPORT_TOOL, SYSTEM_PROMPT, reportSchema, type Report } from "./prompt";
import { loadKnown, safeUrl, siteOf, type Known } from "./sources";

export const WEB_LIMITS = {
  /** Bir o‘qituvchiga kuniga (Toshkent vaqti). Xato bilan tugaganlari hisoblanmaydi — narxni umumiy byudjet cheklaydi */
  perDay: 3,
  /** Bitta API so‘rovida; pause_turn’dan keyingi davomida hisob yangidan boshlanadi */
  maxSearches: 8,
  /** pause_turn yoki hisobotsiz tugagandan keyingi qo‘shimcha so‘rovlar */
  maxContinuations: 2,
  maxOutputTokens: 20_000,
  maxDurationMs: 4 * 60_000,
} as const;

/** Veb-qidiruv: $10 / 1000 ta (1 USD = 1 000 000) */
const SEARCH_MICRO_USD = 10_000;
const CACHE = { type: "ephemeral" } as const;
const today = sql`date_trunc('day', now() at time zone 'Asia/Tashkent') at time zone 'Asia/Tashkent'`;

/** Limit hisobi: o‘tgan 2 kun ichidagi izlashlar (bugungilari soni, umumiy AI narxi, hozir ishlayotgani) */
async function usage(userId: string, tx: Pick<typeof db, "select"> = db) {
  const [used] = await tx
    .select({
      count: sql<number>`(count(*) filter (where ${aiRequests.kind} = 'web' and ${aiRequests.status} <> 'error' and ${aiRequests.createdAt} >= ${today}))::int`,
      cost: sql<number>`(coalesce(sum(${aiRequests.costMicroUsd}) filter (where ${aiRequests.createdAt} >= ${today}), 0))::int`,
      // Server o‘chib qolsa "running" qator abadiy bloklamasin (izlash maxDurationMs’dan uzoq davom etmaydi)
      running: sql<number>`(count(*) filter (where ${aiRequests.kind} = 'web' and ${aiRequests.status} = 'running' and ${aiRequests.createdAt} > now() - interval '5 minutes'))::int`,
    })
    .from(aiRequests)
    .where(and(eq(aiRequests.userId, userId), gt(aiRequests.createdAt, sql`now() - interval '2 days'`)));
  return used;
}

async function reserve(userId: string) {
  return db.transaction(async (tx) => {
    // AI yordamchi bilan bir xil qulf: umumiy byudjet tekshiruvi parallel so‘rovlarda ikki marta o‘tib ketmasin
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`ai:${userId}`}, 0))`);
    const used = await usage(userId, tx);
    if (used.running > 0) throw new AuthError("ai_busy");
    if (used.count >= WEB_LIMITS.perDay || used.cost >= AI_LIMITS.dailyBudgetMicroUsd) throw new AuthError("ai_limit");
    const [row] = await tx.insert(aiRequests).values({ userId, kind: "web", model: AI_MODEL }).returning({ id: aiRequests.id });
    return row.id;
  });
}

/** Faqat o‘qituvchining o‘z profili: API so‘rovdan hech narsa olmaydi — birovni izlash vositasiga aylanmaydi */
async function identity(userId: string) {
  const row = await getEditableProfile(userId);
  if (!row?.profile) throw new AuthError("profile_required");
  const p = row.profile;
  const clean = (v: string | null) => (v ? cleanText(v).replace(/\s+/g, " ").slice(0, 200) : undefined);
  return {
    lastName: row.lastName,
    orcid: row.orcid,
    googleScholarUrl: p.googleScholarUrl,
    scopusAuthorId: p.scopusAuthorId,
    teacher: {
      name: clean(`${row.firstName} ${row.lastName}`),
      patronymic: clean(p.patronymic),
      position: clean(p.position),
      institution: clean(p.institution),
      department: clean(p.department),
      field: clean(p.direction),
      keywords: p.keywords.slice(0, 5).map((k) => clean(k)),
    },
  };
}

function teacherMessage(teacher: Awaited<ReturnType<typeof identity>>["teacher"], known: Known, orcid: string | null) {
  const list = known.items
    .slice(0, 40)
    .map((k) => `- ${k.title}${k.year ? ` (${k.year})` : ""}: ${k.url}`)
    .join("\n");
  // ORCID ism tekshiruvidan o‘tmagan bo‘lsa modelga ham berilmaydi
  const data = JSON.stringify({ ...teacher, orcid: known.orcid === "used" ? orcid : undefined }, null, 2);
  return `<teacher>\n${data}\n</teacher>\n<known_pages>\n${list || "(none)"}\n</known_pages>\nFind the pages on the web about this teacher.`;
}

/** Solishtirish kaliti: www, #, utm_* va oxirgi "/" farq qilmaydi */
function urlKey(raw: string): string | null {
  const url = safeUrl(raw);
  if (!url) return null;
  for (const name of [...url.searchParams.keys()]) if (/^(utm_|fbclid$|gclid$)/i.test(name)) url.searchParams.delete(name);
  return `${siteOf(url)}${url.pathname.replace(/\/+$/, "")}${url.search}`.toLowerCase();
}

type Seen = Map<string, { url: string; title: string }>;

/** Qidiruv natijalarida haqiqatan kelgan havolalar (dinamik filtrlash kodidan chaqirilganlari ham — caller bilan) */
function collectResults(content: BetaContentBlock[], seen: Seen) {
  for (const block of content) {
    if (block.type !== "web_search_tool_result" || !Array.isArray(block.content)) continue;
    for (const r of block.content) {
      const key = urlKey(r.url);
      if (key && !seen.has(key)) seen.set(key, { url: r.url, title: cleanText(r.title).replace(/\s+/g, " ").slice(0, 300) });
    }
  }
}

const STRONG = new Set(["orcid", "institution", "coauthor"]);

/**
 * Ishonch darajasi — modelning so‘zi emas, server qoidasi: "Aniq" faqat ORCID/OpenAlex va o‘qituvchining o‘z
 * havolalari (sources.ts). Veb-topilma ko‘pi bilan "Ehtimol"; adash yoki tasdiqsiz "balki shu" — ko‘rsatilmaydi.
 */
function confidenceOf(match: Report["items"][number]["match"], signals: string[]): PresenceConfidence | null {
  if (match === "same_person") return "likely";
  if (match === "probably_same" && signals.some((s) => STRONG.has(s))) return "likely";
  return null;
}

const cleanNote = (note: string) =>
  cleanText(note)
    .replace(/\s+/g, " ")
    .replace(/\S+@\S+\.\S+/g, "")
    .replace(/\+?\d[\d\s()-]{7,}\d/g, "")
    .trim()
    .slice(0, 120) || null;

const ORDER = { profile: 0, publication: 1, mention: 2 } as const;

function buildResult(known: Known, report: Report, seen: Seen): PresenceResult {
  let namesakes = 0;
  const keys = new Set(known.items.map((i) => urlKey(i.url)));
  const items = [...known.items];
  for (const f of report.items) {
    const confidence = confidenceOf(f.match, f.signals);
    if (!confidence) {
      namesakes++;
      continue;
    }
    const key = urlKey(f.url);
    const hit = key ? seen.get(key) : undefined;
    // Qidiruv natijalarida bo‘lmagan havola (o‘ylab topilgan yoki o‘zgartirilgan) ko‘rsatilmaydi
    if (!key || !hit || keys.has(key)) continue;
    keys.add(key);
    const url = safeUrl(hit.url)!;
    items.push({ url: url.href, title: hit.title || siteOf(url), site: siteOf(url), category: f.category, confidence, source: "web", year: null, note: cleanNote(f.note) });
  }
  items.sort(
    (a, b) =>
      ORDER[a.category] - ORDER[b.category] ||
      Number(b.confidence === "exact") - Number(a.confidence === "exact") ||
      (b.year ?? 0) - (a.year ?? 0),
  );
  return { items, namesakes, orcid: known.orcid };
}

type Run = { usage: AiUsage; searches: number; stream: BetaMessageStream | null };

function addUsage(run: Run, u: BetaUsage | null | undefined) {
  // Zaxira model ishlasa, har urinish alohida (usage.iterations); qidiruvlar soni — yuqori darajada
  for (const p of u?.iterations?.length ? u.iterations : u ? [u] : []) {
    run.usage.input += p.input_tokens ?? 0;
    run.usage.output += p.output_tokens ?? 0;
    run.usage.cacheRead += p.cache_read_input_tokens ?? 0;
    run.usage.cacheWrite += p.cache_creation_input_tokens ?? 0;
  }
  run.searches += u?.server_tool_use?.web_search_requests ?? 0;
}

type Outcome = { status: AiRequestStatus; report: Report | null; error?: string };

/** Bitta Claude so‘rovi + pause_turn davomlari. Hisobot (report_findings) kelishi bilan tugaydi — javob qaytarilmaydi */
async function search(client: Anthropic, userId: string, text: string, seen: Seen, signal: AbortSignal, run: Run, send: (e: PresenceEvent) => void): Promise<Outcome> {
  const messages: BetaMessageParam[] = [{ role: "user", content: text }];
  for (let round = 0; round <= WEB_LIMITS.maxContinuations; round++) {
    const stream = (run.stream = client.beta.messages.stream(
      {
        model: AI_MODEL,
        max_tokens: WEB_LIMITS.maxOutputTokens,
        // Xavfsizlik klassifikatori rad etsa, so‘rov server tomonida tavsiya etilgan zaxira modelda bajariladi
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "medium" },
        // Kesh belgisi bo‘lsa, API server siklidagi qidiruv natijalariga ham kesh qo‘yadi — keyingi qadamlar arzon o‘qiladi
        system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: CACHE }],
        tools: [{ type: "web_search_20260209", name: "web_search", max_uses: WEB_LIMITS.maxSearches }, REPORT_TOOL],
        metadata: { user_id: userId },
        messages,
      },
      { signal },
    ));
    stream.on("contentBlock", (block) => {
      if (block.type === "server_tool_use" && block.name === "web_search" && typeof block.input.query === "string") {
        send({ t: "step", v: `Qidirilmoqda: «${block.input.query.slice(0, 160)}»` });
      }
    });
    const message = await stream.finalMessage();
    run.stream = null;
    addUsage(run, message.usage);
    collectResults(message.content, seen);
    if (message.stop_reason === "refusal") return { status: "refusal", report: null };
    if (message.stop_reason === "max_tokens") return { status: "truncated", report: null };

    // Zaxira modelga o‘tilgan bo‘lsa, rad etilgan urinishning chala chaqiruvlari hisobga olinmaydi
    const start = message.content.findLastIndex((b) => b.type === "fallback") + 1;
    const call = message.content.slice(start).find((b) => b.type === "tool_use" && b.name === REPORT_TOOL.name);
    if (call?.type === "tool_use") {
      const parsed = reportSchema.safeParse(call.input);
      return parsed.success ? { status: "ok", report: parsed.data } : { status: "error", report: null, error: "invalid_report" };
    }
    // Zaxira modelga o‘tilgan javobni qayta yuborish alohida qoidalarga bo‘ysunadi — shu yerda to‘xtaymiz
    if (round === WEB_LIMITS.maxContinuations || message.content.some((b) => b.type === "fallback")) break;
    // pause_turn: javob o‘zgarishsiz qaytariladi, server siklni davom ettiradi. Aks holda — hisobotni so‘raymiz
    messages.push({ role: "assistant", content: message.content });
    if (message.stop_reason !== "pause_turn") messages.push({ role: "user", content: "Call report_findings now with the pages you found." });
  }
  return { status: "error", report: null, error: "no_report" };
}

const MESSAGES: Partial<Record<string, string>> = {
  refusal: "AI bu izlashni bajara olmadi.",
  truncated: "Natija juda uzun bo‘lib, kesilib qoldi. Qayta urinib ko‘ring.",
  timeout: "Izlash juda uzoq davom etdi. Qayta urinib ko‘ring.",
  rate_limited: "AI xizmati hozir band. Bir daqiqadan so‘ng qayta urinib ko‘ring.",
};

function failure(error: unknown, run: Run, timedOut: boolean): Outcome {
  // Uzilgan qadamning shu paytgacha ishlatgani ham hisobga kiradi; xato bilan tugagan qidiruv to‘lanmaydi
  const current = run.stream?.currentMessage;
  addUsage(run, current?.usage ? { ...current.usage, server_tool_use: null } : null);
  run.searches += (current?.content ?? []).filter((b) => b.type === "web_search_tool_result" && Array.isArray(b.content)).length;
  run.stream?.abort();
  if (timedOut) return { status: "error", report: null, error: "timeout" };
  if (error instanceof Anthropic.RateLimitError) return { status: "error", report: null, error: "rate_limited" };
  if (error instanceof Anthropic.APIError) {
    console.error("[web-presence] API xatosi:", error.status, error.message);
    return { status: "error", report: null, error: `api_${error.status ?? "stream"}` };
  }
  console.error("[web-presence] kutilmagan xato:", error);
  return { status: "error", report: null, error: "internal" };
}

async function record(id: number, o: Outcome, run: Run, durationMs: number, result: PresenceResult | null) {
  try {
    await db
      .update(aiRequests)
      .set({
        status: o.status,
        inputTokens: run.usage.input,
        outputTokens: run.usage.output,
        cacheReadTokens: run.usage.cacheRead,
        cacheWriteTokens: run.usage.cacheWrite,
        webSearches: run.searches,
        costMicroUsd: costMicroUsd(run.usage) + run.searches * SEARCH_MICRO_USD,
        result,
        durationMs,
        error: o.error ?? null,
      })
      .where(eq(aiRequests.id, id));
  } catch (error) {
    console.error("[web-presence] natijani yozib bo‘lmadi:", error);
  }
}

/**
 * Izlash: NDJSON oqimi (lib/web-presence.ts → PresenceEvent). Tekshiruvlar (kirish, profil, limit) oqimdan oldin —
 * xato oddiy JSON javob bo‘lib qaytadi. Mijoz uzilsa ham izlash oxirigacha bajariladi va saqlanadi: sarflangan pul
 * behuda ketmasin, o‘qituvchi qaytib kelganda natija tayyor turadi. Faqat muddat (maxDurationMs) to‘xtatadi.
 */
export async function startPresenceSearch(userId: string) {
  const client = aiClient();
  if (!client) throw new AuthError("ai_unavailable");
  const who = await identity(userId);
  const id = await reserve(userId);
  const started = Date.now();
  const run: Run = { usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, searches: 0, stream: null };
  const deadline = AbortSignal.timeout(WEB_LIMITS.maxDurationMs);
  const encoder = new TextEncoder();
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (line: string) => {
        try {
          controller.enqueue(encoder.encode(`${line}\n`));
        } catch {
          // mijoz uzildi — izlash davom etadi
        }
      };
      const send = (event: PresenceEvent) => write(JSON.stringify(event));
      // Model uzoq o‘ylaganda ham ulanish jim qolmasin (nginx proxy_read_timeout uzib qo‘ymasligi uchun)
      heartbeat = setInterval(() => write(""), 15_000);

      let outcome: Outcome;
      let result: PresenceResult | null = null;
      try {
        if (who.orcid) send({ t: "step", v: "ORCID va OpenAlex’dan ilmiy ishlar olinmoqda" });
        const known = await loadKnown(who);
        const seen: Seen = new Map();
        outcome = await search(client, userId, teacherMessage(who.teacher, known, who.orcid), seen, deadline, run, send);
        if (outcome.report) result = buildResult(known, outcome.report, seen);
      } catch (error) {
        outcome = failure(error, run, deadline.aborted);
      }
      if (!result) send({ t: "error", message: MESSAGES[outcome.error ?? outcome.status] ?? "Izlash yakunlanmadi. Qayta urinib ko‘ring." });
      clearInterval(heartbeat);
      await record(id, outcome, run, Date.now() - started, result);
      send({ t: "done" });
      try {
        controller.close();
      } catch {
        // mijoz uzilgan
      }
    },
    cancel() {
      // Faqat ulanishni tirik saqlovchi signal to‘xtaydi; izlashning o‘zi oxirigacha bajariladi (yuqoriga qarang)
      clearInterval(heartbeat);
    },
  });
}

/** Sahifa va kabinet tugmasi: oxirgi muvaffaqiyatli natija, bugungi qolgan urinishlar, hozir ishlayaptimi */
export async function getPresence(userId: string) {
  const [[last], used] = await Promise.all([
    db
      .select({ result: aiRequests.result, searchedAt: aiRequests.createdAt })
      .from(aiRequests)
      .where(and(eq(aiRequests.userId, userId), eq(aiRequests.kind, "web"), eq(aiRequests.status, "ok"), isNotNull(aiRequests.result)))
      .orderBy(desc(aiRequests.createdAt))
      .limit(1),
    usage(userId),
  ]);
  return {
    result: last?.result ?? null,
    searchedAt: last?.searchedAt ?? null,
    remaining: used.cost >= AI_LIMITS.dailyBudgetMicroUsd ? 0 : Math.max(0, WEB_LIMITS.perDay - used.count),
    running: used.running > 0,
  };
}
