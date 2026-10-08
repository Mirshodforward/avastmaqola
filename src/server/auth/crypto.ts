import "server-only";
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { env } from "../env";

/** 256 bitli tasodifiy token, base64url (43 belgi). */
export function newToken(): string {
  return randomBytes(32).toString("base64url");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(value: string) {
  return createHmac("sha256", env().AUTH_SECRET).update(value);
}

/**
 * Telegram `start` parametri flow tokenidan hosil qilinadi (43 belgi, [A-Za-z0-9_-]).
 * Cookie’ni bilgan server bot havolasini qayta tiklay oladi, lekin havoladan cookie’ni tiklab bo‘lmaydi.
 */
export function deriveStartToken(flowToken: string): string {
  return hmac(`tg-start:${flowToken}`).digest("base64url");
}

export function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/**
 * 6 xonali kodni oddiy sha256 bilan saqlash befoyda — 10^6 variantni bir zumda sanab chiqish mumkin.
 * Shuning uchun sirli kalitli HMAC ishlatamiz va kodni aynan shu so‘rovga bog‘laymiz.
 */
export function hashOtp(requestId: string, code: string): string {
  return hmac(`otp:${requestId}:${code}`).digest("hex");
}

export function safeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * Access token: `{sessionId}.{muddat (unix soniya)}.{HMAC}`. Imzo bazasiz tekshiriladi (proxy har so‘rovda bazaga
 * bormasligi uchun), lekin foydalanuvchi o‘qilganda sessiya qatori baribir tekshiriladi — chiqish darhol ishlaydi.
 */
export function signAccessToken(sessionId: string, ttlSeconds: number): string {
  const payload = `${sessionId}.${Math.floor(Date.now() / 1000) + ttlSeconds}`;
  return `${payload}.${hmac(`access:${payload}`).digest("base64url")}`;
}

/** Faqat imzoni tekshiradi: sessiya id va muddat (unix soniya). Muddatni chaqiruvchi tekshiradi. */
export function readAccessToken(token: string | undefined): { sessionId: string; exp: number } | null {
  const parts = token?.split(".");
  if (parts?.length !== 3) return null;
  const [sessionId, exp, signature] = parts;
  if (!/^\d+$/.test(exp)) return null;
  const expected = hmac(`access:${sessionId}.${exp}`).digest("base64url");
  return safeEqualString(signature, expected) ? { sessionId, exp: Number(exp) } : null;
}

/** Imzo to‘g‘ri va muddati o‘tmagan bo‘lsa — sessiya id (proxy uchun; render emas, Date.now() mumkin) */
export function verifyAccessToken(token: string | undefined): string | null {
  const access = readAccessToken(token);
  return access && access.exp > Date.now() / 1000 ? access.sessionId : null;
}

/**
 * Refresh token: `{sessionId}.{tasodifiy}.{HMAC}`. Imzo uni server bergani, sessionId esa qaysi sessiyaniki ekanini
 * bildiradi — shu sessiyaning HAR QANDAY eskirgan tokeni kelsa, o‘g‘irlik aniqlanadi (faqat bitta oldingisi emas).
 */
export function signRefreshToken(sessionId: string, random: string): string {
  const payload = `${sessionId}.${random}`;
  return `${payload}.${hmac(`refresh:${payload}`).digest("base64url")}`;
}

/** Imzo to‘g‘ri bo‘lsa — sessiya id, aks holda null (soxta yoki eski formatdagi token) */
export function parseRefreshToken(token: string | undefined): string | null {
  const parts = token?.split(".");
  if (parts?.length !== 3) return null;
  const [sessionId, random, signature] = parts;
  if (!/^[0-9a-f-]{36}$/.test(sessionId)) return null;
  return safeEqualString(signature, hmac(`refresh:${sessionId}.${random}`).digest("base64url")) ? sessionId : null;
}

/**
 * Keyingi refresh token oldingisidan aniqlanadi (sirli kalit bilan): parallel so‘rov yoki javobi yo‘qolgan brauzer
 * oldingi tokenni qisqa oraliqda yuborsa, unga aynan joriy tokenni qayta berish mumkin.
 */
export function nextRefreshToken(sessionId: string, current: string): string {
  return signRefreshToken(sessionId, hmac(`refresh-next:${current}`).digest("base64url"));
}

export function safeEqualString(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
