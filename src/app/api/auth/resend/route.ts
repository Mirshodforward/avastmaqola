import { AuthError } from "@/server/auth/errors";
import { resendCode } from "@/server/auth/flow";
import { readFlowCookie } from "@/server/auth/session";
import { assertSameOrigin, errorResponse } from "@/server/http";
import { sendCode } from "@/server/telegram/messages";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const flowToken = await readFlowCookie();
    if (!flowToken) throw new AuthError("flow_expired");

    const { chatId, code } = await resendCode(flowToken);
    try {
      await sendCode(chatId, code);
    } catch (error) {
      console.error("[telegram] kodni qayta yuborib bo‘lmadi:", error);
      throw new AuthError("telegram_send_failed");
    }
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
