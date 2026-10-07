import { after } from "next/server";
import { AuthError } from "@/server/auth/errors";
import { verifyCode } from "@/server/auth/flow";
import { verifySchema } from "@/server/auth/schemas";
import { clearFlowCookie, readFlowCookie, setSessionCookie } from "@/server/auth/session";
import { assertSameOrigin, clientMeta, errorResponse, readJson } from "@/server/http";
import { sendMessage } from "@/server/telegram/api";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const { code } = await readJson(request, verifySchema);
    const flowToken = await readFlowCookie();
    if (!flowToken) throw new AuthError("flow_expired");

    const { session, notice } = await verifyCode(flowToken, code, clientMeta(request));
    await setSessionCookie(session.token, session.expiresAt);
    await clearFlowCookie();

    // Javob qaytgandan keyin yuboriladi — foydalanuvchi Telegram’ni kutib qolmaydi
    if (notice) {
      after(() =>
        sendMessage(notice.chatId, notice.text).catch((e) => console.error("[telegram] ogohlantirish:", e)),
      );
    }
    return Response.json({ ok: true, redirectTo: "/dashboard" });
  } catch (error) {
    return errorResponse(error);
  }
}
