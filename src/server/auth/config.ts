export const AUTH = {
  flowTtlSeconds: 15 * 60, // butun jarayon (bot + kod) uchun muddat
  codeTtlSeconds: 2 * 60, // kod 2 daqiqada eskiradi
  maxCodeAttempts: 5, // bitta kod uchun noto‘g‘ri urinishlar
  maxCodesPerFlow: 3, // bitta jarayonda nechta kod yuborish mumkin
  resendCooldownSeconds: 30,
  maxFlowsPerPhonePerHour: 5,
  maxFlowsPerIpPerHour: 30,
  // Sessiya = qisqa access token + haftalik refresh token. 7 kundan keyin (uzaytirilmaydi) qayta kirish so‘raladi
  sessionTtlDays: 7,
  accessTtlSeconds: 15 * 60,
  // Bir vaqtdagi so‘rovlar (bir nechta tab) eski refresh token bilan kelsa — shu oraliqda o‘g‘irlik deb hisoblanmaydi
  refreshGraceSeconds: 60,
} as const;

// Production’da __Host- prefiksi: brauzer bunday cookie’ni faqat shu domen uchun (Secure, Path=/, Domain’siz) qabul
// qiladi — universitetning boshqa subdomeni (masalan, *.asman.uz) bizning sessiya cookie’mizni almashtira olmaydi
const HOST_PREFIX = process.env.NODE_ENV === "production" ? "__Host-" : "";

/** Access token: imzolangan, 15 daqiqa. Refresh token: imzolangan, bazada xeshi, har yangilashda almashadi. */
export const SESSION_COOKIE = `${HOST_PREFIX}am_session`;
export const REFRESH_COOKIE = `${HOST_PREFIX}am_refresh`;
export const FLOW_COOKIE = "am_flow";
// Flow cookie faqat /api/auth/* so‘rovlariga yuboriladi
export const FLOW_COOKIE_PATH = "/api/auth";
