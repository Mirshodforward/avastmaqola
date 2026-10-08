import { createDraft } from "@/server/articles/service";
import { requireApiUser } from "@/server/auth/session";
import { assertSameOrigin, errorResponse } from "@/server/http";

/** Yangi qoralama: avtosaqlash va qaytib kelish uchun darhol manzilga ega bo‘ladi */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    const id = await createDraft(user.id);
    return Response.json({ ok: true, id });
  } catch (error) {
    return errorResponse(error);
  }
}
