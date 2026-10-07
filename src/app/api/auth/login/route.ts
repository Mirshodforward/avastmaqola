import { getFlowView, startLogin } from "@/server/auth/flow";
import { loginSchema } from "@/server/auth/schemas";
import { setFlowCookie } from "@/server/auth/session";
import { assertSameOrigin, clientMeta, errorResponse, readJson } from "@/server/http";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const { phone } = await readJson(request, loginSchema);
    const { flowToken } = await startLogin(phone, clientMeta(request));
    await setFlowCookie(flowToken);
    return Response.json({ ok: true, flow: await getFlowView(flowToken) });
  } catch (error) {
    return errorResponse(error);
  }
}
