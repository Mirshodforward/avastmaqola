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

export function safeEqualString(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
