import { after } from "next/server";
import { titleIn } from "@/lib/article-rules";
import { parseArticleId } from "@/server/articles/schemas";
import { submitArticle } from "@/server/articles/service";
import { AuthError } from "@/server/auth/errors";
import { requireApiUser } from "@/server/auth/session";
import { assertSameOrigin, errorResponse } from "@/server/http";
import { notifyRole } from "@/server/notify";
import { siteUrl } from "@/server/site";

export async function POST(request: Request, ctx: RouteContext<"/api/articles/[id]/submit">) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    const id = parseArticleId((await ctx.params).id);
    if (!id) throw new AuthError("not_found");

    const { article } = await submitArticle(user.id, id);
    const text = `Yangi maqola ko‘rib chiqishni kutmoqda: №${id} «${titleIn(article)}» — ${user.firstName} ${user.lastName}.\n`;
    // Har kimga o‘zi ocha oladigan sahifa: moderator /admin’ni ko‘rmaydi
    after(() =>
      Promise.all([
        notifyRole("admin", `${text}${siteUrl()}/admin/articles/${id}`),
        notifyRole("moderator", `${text}${siteUrl()}/moderator?view=${id}`),
      ]),
    );
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
