import "server-only";
import { and, desc, eq, getTableColumns, gt, inArray, lt, or, sql } from "drizzle-orm";
import type { FlowView } from "@/lib/auth-types";
import { maskUzPhone, normalizeUzPhone } from "@/lib/validation";
import { db, type Tx } from "../db";
import { authRequests, users, type AuthPurpose, type AuthRequest } from "../db/schema";
import { env } from "../env";
import { MESSAGES } from "../telegram/messages";
import { AUTH } from "./config";
import { deriveStartToken, generateOtp, hashOtp, newToken, safeEqualHex, sha256 } from "./crypto";
import { AuthError } from "./errors";
import type { RegisterInput } from "./schemas";
import { createSession } from "./tokens";
import { decideTelegramAccountChange } from "./telegram-policy";

export type ClientMeta = { ip: string | null; userAgent: string | null };
export type TelegramIds = { userId: number; chatId: number };
export type Notice = { chatId: number; text: string };

/** now() + N soniya. Barcha muddatlar baza soatida hisoblanadi. */
const nowPlus = (seconds: number) => sql`now() + make_interval(secs => ${seconds})`;

export function botUrlFor(flowToken: string): string {
  return `https://t.me/${env().TELEGRAM_BOT_USERNAME}?start=${deriveStartToken(flowToken)}`;
}

// ───────────── 1. Saytda jarayonni boshlash ─────────────

async function assertRateLimit(phone: string, ip: string | null) {
  const [counts] = await db
    .select({
      byPhone: sql<number>`(count(*) filter (where ${authRequests.phone} = ${phone}))::int`,
      byIp: sql<number>`(count(*) filter (where ${authRequests.ip} = ${ip}))::int`,
    })
    .from(authRequests)
    .where(
      and(
        gt(authRequests.createdAt, sql`now() - interval '1 hour'`),
        ip ? or(eq(authRequests.phone, phone), eq(authRequests.ip, ip)) : eq(authRequests.phone, phone),
      ),
    );
  if (
    counts.byPhone >= AUTH.maxFlowsPerPhonePerHour ||
    counts.byIp >= AUTH.maxFlowsPerIpPerHour
  ) {
    throw new AuthError("rate_limited");
  }
}

async function createFlow(values: {
  purpose: AuthPurpose;
  phone: string;
  ip: string | null;
  userId?: string;
  firstName?: string;
  lastName?: string;
}): Promise<string> {
  const flowToken = newToken();
  await db.insert(authRequests).values({
    ...values,
    flowTokenHash: sha256(flowToken),
    startTokenHash: sha256(deriveStartToken(flowToken)),
    expiresAt: nowPlus(AUTH.flowTtlSeconds),
  });
  return flowToken;
}

export async function startRegistration(input: RegisterInput, meta: ClientMeta) {
  await assertRateLimit(input.phone, meta.ip);

  const [taken] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.phone, input.phone))
    .limit(1);
  if (taken) throw new AuthError("phone_taken");

  return { flowToken: await createFlow({ purpose: "register", ...input, ip: meta.ip }) };
}

export async function startLogin(phone: string, meta: ClientMeta) {
  await assertRateLimit(phone, meta.ip);
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.phone, phone))
    .limit(1);
  if (!user) throw new AuthError("phone_not_registered");
  return { flowToken: await createFlow({ purpose: "login", phone, userId: user.id, ip: meta.ip }) };
}

async function loadFlow(flowToken: string) {
  const [row] = await db
    .select({
      ...getTableColumns(authRequests),
      alive: sql<boolean>`${authRequests.expiresAt} > now()`,
      codeAlive: sql<boolean>`coalesce(${authRequests.codeExpiresAt} > now(), false)`,
      codeSecondsLeft: sql<number>`greatest(0, ceil(extract(epoch from ${authRequests.codeExpiresAt} - now())))::int`,
      resendInSeconds: sql<number>`greatest(0, ceil(extract(epoch from ${authRequests.lastCodeSentAt} + make_interval(secs => ${AUTH.resendCooldownSeconds}) - now())))::int`,
    })
    .from(authRequests)
    .where(eq(authRequests.flowTokenHash, sha256(flowToken)))
    .limit(1);
  return row ?? null;
}

