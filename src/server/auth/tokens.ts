import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, gt, sql } from "drizzle-orm";
import { db, type Db, type Tx } from "../db";
import { sessions } from "../db/schema";
import { AUTH } from "./config";
import { newToken, nextRefreshToken, parseRefreshToken, sha256, signAccessToken, signRefreshToken } from "./crypto";

// cookies() ga bog‘liq emas: proxy (har so‘rov oldidan) va route handler’lar bir xil ishlatadi

const secure = process.env.NODE_ENV === "production";

export type SessionTokens = { accessToken: string; refreshToken: string; expiresAt: Date };

export const accessCookieOptions = () =>
  ({ httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: AUTH.accessTtlSeconds }) as const;

/** Refresh cookie sessiya bilan birga tugaydi (kirishdan 7 kun) — keyin brauzer uni o‘chiradi va login so‘raladi */
export const refreshCookieOptions = (expiresAt: Date) =>
  ({ httpOnly: true, secure, sameSite: "lax", path: "/", expires: expiresAt }) as const;

const accessFor = (sessionId: string) => signAccessToken(sessionId, AUTH.accessTtlSeconds);

export async function createSession(
  executor: Db | Tx,
  userId: string,
  meta: { ip: string | null; userAgent: string | null },
): Promise<SessionTokens> {
  // Token sessiya id’sini o‘z ichiga oladi, shuning uchun id oldindan yaratiladi
  const id = randomUUID();
  const refreshToken = signRefreshToken(id, newToken());
  const [row] = await executor
    .insert(sessions)
    .values({
      id,
      userId,
      tokenHash: sha256(refreshToken),
      expiresAt: sql`now() + make_interval(days => ${AUTH.sessionTtlDays})`,
      ip: meta.ip,
      userAgent: meta.userAgent?.slice(0, 300) ?? null,
    })
    .returning({ expiresAt: sessions.expiresAt });
  return { accessToken: accessFor(id), refreshToken, expiresAt: row.expiresAt };
}

/**
 * Refresh token bilan yangi juftlik (rotation). Har yangilashda refresh token almashadi.
 * - joriy token → yangi access + keyingi refresh;
 * - oldingi token qisqa oraliqda (bir nechta tab, javobi yo‘qolgan so‘rov) → aynan joriy token qayta beriladi;
 * - shu sessiyaning boshqa har qanday eski tokeni → kimdir eski nusxani ishlatyapti (o‘g‘irlik): sessiya yopiladi.
 * null — qayta kirish kerak (soxta token, muddat tugagan, chiqilgan yoki o‘g‘irlik aniqlangan).
 */
export async function refreshSession(refreshToken: string): Promise<SessionTokens | null> {
  const sessionId = parseRefreshToken(refreshToken);
  if (!sessionId) return null;
  const hash = sha256(refreshToken);
  const next = nextRefreshToken(sessionId, refreshToken);

  // Shart UPDATE ichida: bir vaqtdagi ikki so‘rovdan faqat bittasi almashtiradi
  const [rotated] = await db
    .update(sessions)
    .set({ tokenHash: sha256(next), prevTokenHash: hash, rotatedAt: sql`now()` })
    .where(and(eq(sessions.id, sessionId), eq(sessions.tokenHash, hash), gt(sessions.expiresAt, sql`now()`)))
    .returning({ expiresAt: sessions.expiresAt });
  if (rotated) return { accessToken: accessFor(sessionId), refreshToken: next, expiresAt: rotated.expiresAt };

  const [session] = await db
    .select({
      tokenHash: sessions.tokenHash,
      prevTokenHash: sessions.prevTokenHash,
      expiresAt: sessions.expiresAt,
      fresh: sql<boolean>`${sessions.rotatedAt} > now() - make_interval(secs => ${AUTH.refreshGraceSeconds})`,
    })
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, sql`now()`)))
    .limit(1);
  if (!session) return null;
  if (session.fresh && session.prevTokenHash === hash && session.tokenHash === sha256(next)) {
    return { accessToken: accessFor(sessionId), refreshToken: next, expiresAt: session.expiresAt };
  }

  await db.delete(sessions).where(eq(sessions.id, sessionId));
  console.warn("[auth] eskirgan refresh token qayta ishlatildi — sessiya yopildi:", sessionId);
  return null;
}
