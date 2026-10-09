import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { NextResponse, after, type NextRequest } from "next/server";
import { articleTag } from "@/server/articles/public";
import { articleUrl } from "@/server/articles/seo";
import { safeEqualString } from "@/server/auth/crypto";
import { getCurrentUser } from "@/server/auth/session";
import { notifyAdmins, notifyUser } from "@/server/notify";
import { siteUrl } from "@/server/site";
import { zenodoConfig } from "@/server/zenodo/client";
import { ZENODO_COOKIE, ZENODO_COOKIE_PATH, parseFlowCookie, runDeposit, zenodoState } from "@/server/zenodo/service";

/**
 * Zenodo ruxsat sahifasidan qaytish (ro‘yxatdan o‘tgan yagona redirect URI). Joylash shu so‘rovning o‘zida bajariladi
 * (odatda 5–30 soniya), keyin o‘qituvchi maqola sahifasiga qaytadi. JSON qaytarmaydi.
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const flow = parseFlowCookie((await cookies()).get(ZENODO_COOKIE)?.value);
  // Faqat o‘zimizning qat’iy yo‘llar (ochiq redirect yo‘q); oqim cookie’si har qanday natijada o‘chadi
  const back = (path: string) => {
    const res = NextResponse.redirect(new URL(path, siteUrl()), 303);
    res.cookies.set(ZENODO_COOKIE, "", { path: ZENODO_COOKIE_PATH, maxAge: 0 });
    return res;
  };

  const user = await getCurrentUser();
  if (!user) return back("/login");
  const cfg = zenodoConfig();
  if (!cfg || !flow) return back("/dashboard");
  const page = `/dashboard/articles/${flow.articleId}`;
  // Soxta yoki eski state, boshqa foydalanuvchi, tashqaridan qo‘yilgan cookie — Zenodo’ga so‘rov yuborilmaydi
  if (!safeEqualString(q.get("state") ?? "", zenodoState(user.id, flow.articleId, flow.nonce, flow.hash))) {
    return back(`${page}?zenodo=expired`);
  }
  if (q.has("error")) return back(`${page}?zenodo=denied`);
  const code = q.get("code");
  if (!code) return back(`${page}?zenodo=expired`);

  try {
    const result = await runDeposit(cfg, user, flow, code);
    if (result.published) {
      const { doi, recordUrl, title } = result.published;
      revalidateTag(articleTag(flow.articleId), { expire: 0 });
      after(async () => {
        // Diskdagi ISR nusxasi darhol yangilanadi (faqat shu sahifa o‘zgardi)
        await fetch(articleUrl(flow.articleId)).catch(() => undefined);
        await notifyUser(user.id, `Maqolangiz Zenodo’ga joylandi: «${title}».\nDOI: ${doi}\n${recordUrl}`);
      });
    }
    const alert = result.adminAlert;
    if (alert) after(() => notifyAdmins(alert));
    return back(result.flag ? `${page}?zenodo=${result.flag}` : page);
  } catch (error) {
    unstable_rethrow(error);
    console.error("[zenodo] callback:", error);
    return back(`${page}?zenodo=failed`);
  }
}