/** Brauzerga ko‘rsatiladigan holat (maxfiy maydonlarsiz). */
export async function getFlowView(flowToken: string): Promise<FlowView | null> {
  const flow = await loadFlow(flowToken);
  if (!flow) return null;
  const finished = flow.status === "verified" || flow.status === "failed";
  return {
    purpose: flow.purpose,
    status: flow.alive || finished ? flow.status : "expired",
    phoneMasked: maskUzPhone(flow.phone),
    botUrl: botUrlFor(flowToken),
    codeSecondsLeft: flow.status === "code_sent" ? flow.codeSecondsLeft : 0,
    resendInSeconds: flow.resendInSeconds,
    codesLeft: Math.max(0, AUTH.maxCodesPerFlow - flow.codesSent),
    attemptsLeft: Math.max(0, AUTH.maxCodeAttempts - flow.codeAttempts),
  };
}

// ───────────── 2. Telegram bot tomoni ─────────────

export type BindResult =
  | { kind: "bound"; purpose: AuthPurpose } // kontakt kerak
  | { kind: "code_sent"; code: string } // tanish akkaunt: kod darhol
  | { kind: "wait"; seconds: number } // kod yaqinda yuborilgan
  | { kind: "codes_exhausted" }
  | { kind: "invalid" };

/** Bot uchun jarayonning kerakli maydonlari va qayta yuborishgacha qolgan soniya */
const botFlowColumns = {
  id: authRequests.id,
  purpose: authRequests.purpose,
  status: authRequests.status,
  userId: authRequests.userId,
  telegramUserId: authRequests.telegramUserId,
  codesSent: authRequests.codesSent,
  resendInSeconds: sql<number>`greatest(0, ceil(extract(epoch from ${authRequests.lastCodeSentAt} + make_interval(secs => ${AUTH.resendCooldownSeconds}) - now())))::int`,
};
type BotFlow = Pick<AuthRequest, "id" | "purpose" | "status" | "userId" | "telegramUserId" | "codesSent"> & {
  resendInSeconds: number;
};

/** /start <token> (saytdagi «Kodni olish»): so‘rovni shu Telegram akkauntga bog‘laymiz. */
export async function bindTelegram(startToken: string, tg: TelegramIds): Promise<BindResult> {
  const [flow] = await db
    .select(botFlowColumns)
    .from(authRequests)
    .where(and(eq(authRequests.startTokenHash, sha256(startToken)), gt(authRequests.expiresAt, sql`now()`)))
    .limit(1);
  if (!flow) return { kind: "invalid" };
  // Kod yuborilgan jarayonni boshqa akkaunt egallay olmaydi; o‘sha akkaunt qayta bossa — yangi kod.
  // Havolasiz /start kod bermaydi: aks holda firibgar o‘zi boshlagan kirish kodini "botda Start bosing" deb so‘rab olardi
  if (flow.status === "code_sent") return reissueCode(flow, tg);
  return startOnTelegram(flow, tg);
}

async function startOnTelegram(flow: BotFlow, tg: TelegramIds): Promise<BindResult> {
  const [bound] = await db
    .update(authRequests)
    .set({ telegramUserId: tg.userId, telegramChatId: tg.chatId, status: "awaiting_contact" })
    .where(and(eq(authRequests.id, flow.id), inArray(authRequests.status, ["pending", "awaiting_contact"])))
    .returning({ id: authRequests.id });
  if (!bound) return { kind: "invalid" };

  // Kirish va akkaunt ro‘yxatdan o‘tishda tasdiqlangan o‘sha akkaunt bo‘lsa, kontakt qayta so‘ralmaydi:
  // raqam bu akkauntga ro‘yxatdan o‘tishda bog‘langan, kod faqat shu akkauntga boradi
  if (flow.purpose === "login" && flow.userId) {
    const [owner] = await db
      .select({ telegramUserId: users.telegramUserId })
      .from(users)
      .where(eq(users.id, flow.userId))
      .limit(1);
    if (owner?.telegramUserId === tg.userId) {
      const code = await issueCode(flow.id, "awaiting_contact", tg.userId);
      if (code) return { kind: "code_sent", code };
    }
  }
  return { kind: "bound", purpose: flow.purpose };
}

/** Kod yuborilgan jarayonda yangi kod: saytdagi «Kodni qayta yuborish» bilan bir xil oraliq va limit */
async function reissueCode(flow: BotFlow, tg: TelegramIds): Promise<BindResult> {
  if (flow.telegramUserId !== tg.userId) return { kind: "invalid" };
  if (flow.codesSent >= AUTH.maxCodesPerFlow) return { kind: "codes_exhausted" };
  if (flow.resendInSeconds > 0) return { kind: "wait", seconds: flow.resendInSeconds };
  const code = await issueCode(flow.id, "code_sent", tg.userId);
  return code ? { kind: "code_sent", code } : { kind: "wait", seconds: AUTH.resendCooldownSeconds };
}

