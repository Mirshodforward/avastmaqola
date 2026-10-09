import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "../db";
import { sessions, users } from "../db/schema";
import { AUTH, FLOW_COOKIE, FLOW_COOKIE_PATH, REFRESH_COOKIE, SESSION_COOKIE } from "./config";
import { parseRefreshToken, readAccessToken } from "./crypto";
import { AuthError } from "./errors";
import { accessCookieOptions, refreshCookieOptions, type SessionTokens } from "./tokens";

export type SessionUser = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  orcid: string | null;
  orcidVerified: boolean;
  role: string;
};

const secure = process.env.NODE_ENV === "production";

/**
 * Joriy foydalanuvchi (bitta so‘rov ichida bir marta o‘qiladi). Sessiya bo‘lmasa — null.
 * Access token muddati o‘tgan bo‘lsa, uni proxy.ts refresh token bilan allaqachon yangilagan bo‘ladi.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const access = readAccessToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!access) return null;

  // Imzo to‘g‘ri bo‘lsa ham sessiya qatori tekshiriladi: chiqish yoki o‘g‘irlikda token darhol ishlamay qoladi.
  // Muddat baza soati bilan: render paytida Date.now() o‘qilmaydi (Next 16 uni beqaror qiymat deb hisoblaydi)
  const [row] = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
      orcid: users.orcid,
      orcidVerifiedAt: users.orcidVerifiedAt,
      role: users.role,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(
      and(
        eq(sessions.id, access.sessionId),
        gt(sessions.expiresAt, sql`now()`),
        sql`${access.exp} > extract(epoch from now())`,
      ),
    )
    .limit(1);
  if (!row) return null;

  const { orcidVerifiedAt, ...user } = row;
  return { ...user, orcidVerified: orcidVerifiedAt !== null };
});

/** API route’lar uchun: sessiya bo‘lmasa 401. */
export async function requireApiUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("unauthorized");
  return user;
}

/**
 * VAQTINCHA (2026-10-09, loyiha egasining so‘rovi): admin va moderator panellari loginsiz ochiq, haqiqiy kirish
 * keyin o‘rnatiladi. Faqat `next dev`da — production build’da NODE_ENV=production, panellar yana faqat o‘z rollariga.
 */
export const ADMIN_OPEN = process.env.NODE_ENV === "development";

/** Maqolalarni ko‘rib chiqish va chop etish huquqi: moderator va admin */
export const canReview = (role: string | undefined) => role === "moderator" || role === "admin";

export async function requireApiModerator(): Promise<void> {
  if (ADMIN_OPEN) return;
  const user = await requireApiUser();
  if (!canReview(user.role)) throw new AuthError("forbidden");
}

/** Moderator panel: moderator va admin, boshqalarga 404 */
export async function requireModeratorPage(): Promise<void> {
  if (ADMIN_OPEN) {
    await connection();
    return;
  }
  const user = await requireUser();
  if (!canReview(user.role)) notFound();
}

export async function requireApiAdmin(): Promise<void> {
  if (ADMIN_OPEN) return;
  const user = await requireApiUser();
  if (user.role !== "admin") throw new AuthError("forbidden");
}

/** Admin sahifalari: boshqalarga 404 — bo‘lim borligini ham oshkor qilmaymiz. */
export async function requireAdminPage(): Promise<void> {
  if (ADMIN_OPEN) {
    await connection(); // production’dagidek har so‘rovda yangi ma’lumot bilan chiziladi
    return;
  }
  const user = await requireUser();
  if (user.role !== "admin") notFound();
}

/** Himoyalangan sahifalar uchun: sessiya bo‘lmasa /login’ga yo‘naltiradi. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function setSessionCookies(tokens: SessionTokens) {
  const store = await cookies();
  store.set(SESSION_COOKIE, tokens.accessToken, accessCookieOptions());
  store.set(REFRESH_COOKIE, tokens.refreshToken, refreshCookieOptions(tokens.expiresAt));
}

/** Chiqish: sessiya qatori o‘chiriladi — access va refresh token ikkalasi ham darhol yaroqsiz */
export async function destroyCurrentSession() {
  const store = await cookies();
  // Muddati o‘tgan bo‘lsa ham imzosi to‘g‘ri access token sessiyani aniqlashga yetadi
  const sessionId =
    readAccessToken(store.get(SESSION_COOKIE)?.value)?.sessionId ?? parseRefreshToken(store.get(REFRESH_COOKIE)?.value);
  if (sessionId) await db.delete(sessions).where(eq(sessions.id, sessionId));
  store.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  store.set(REFRESH_COOKIE, "", { path: "/", maxAge: 0 });
}

export async function setFlowCookie(token: string) {
  (await cookies()).set(FLOW_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: FLOW_COOKIE_PATH,
    maxAge: AUTH.flowTtlSeconds,
  });
}

export async function readFlowCookie(): Promise<string | null> {
  return (await cookies()).get(FLOW_COOKIE)?.value ?? null;
}

export async function clearFlowCookie() {
  (await cookies()).set(FLOW_COOKIE, "", { path: FLOW_COOKIE_PATH, maxAge: 0 });
}
