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

export function sendJson<T = object>(method: "POST" | "PUT" | "PATCH" | "DELETE", url: string, body: unknown = {}) {
  return request<T>(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function postJson<T = object>(url: string, body: unknown = {}) {
  return sendJson<T>("POST", url, body);
}

/** Fayl yuklash (multipart). Content-Type’ni brauzer o‘zi boundary bilan qo‘yadi. */
export function sendForm<T = object>(url: string, form: FormData, method: "POST" | "PUT" = "POST") {
  return request<T>(url, { method, body: form });
}
