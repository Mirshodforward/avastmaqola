import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { BetaMessageStream } from "@anthropic-ai/sdk/lib/BetaMessageStream";
import type {
  BetaContentBlockParam,
  BetaMessageParam,
  BetaToolResultBlockParam,
  BetaUsage,
} from "@anthropic-ai/sdk/resources/beta/messages/messages";
import { and, eq, gt, sql } from "drizzle-orm";
import type { AiDraft, AiEvent } from "@/lib/ai";
import { EDITABLE_STATUSES } from "@/lib/article-rules";
import { getOwnArticle } from "../articles/service";
import { AuthError } from "../auth/errors";
import { db } from "../db";
import { aiRequests, type AiRequestStatus } from "../db/schema";
import { readStoredFile } from "../storage";
import { AI_LIMITS, AI_MODEL, aiClient, costMicroUsd, type AiUsage } from "./client";
import { PROPOSE_TOOL, SYSTEM_PROMPT } from "./prompt";
import { normalizeProposal, toolInputSchema, type AssistantRequest, type ToolInput } from "./schemas";

const CACHE = { type: "ephemeral" } as const;
/** Model taklifni bir necha qadamda (masalan, har til alohida) yozishi mumkin; cheksiz aylanmasin */
const MAX_ROUNDS = 3;

const pdfBlock = (data: string) =>
  ({ type: "document", source: { type: "base64", media_type: "application/pdf", data } }) as const;

/** PDF hajmi tokenlarda, pdfKey bo‘yicha (kalit har yuklashda yangi): har xabarda qayta sanalmaydi */
const pdfTokens = new Map<string, number>();

/** PDF base64’da; juda katta bo‘lsa null — model bu haqda o‘qituvchiga o‘zi aytadi */
async function loadPdf(client: Anthropic, key: string): Promise<string | null> {
  const data = (await readStoredFile("articles", key)).toString("base64");
  let tokens = pdfTokens.get(key);
  if (tokens === undefined) {
    try {
      ({ input_tokens: tokens } = await client.messages.countTokens({
        model: AI_MODEL,
        messages: [{ role: "user", content: [pdfBlock(data), { type: "text", text: "." }] }],
      }));
    } catch (error) {
      console.error("[ai] PDF tokenlarini sanab bo‘lmadi:", error);
      throw new AuthError("ai_failed");
    }
    if (pdfTokens.size >= 500) pdfTokens.clear();
    pdfTokens.set(key, tokens);
  }
  return tokens <= AI_LIMITS.maxPdfTokens ? data : null;
}

const today = sql`date_trunc('day', now() at time zone 'Asia/Tashkent') at time zone 'Asia/Tashkent'`;

/**
 * Kunlik limit (so‘rovlar soni va narxi) va "oldingi javob tugamadi" tekshiruvi; o‘tsa — statistika qatori
 * ochiladi. Qimmat ish (PDF o‘qish, model) faqat shundan keyin boshlanadi.
 */
