export const AUTH = {
  flowTtlSeconds: 15 * 60, // butun jarayon (bot + kod) uchun muddat
  codeTtlSeconds: 2 * 60, // kod 2 daqiqada eskiradi
  maxCodeAttempts: 5, // bitta kod uchun noto‘g‘ri urinishlar
  maxCodesPerFlow: 3, // bitta jarayonda nechta kod yuborish mumkin
  resendCooldownSeconds: 30,
  maxFlowsPerPhonePerHour: 5,
  maxFlowsPerIpPerHour: 30,
  sessionTtlDays: 30,
} as const;

export const SESSION_COOKIE = "am_session";
export const FLOW_COOKIE = "am_flow";
// Flow cookie faqat /api/auth/* so‘rovlariga yuboriladi
export const FLOW_COOKIE_PATH = "/api/auth";
