import { ARTICLE_LIMITS } from "@/lib/article-rules";
import { parseArticleId } from "@/server/articles/schemas";
import { uploadPdf } from "@/server/articles/service";
import { AuthError } from "@/server/auth/errors";
import { requireApiUser } from "@/server/auth/session";
import { assertBodySize, assertSameOrigin, errorResponse } from "@/server/http";

export async function PUT(request: Request, ctx: RouteContext<"/api/articles/[id]/pdf">) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    const id = parseArticleId((await ctx.params).id);
    if (!id) throw new AuthError("not_found");
    // Katta faylni xotiraga o‘qishdan oldin rad etamiz
    assertBodySize(request, ARTICLE_LIMITS.pdfMaxBytes + 64 * 1024, "file_too_large");
    const file = (await request.formData()).get("file");
    if (!(file instanceof File)) throw new AuthError("file_invalid");

    const { pdfBytes } = await uploadPdf(user.id, id, file);
    return Response.json({ ok: true, pdfBytes });
  } catch (error) {
    return errorResponse(error);
  }
}