async function reserve(userId: string, articleId: number) {
  return db.transaction(async (tx) => {
    // Bir akkauntning parallel so‘rovlari navbatma-navbat: hammasi "limit tugamagan" deb o‘tib ketmasin
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`ai:${userId}`}, 0))`);
    const [used] = await tx
      .select({
        count: sql<number>`(count(*) filter (where ${aiRequests.createdAt} >= ${today}))::int`,
        cost: sql<number>`(coalesce(sum(${aiRequests.costMicroUsd}) filter (where ${aiRequests.createdAt} >= ${today}), 0))::int`,
        // Server o‘chib qolsa "running" qator abadiy bloklamasin (so‘rov maxDurationMs’dan uzoq davom etmaydi)
        running: sql<number>`(count(*) filter (where ${aiRequests.status} = 'running' and ${aiRequests.createdAt} > now() - interval '5 minutes'))::int`,
      })
      .from(aiRequests)
      .where(and(eq(aiRequests.userId, userId), gt(aiRequests.createdAt, sql`now() - interval '2 days'`)));
    if (used.running > 0) throw new AuthError("ai_busy");
    if (used.count >= AI_LIMITS.perDay || used.cost >= AI_LIMITS.dailyBudgetMicroUsd) throw new AuthError("ai_limit");
    const [row] = await tx
      .insert(aiRequests)
      .values({ userId, articleId, model: AI_MODEL })
      .returning({ id: aiRequests.id });
    return { id: row.id, remaining: AI_LIMITS.perDay - used.count - 1 };
  });
}

type PdfState = "attached" | "too_large" | "none";

function formBlock(draft: AiDraft, pdf: PdfState) {
  const note = {
    attached: "",
    too_large:
      "\nThe teacher uploaded a PDF, but it is too large to attach. If you need the article, ask the teacher to paste its title, abstract and main text into the chat.",
    none: "\nNo PDF is uploaded yet.",
  }[pdf];
  return `<current_form>\n${JSON.stringify(draft, null, 2)}\n</current_form>${note}`;
}

/**
 * Suhbat stateless: tarix har so‘rovda klientdan keladi. PDF va birinchi xabar (unda maqola matni bo‘lishi
 * mumkin) har safar bir xil boshlanmada turadi — keyingi xabarlarda ular keshdan arzon o‘qiladi.
 * Formaning joriy holati faqat oxirgi xabarda (u har safar o‘zgaradi).
 */
function buildMessages(input: AssistantRequest, pdf: string | null, pdfState: PdfState) {
  const turns = [...input.history, { role: "user" as const, text: input.message }];
  return turns.map((turn, i): BetaMessageParam => {
    const content: BetaContentBlockParam[] = [];
    if (i === 0 && pdf) content.push(pdfBlock(pdf));
    content.push(i === 0 ? { type: "text", text: turn.text, cache_control: CACHE } : { type: "text", text: turn.text });
    // Tool-use siklining keyingi aylanishi butun so‘rovni qayta yuboradi — u keshdan o‘qilsin
    if (i === turns.length - 1) content.push({ type: "text", text: formBlock(input.draft, pdfState), cache_control: CACHE });
    return { role: turn.role, content };
  });
}

type Result = { status: AiRequestStatus; proposed: number; error?: string };
type Run = { usage: AiUsage; stream: BetaMessageStream | null; withPdf: boolean };

/** Fallback ishlasa, har urinish alohida hisoblanadi (usage.iterations) */
function addUsage(total: AiUsage, u: BetaUsage | null | undefined) {
  const parts: Partial<Record<"input_tokens" | "output_tokens" | "cache_read_input_tokens" | "cache_creation_input_tokens", number | null>>[] =
    u?.iterations?.length ? u.iterations : u ? [u] : [];
  for (const p of parts) {
    total.input += p.input_tokens ?? 0;
    total.output += p.output_tokens ?? 0;
    total.cacheRead += p.cache_read_input_tokens ?? 0;
    total.cacheWrite += p.cache_creation_input_tokens ?? 0;
  }
}

/**
 * Tool-use sikli: model propose_changes’ni bir yoki bir necha marta chaqiradi, har chaqiruvga "qo‘llandi"
 * javobi qaytariladi, model tugatguncha davom etadi. Har bir proposal hodisasi shu paytgacha yig‘ilgan
 * BUTUN taklif — klient avvalgisini bekor qilib, yangisini qo‘llaydi.
 */
async function converse(
  client: Anthropic,
  params: Omit<Parameters<Anthropic["beta"]["messages"]["stream"]>[0], "messages">,
  messages: BetaMessageParam[],
  draft: AiDraft,
  signal: AbortSignal,
  run: Run,
  send: (e: AiEvent) => void,
): Promise<Result> {
  const merged: ToolInput = {};
  let proposed = 0;
  let wroteText = false;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const stream = (run.stream = client.beta.messages.stream({ ...params, messages }, { signal }));
    let field = "";
    let roundText = false;
    stream.on("streamEvent", (event) => {
      if (event.type !== "content_block_start") return;
      const type = event.content_block.type;
      if (type === "thinking" || type === "redacted_thinking") send({ t: "status", v: "thinking" });
      else if (type === "text") send({ t: "status", v: "writing" });
      else if (type === "tool_use") {
        field = "";
        send({ t: "status", v: "filling" });
      }
    });
    stream.on("text", (delta) => {
      // Keyingi qadam matni oldingisiga yopishib qolmasin
      if (!roundText && wroteText) send({ t: "text", v: "\n\n" });
      roundText = wroteText = true;
      send({ t: "text", v: delta });
    });
    // Qaysi maydon yozilayotgani: taklif kelguncha o‘qituvchi jarayonni ko‘rib turadi
    stream.on("inputJson", (_delta, snapshot) => {
      const last = snapshot && typeof snapshot === "object" ? Object.keys(snapshot).at(-1) : undefined;
      if (last && last !== field) send({ t: "field", v: (field = last) });
    });

    const message = await stream.finalMessage();
    addUsage(run.usage, message.usage);
    // Rad etish yoki kesilgan javobda taklif chala bo‘lishi mumkin — hech narsa qo‘llanmaydi
    if (message.stop_reason === "refusal") {
      send({ t: "error", message: "AI bu so‘rovni bajara olmadi. So‘rovni boshqacha yozib ko‘ring." });
      return { status: "refusal", proposed: 0 };
    }
    if (message.stop_reason === "max_tokens") {
      send({ t: "error", message: "Javob juda uzun bo‘lib, kesilib qoldi. So‘rovni qismlarga bo‘lib yuboring." });
      return { status: "truncated", proposed: 0 };
    }

    const results: BetaToolResultBlockParam[] = [];
    for (const block of message.content) {
      if (block.type !== "tool_use") continue;
      // eager_input_streaming’da server kirishni tekshirmaydi: sxemaga mos kelmasa, model qayta yozadi
      const parsed = block.name === PROPOSE_TOOL.name ? toolInputSchema.safeParse(block.input) : null;
      if (parsed?.success) {
        Object.assign(merged, parsed.data);
        results.push({ type: "tool_result", tool_use_id: block.id, content: "Applied to the form." });
      } else {
        results.push({
          type: "tool_result",
          tool_use_id: block.id,
          is_error: true,
          content: JSON.stringify({ INVALID_JSON: JSON.stringify(block.input) }),
        });
      }
    }
    // Shu paytgacha yig‘ilgan taklif darhol yuboriladi: model yakuniy xulosani yozguncha forma to‘lib turadi
    if (results.some((r) => !r.is_error)) {
      const { proposal, dropped } = normalizeProposal(merged, draft);
      send({ t: "proposal", v: proposal, dropped });
      proposed = Object.keys(proposal).length;
    }
    // Zaxira modelga o‘tilgan javobni qayta yuborish alohida qoidalarga bo‘ysunadi — shu yerda to‘xtaymiz
    if (message.stop_reason !== "tool_use" || message.content.some((b) => b.type === "fallback")) break;
    messages.push({ role: "assistant", content: message.content }, { role: "user", content: results });
  }
  return { status: "ok", proposed };
}

function failed(error: unknown, run: Run, send: (e: AiEvent) => void, timedOut: boolean): Result {
  // Uzilgan qadamning shu paytgacha ishlatgan tokenlari ham hisobga kiradi
  addUsage(run.usage, run.stream?.currentMessage?.usage);
  if (error instanceof Anthropic.APIUserAbortError && !timedOut) return { status: "aborted", proposed: 0 };

  let code = "internal";
  let message = "AI javobida xatolik yuz berdi. Qayta urinib ko‘ring.";
  if (timedOut) {
    code = "timeout";
    message = "Javob juda uzoq davom etdi. So‘rovni qisqaroq qilib qayta yuboring.";
  } else if (error instanceof Anthropic.RateLimitError) {
    code = "rate_limited";
    message = "AI xizmati hozir band. Bir daqiqadan so‘ng qayta urinib ko‘ring.";
  } else if (error instanceof Anthropic.APIError) {
    code = `api_${error.status ?? "stream"}`;
    message = "AI xizmati javob bermadi. Birozdan so‘ng qayta urinib ko‘ring.";
    console.error("[ai] API xatosi:", error.status, error.message);
  } else if (error instanceof Anthropic.AnthropicError) {
    // eager_input_streaming: model yozgan taklif JSON sifatida o‘qilmadi
    code = "invalid_json";
    message = "AI taklifini o‘qib bo‘lmadi. Qayta urinib ko‘ring.";
  } else {
    console.error("[ai] kutilmagan xato:", error);
  }
  send({ t: "error", message });
  return { status: "error", proposed: 0, error: code };
}

async function record(id: number, r: Result, run: Run, durationMs: number) {
  try {
    await db
      .update(aiRequests)
      .set({
        status: r.status,
        withPdf: run.withPdf,
        inputTokens: run.usage.input,
        outputTokens: run.usage.output,
        cacheReadTokens: run.usage.cacheRead,
        cacheWriteTokens: run.usage.cacheWrite,
        costMicroUsd: costMicroUsd(run.usage),
        proposedFields: r.proposed,
        durationMs,
        error: r.error ?? null,
      })
      .where(eq(aiRequests.id, id));
  } catch (error) {
    console.error("[ai] statistikani yozib bo‘lmadi:", error);
  }
}

/**
 * O‘qituvchining xabariga javob: NDJSON oqimi (lib/ai.ts → AiEvent). Tekshiruvlar (kirish, maqola egasi,
 * limit) oqim boshlanishidan oldin — xato oddiy JSON javob bo‘lib qaytadi.
 */
export async function startAssistant(userId: string, articleId: number, input: AssistantRequest, signal: AbortSignal) {
  const client = aiClient();
  if (!client) throw new AuthError("ai_unavailable");
  const own = await getOwnArticle(userId, articleId);
  if (!own) throw new AuthError("not_found");
  if (!EDITABLE_STATUSES.includes(own.article.status)) throw new AuthError("state_conflict");

  const { id, remaining } = await reserve(userId, articleId);
  const started = Date.now();
  const run: Run = { usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, stream: null, withPdf: false };
  let pdf: string | null = null;
  try {
    pdf = own.article.pdfKey ? await loadPdf(client, own.article.pdfKey) : null;
  } catch (error) {
    await record(id, { status: "error", proposed: 0, error: "pdf" }, run, Date.now() - started);
    throw error;
  }
  run.withPdf = pdf !== null;
  const pdfState: PdfState = pdf ? "attached" : own.article.pdfKey ? "too_large" : "none";
  // Mijoz uzilsa yoki so‘rov juda cho‘zilsa model to‘xtatiladi
  const deadline = AbortSignal.timeout(AI_LIMITS.maxDurationMs);
  const abort = AbortSignal.any([signal, deadline]);
  const encoder = new TextEncoder();
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (line: string) => {
        try {
          controller.enqueue(encoder.encode(`${line}\n`));
        } catch {
          // mijoz uzildi — oqim allaqachon yopilgan
        }
      };
      const send = (event: AiEvent) => write(JSON.stringify(event));
      // Model uzoq o‘ylaganda ham ulanish jim qolmasin (nginx proxy_read_timeout uzib qo‘ymasligi uchun)
      heartbeat = setInterval(() => write(""), 15_000);

      let result: Result;
      try {
        result = await converse(
          client,
          {
            model: AI_MODEL,
            max_tokens: AI_LIMITS.maxOutputTokens,
            // Xavfsizlik klassifikatori rad etsa, so‘rov server tomonida tavsiya etilgan zaxira modelda bajariladi
            betas: ["server-side-fallback-2026-07-01"],
            fallbacks: "default",
            output_config: { effort: "medium" },
            system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: CACHE }],
            tools: [PROPOSE_TOOL],
            metadata: { user_id: userId },
          },
          buildMessages(input, pdf, pdfState),
          input.draft,
          abort,
          run,
          send,
        );
      } catch (error) {
        result = failed(error, run, send, deadline.aborted && !signal.aborted);
      }
      clearInterval(heartbeat);
      await record(id, result, run, Date.now() - started);
      send({ t: "done", remaining });
      try {
        controller.close();
      } catch {
        // mijoz uzilgan
      }
    },
    cancel() {
      clearInterval(heartbeat);
      run.stream?.abort();
    },
  });
}
