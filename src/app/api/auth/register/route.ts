import { getFlowView, startRegistration } from "@/server/auth/flow";
import { registerSchema } from "@/server/auth/schemas";
import { setFlowCookie } from "@/server/auth/session";
import { assertSameOrigin, clientMeta, errorResponse, readJson } from "@/server/http";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const input = await readJson(request, registerSchema);
    const { flowToken } = await startRegistration(input, clientMeta(request));
    await setFlowCookie(flowToken);
    return Response.json({ ok: true, flow: await getFlowView(flowToken) });
  } catch (error) {
    return errorResponse(error);
  }
}
