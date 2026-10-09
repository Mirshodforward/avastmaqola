import { NextResponse, type NextRequest } from "next/server";
import { REFRESH_COOKIE, SESSION_COOKIE } from "@/server/auth/config";
import { verifyAccessToken } from "@/server/auth/crypto";
import { accessCookieOptions, refreshCookieOptions, refreshSession, type SessionTokens } from "@/server/auth/tokens";

/**
 * Sessiyani yangilash. Access token (15 daqiqa) yaroqli bo‘lsa — hech narsa qilinmaydi (bazaga bormaydi).
 * Muddati o‘tgan bo‘lsa, refresh token bilan yangi juftlik olinadi: brauzerga Set-Cookie, shu so‘rovning o‘ziga esa
 * yangi Cookie sarlavhasi — sahifa va API yangi sessiyani darhol ko‘radi. Server Component cookie yoza olmaydi,
 * shuning uchun bu ish shu yerda.
 */
export async function proxy(request: NextRequest) {
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refresh || verifyAccessToken(request.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();

  let tokens: SessionTokens | null;
  try {
    tokens = await refreshSession(refresh);
  } catch (error) {
    // Baza vaqtincha ishlamasa sahifa yiqilmasin: cookie’larga tegmaymiz, keyingi so‘rov yana urinadi
    console.error("[auth] sessiyani yangilab bo‘lmadi:", error);
    return NextResponse.next();
  }

  if (tokens) {
    request.cookies.set(SESSION_COOKIE, tokens.accessToken);
    request.cookies.set(REFRESH_COOKIE, tokens.refreshToken);
  } else {
    // Muddat tugagan, chiqilgan yoki o‘g‘irlik aniqlangan: ikkala cookie o‘chadi — himoyalangan sahifa login so‘raydi
    request.cookies.delete(SESSION_COOKIE);
    request.cookies.delete(REFRESH_COOKIE);
  }
  const response = NextResponse.next({ request: { headers: request.headers } });
  if (tokens) {
    response.cookies.set(SESSION_COOKIE, tokens.accessToken, accessCookieOptions());
    response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, refreshCookieOptions(tokens.expiresAt));
  } else {
    response.cookies.delete(SESSION_COOKIE);
    response.cookies.delete(REFRESH_COOKIE);
  }
  // Token yozilgan javob hech qachon umumiy keshga (CDN, nginx) tushmasin — aks holda boshqalarga berilib qolardi
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  // Faqat sessiya kerak bo‘lgan yo‘llar. Ommaviy (keshlanadigan) sahifalar sessiyani o‘qimaydi — ularga token yozilmaydi
  matcher: ["/dashboard/:path*", "/admin/:path*", "/moderator/:path*", "/api/:path*", "/login", "/register"],
};
