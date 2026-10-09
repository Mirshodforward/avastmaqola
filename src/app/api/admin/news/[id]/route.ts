import { AuthError } from "@/server/auth/errors";
import { requireApiAdmin } from "@/server/auth/session";
import { assertSameOrigin, errorResponse, readJson } from "@/server/http";
import { newsSchema, parseNewsId } from "@/server/news/schemas";
import { deleteNews, updateNews } from "@/server/news/service";

async function newsId(ctx: RouteContext<"/api/admin/news/[id]">) {
  const id = parseNewsId((await ctx.params).id);
  if (!id) throw new AuthError("not_found");
  return id;
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/news/[id]">) {
  try {
    assertSameOrigin(request);
    await requireApiAdmin();
    const id = await newsId(ctx);
    const { publishedAt } = await updateNews(id, await readJson(request, newsSchema));
    return Response.json({ ok: true, publishedAt });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, ctx: RouteContext<"/api/admin/news/[id]">) {
  try {
    assertSameOrigin(request);
    await requireApiAdmin();
    await deleteNews(await newsId(ctx));
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
