import { after } from "next/server";
import { reviewArticle } from "@/server/articles/review";
import { parseArticleId, reviewSchema } from "@/server/articles/schemas";
import { articleUrl } from "@/server/articles/seo";
import { AuthError } from "@/server/auth/errors";
import { requireApiAdmin } from "@/server/auth/session";
import { assertSameOrigin, errorResponse, readJson } from "@/server/http";
import { notifyUser } from "@/server/notify";
import { siteUrl } from "@/server/site";
import { warmAuthorPages } from "@/server/warm";

export async function POST(request: Request, ctx: RouteContext<"/api/admin/articles/[id]/review">) {
  try {
    assertSameOrigin(request);
    await requireApiAdmin();
    const id = parseArticleId((await ctx.params).id);
    if (!id) throw new AuthError("not_found");
    const { action, note, submittedAt } = await readJson(request, reviewSchema);

    const { userId, title } = await reviewArticle(id, action, note, submittedAt);
    const editUrl = `${siteUrl()}/dashboard/articles/${id}`;
    const message = {
      approve: `Maqolangiz chop etildi: «${title}».\n${articleUrl(id)}`,
      reject: `Maqolangizni tuzatish kerak: «${title}».\nIzoh: ${note}\n${editUrl}`,
      unpublish: `Maqolangiz saytdan vaqtincha olib tashlandi: «${title}».\nSabab: ${note}\n${editUrl}`,
    }[action];

    after(async () => {
      // Avval sahifalar (Telegram yoki baza xatosi buni to‘xtatmasin): maqolaning o‘zi, muallif profili va boshqa
      // maqolalari. Chop etishda birinchi bot tayyor HTML oladi; olib tashlashda diskdagi eski nusxa 404 bilan almashadi
      if (action !== "reject") await warmAuthorPages(userId, [articleUrl(id)]).catch(() => undefined);
      await notifyUser(userId, message);
    });
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
