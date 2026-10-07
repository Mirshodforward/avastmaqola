import { getFlowView } from "@/server/auth/flow";
import { readFlowCookie } from "@/server/auth/session";
import { errorResponse } from "@/server/http";

/** Joriy brauzerdagi tasdiqlash jarayoni holati (sahifa bot javobini shu orqali kutadi). */
export async function GET() {
  try {
    const token = await readFlowCookie();
    const flow = token ? await getFlowView(token) : null;
    return Response.json({ ok: true, flow }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
