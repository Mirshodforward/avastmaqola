// Server va klient o‘rtasidagi API shakllari (faqat tiplar).

export type FlowStatus =
  | "pending"
  | "awaiting_contact"
  | "code_sent"
  | "verified"
  | "failed"
  | "expired";

export type FlowView = {
  purpose: "register" | "login";
  status: FlowStatus;
  phoneMasked: string;
  botUrl: string;
  codeSecondsLeft: number;
  resendInSeconds: number;
  codesLeft: number;
  attemptsLeft: number;
};

export type ApiError = {
  code: string;
  message: string;
  field?: string;
  fieldErrors?: Record<string, string>;
  attemptsLeft?: number;
  retryAfter?: number;
};

export type ApiResult<T> = ({ ok: true } & T) | { ok: false; error: ApiError };
