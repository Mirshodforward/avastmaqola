import { startAssistant } from "@/server/ai/assistant";
import { AI_LIMITS } from "@/server/ai/client";
import { assistantRequestSchema } from "@/server/ai/schemas";
import { parseArticleId } from "@/server/articles/schemas";
import { AuthError } from "@/server/auth/errors";
import { requireApiUser } from "@/server/auth/session";
import { assertSameOrigin, errorResponse, readJson } from "@/server/http";

/** AI yordamchi: javob NDJSON oqimi bo‘lib keladi (src/lib/ai.ts → AiEvent) */
export async function POST(request: Request, ctx: RouteContext<"/api/articles/[id]/ai">) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    const id = parseArticleId((await ctx.params).id);
    if (!id) throw new AuthError("not_found");
    // Chatga butun maqola matni joylashtirilishi mumkin — oddiy 64 KB chegarasi yetmaydi
    const input = await readJson(request, assistantRequestSchema, AI_LIMITS.bodyMaxBytes);
    const body = await startAssistant(user.id, id, input, request.signal);
    return new Response(body, {
      headers: {
        "content-type": "application/x-ndjson; charset=utf-8",
        "cache-control": "no-store",
        // nginx javobni buferlamasin: matn yozilishi bilan ko‘rinsin
        "x-accel-buffering": "no",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