/**
 * Yangi kod yaratadi. Shartlar UPDATE ichida: bir vaqtdagi ikki so‘rov ikkita kod yubormaydi,
 * qayta yuborishda oraliq va limit buzilmaydi. Jarayon hali ham kodni so‘ragan akkauntga bog‘langan
 * bo‘lishi shart: aks holda tekshiruv va UPDATE orasida havolani o‘z akkauntidan bosgan hujumchi
 * jarayonni o‘ziga o‘tkazib, keyin "qayta yuborish" bilan kodni olardi. Shartlar bajarilmasa — null.
 */
async function issueCode(
  flowId: string,
  from: "awaiting_contact" | "code_sent",
  telegramUserId: number,
): Promise<string | null> {
  const code = generateOtp();
  const [updated] = await db
    .update(authRequests)
    .set({
      status: "code_sent",
      codeHash: hashOtp(flowId, code),
      codeExpiresAt: nowPlus(AUTH.codeTtlSeconds),
      codeAttempts: 0,
      codesSent: sql`${authRequests.codesSent} + 1`,
      lastCodeSentAt: sql`now()`,
    })
    .where(
      and(
        eq(authRequests.id, flowId),
        eq(authRequests.status, from),
        eq(authRequests.telegramUserId, telegramUserId),
        gt(authRequests.expiresAt, sql`now()`),
        ...(from === "code_sent"
          ? [
              lt(authRequests.codesSent, AUTH.maxCodesPerFlow),
              sql`${authRequests.lastCodeSentAt} <= now() - make_interval(secs => ${AUTH.resendCooldownSeconds})`,
            ]
          : []),
      ),
    )
    .returning({ id: authRequests.id });
  return updated ? code : null;
}

export type ContactResult =
  | { kind: "code_sent"; code: string }
  | { kind: "no_flow" }
  | { kind: "phone_mismatch" }
  | { kind: "telegram_taken" }
  | { kind: "rejected"; message: string };

/** Foydalanuvchi o‘z kontaktini yubordi: raqamni solishtirib, kod yaratamiz. */
export async function acceptContact(tg: TelegramIds, contactPhone: string): Promise<ContactResult> {
  const [flow] = await db
    .select()
    .from(authRequests)
    .where(
      and(
        eq(authRequests.telegramUserId, tg.userId),
        eq(authRequests.status, "awaiting_contact"),
        gt(authRequests.expiresAt, sql`now()`),
      ),
    )
    .orderBy(desc(authRequests.createdAt))
    .limit(1);
  if (!flow) return { kind: "no_flow" };
  if (normalizeUzPhone(contactPhone) !== flow.phone) return { kind: "phone_mismatch" };

  // Bitta Telegram akkaunt faqat bitta profilga bog‘lanadi
  const [owner] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.telegramUserId, tg.userId))
    .limit(1);
  if (owner && owner.id !== flow.userId) return { kind: "telegram_taken" };

  if (flow.purpose === "login" && !owner) {
    // Raqam mos, lekin profil boshqa Telegram akkauntga bog‘langan
    const [user] = await db
      .select({ telegramUserId: users.telegramUserId })
      .from(users)
      .where(eq(users.id, flow.userId!))
      .limit(1);
    const decision = decideTelegramAccountChange({
      linkedTelegramId: user?.telegramUserId ?? null,
      incomingTelegramId: tg.userId,
    });
    if (decision.action === "reject") return { kind: "rejected", message: decision.message };
  }

  const code = await issueCode(flow.id, "awaiting_contact", tg.userId);
  return code ? { kind: "code_sent", code } : { kind: "no_flow" };
}

// ───────────── 3. Saytda kodni tasdiqlash ─────────────

