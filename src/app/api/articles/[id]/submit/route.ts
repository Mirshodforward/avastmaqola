import { after } from "next/server";
import { titleIn } from "@/lib/article-rules";
import { parseArticleId } from "@/server/articles/schemas";
import { submitArticle } from "@/server/articles/service";
import { AuthError } from "@/server/auth/errors";
import { requireApiUser } from "@/server/auth/session";
import { assertSameOrigin, errorResponse } from "@/server/http";
import { notifyAdmins } from "@/server/notify";
import { siteUrl } from "@/server/site";

export async function POST(request: Request, ctx: RouteContext<"/api/articles/[id]/submit">) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    const id = parseArticleId((await ctx.params).id);
    if (!id) throw new AuthError("not_found");

    const { article } = await submitArticle(user.id, id);
    after(() =>
      notifyAdmins(
        `Yangi maqola ko‘rib chiqishni kutmoqda: №${id} «${titleIn(article)}» — ${user.firstName} ${user.lastName}.\n` +
          `${siteUrl()}/admin/articles/${id}`,
      ),
    );
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
