import "server-only";
import Anthropic from "@anthropic-ai/sdk";

export const AI_MODEL = "claude-opus-5-5";

export const AI_LIMITS = {
  /** Bir o‘qituvchiga Toshkent vaqti bo‘yicha kuniga */
  perDay: 30,
  /** Bundan katta PDF (taxminan 50 sahifadan ortiq) modelga yuborilmaydi: narx va kontekst chegarasi */
  maxPdfTokens: 150_000,
  maxOutputTokens: 32_000,
  /** Chatga joylashtirilgan maqola matni */
  messageMax: 100_000,
  /** Model javobi tarixda: haqiqiy javoblar 2-6 gap — uzunini klient soxtalashtirgan */
  replyMax: 8_000,
  /** Bitta so‘rovdagi butun suhbat (bitta maqola matni + savollar) */
  conversationMax: 150_000,
  /** Avvalgi xabarlar: birinchi juftlik (unda maqola matni bo‘lishi mumkin) + oxirgilari */
  historyMax: 12,
  bodyMaxBytes: 1024 * 1024,
  /** Kunlik xarajat chegarasi (1 USD = 1 000 000): so‘rovlar soni emas, narx bo‘yicha himoya */
  dailyBudgetMicroUsd: 5_000_000,
  /** Bitta so‘rovning eng uzun davomi: "bir vaqtda bitta javob" himoyasi (5 daqiqa) undan uzun */
  maxDurationMs: 4 * 60_000,
} as const;

// claude-opus-5-5 narxlari, USD / 1M token. 1M tokenga $X = tokeniga X mikrodollar
const PRICE = { input: 4, output: 20, cacheWrite: 5, cacheRead: 0.2 };

export type AiUsage = { input: number; output: number; cacheRead: number; cacheWrite: number };

export function costMicroUsd(u: AiUsage): number {
  return Math.round(
    u.input * PRICE.input + u.output * PRICE.output + u.cacheWrite * PRICE.cacheWrite + u.cacheRead * PRICE.cacheRead,
  );
}

let client: Anthropic | null | undefined;

/** Kalit .env.local’dagi CLAUDE-API-KEY (yoki standart ANTHROPIC_API_KEY). Kalit bo‘lmasa AI yordamchi o‘chiq. */
export function aiClient(): Anthropic | null {
  if (client === undefined) {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env["CLAUDE-API-KEY"];
    client = apiKey ? new Anthropic({ apiKey, timeout: 5 * 60_000 }) : null;
  }
  return client;
}