export async function resendCode(flowToken: string): Promise<{ chatId: number; code: string }> {
  const flow = await loadFlow(flowToken);
  if (!flow || !flow.alive) throw new AuthError("flow_expired");
  if (flow.status === "failed") throw new AuthError("too_many_attempts");
  if (flow.status !== "code_sent" || flow.telegramChatId === null || flow.telegramUserId === null) {
    throw new AuthError("code_not_sent");
  }
  if (flow.codesSent >= AUTH.maxCodesPerFlow) throw new AuthError("too_many_codes");
  if (flow.resendInSeconds > 0) {
    throw new AuthError("resend_cooldown", { retryAfter: flow.resendInSeconds });
  }

  const code = await issueCode(flow.id, "code_sent", flow.telegramUserId);
  if (!code) throw new AuthError("resend_cooldown");
  return { chatId: flow.telegramChatId, code };
}

export async function verifyCode(flowToken: string, code: string, meta: ClientMeta) {
  const flow = await loadFlow(flowToken);
  if (!flow || !flow.alive) throw new AuthError("flow_expired");
  if (flow.status === "failed") throw new AuthError("too_many_attempts");
  if (flow.status !== "code_sent" || !flow.codeHash) throw new AuthError("code_not_sent");
  if (!flow.codeAlive) throw new AuthError("code_expired");

  if (!safeEqualHex(hashOtp(flow.id, code), flow.codeHash)) {
    const [row] = await db
      .update(authRequests)
      .set({
        codeAttempts: sql`${authRequests.codeAttempts} + 1`,
        // SET ichida ustunlarning ESKI qiymati ishlatiladi: 5-xato urinishda jarayon yopiladi
        status: sql`case when ${authRequests.codeAttempts} + 1 >= ${AUTH.maxCodeAttempts} then 'failed' else ${authRequests.status} end`,
      })
      .where(and(eq(authRequests.id, flow.id), eq(authRequests.status, "code_sent")))
      .returning({ attempts: authRequests.codeAttempts });
    const attemptsLeft = row ? Math.max(0, AUTH.maxCodeAttempts - row.attempts) : 0;
    throw new AuthError(attemptsLeft > 0 ? "wrong_code" : "too_many_attempts", { attemptsLeft });
  }

  return db.transaction(async (tx) => {
    // So‘rovni atomik "egallaymiz": bir vaqtda kelgan ikkinchi so‘rov bu yerdan o‘tolmaydi
    const [claimed] = await tx
      .update(authRequests)
      .set({ status: "verified", completedAt: sql`now()` })
      .where(
        and(
          eq(authRequests.id, flow.id),
          eq(authRequests.status, "code_sent"),
          gt(authRequests.codeExpiresAt, sql`now()`),
        ),
      )
      .returning();
    if (!claimed) throw new AuthError("code_expired");

    const { userId, notice } =
      claimed.purpose === "register"
        ? await createUserFromFlow(tx, claimed)
        : await completeLogin(tx, claimed);
    const session = await createSession(tx, userId, meta);
    return { session, notice };
  });
}

async function createUserFromFlow(tx: Tx, flow: AuthRequest) {
  const [user] = await tx
    .insert(users)
    .values({
      firstName: flow.firstName!,
      lastName: flow.lastName!,
      phone: flow.phone,
      telegramUserId: flow.telegramUserId,
    })
    .onConflictDoNothing()
    .returning({ id: users.id });
  // Kutish paytida shu raqam yoki Telegram bilan boshqa akkaunt yaratilgan bo‘lishi mumkin
  if (!user) throw new AuthError("already_registered");
  return { userId: user.id, notice: null };
}

async function completeLogin(
  tx: Tx,
  flow: AuthRequest,
): Promise<{ userId: string; notice: Notice | null }> {
  const [user] = await tx
    .select({ id: users.id, telegramUserId: users.telegramUserId })
    .from(users)
    .where(eq(users.id, flow.userId!))
    .limit(1);
  if (!user) throw new AuthError("phone_not_registered");
  if (flow.telegramUserId === null || user.telegramUserId === flow.telegramUserId) {
    return { userId: user.id, notice: null };
  }

  const decision = decideTelegramAccountChange({
    linkedTelegramId: user.telegramUserId,
    incomingTelegramId: flow.telegramUserId,
  });
  if (decision.action === "reject") throw new AuthError("telegram_mismatch");
  if (decision.action === "allow") return { userId: user.id, notice: null };

  await tx.update(users).set({ telegramUserId: flow.telegramUserId }).where(eq(users.id, user.id));
  const notice =
    decision.notifyPrevious && user.telegramUserId !== null
      ? { chatId: user.telegramUserId, text: MESSAGES.accountRelinked }
      : null;
  return { userId: user.id, notice };
}
