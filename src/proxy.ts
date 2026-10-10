import { NextResponse, type NextRequest } from "next/server";
import { REFRESH_COOKIE, SESSION_COOKIE } from "@/server/auth/config";
import { verifyAccessToken } from "@/server/auth/crypto";
import { accessCookieOptions, refreshCookieOptions, refreshSession, type SessionTokens } from "@/server/auth/tokens";

/** Sessiya kerak bo‘lgan yo‘llar (kabinet, admin, API, kirish). Ommaviy sahifalar sessiyani o‘qimaydi — token yozilmaydi */
const SESSION_PATHS = /^\/(dashboard|admin|moderator|api|login|register)(\/|$)/;
/** Ommaviy sahifa emas, til prefiksi ham yo‘q: maqola PDF’i */
const NOT_LOCALIZED = /^\/maqola\/[^/]+\/pdf$/;

/**
 * 1) Sessiya yo‘llari — tokenni yangilash (pastda).
 * 2) Ommaviy sahifalar uch tilda (src/app/[lang]): o‘zbekchasi prefikssiz — "/maqolalar" ichkarida "/uz/maqolalar" ga
 *    rewrite qilinadi (Scholar va eski havolalardagi manzillar o‘zgarmaydi); "/uz/..." esa prefikssiz manzilga 308.
 *    "/ru/..." va "/en/..." — o‘zgarishsiz.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (SESSION_PATHS.test(pathname)) return refresh(request);
  if (NOT_LOCALIZED.test(pathname)) return NextResponse.next();

  const first = pathname.split("/")[1];
  if (first === "ru" || first === "en") return NextResponse.next();
  const url = request.nextUrl.clone();
  if (first === "uz") {
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }
  url.pathname = pathname === "/" ? "/uz" : `/uz${pathname}`;
  return NextResponse.rewrite(url);
}

/**
 * Sessiyani yangilash. Access token (15 daqiqa) yaroqli bo‘lsa — hech narsa qilinmaydi (bazaga bormaydi).
 * Muddati o‘tgan bo‘lsa, refresh token bilan yangi juftlik olinadi: brauzerga Set-Cookie, shu so‘rovning o‘ziga esa
 * yangi Cookie sarlavhasi — sahifa va API yangi sessiyani darhol ko‘radi. Server Component cookie yoza olmaydi,
 * shuning uchun bu ish shu yerda.
 */
async function refresh(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken || verifyAccessToken(request.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();

  let tokens: SessionTokens | null;
  try {
    tokens = await refreshSession(refreshToken);
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
  // Hammasi, faqat Next ichki yo‘llari ("/_next", "/__nextjs…"), media fayllar va nuqtali yo‘llar (favicon.ico,
  // sitemap.xml, robots.txt, rasmlar) bundan mustasno
  matcher: ["/((?!_|media/|.*\\..*).*)"],
};
