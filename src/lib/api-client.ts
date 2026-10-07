import type { ApiResult } from "./auth-types";

const NETWORK_ERROR = {
  code: "network",
  message: "Server bilan aloqa yo‘q. Internetni tekshirib, qayta urinib ko‘ring.",
};

async function request<T>(url: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, { ...init, cache: "no-store" });
    return (await res.json()) as ApiResult<T>;
  } catch {
    return { ok: false, error: NETWORK_ERROR };
  }
}

export function getJson<T>(url: string) {
  return request<T>(url);
}

export function postJson<T = object>(url: string, body: unknown = {}) {
  return request<T>(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
