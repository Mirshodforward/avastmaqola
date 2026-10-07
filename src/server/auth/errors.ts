type ErrorDef = { status: number; message: string; field?: string };

export const AUTH_ERRORS = {
  validation: { status: 400, message: "Ma’lumotlarni tekshirib, qayta yuboring." },
  forbidden: { status: 403, message: "Ruxsat etilmagan so‘rov." },
  rate_limited: { status: 429, message: "Urinishlar juda ko‘p. Bir soatdan so‘ng qayta urinib ko‘ring." },
  phone_taken: {
    status: 409,
    message: "Bu raqam allaqachon ro‘yxatdan o‘tgan. Kirish sahifasidan foydalaning.",
    field: "phone",
  },
  orcid_taken: { status: 409, message: "Bu ORCID iD boshqa foydalanuvchiga biriktirilgan.", field: "orcid" },
  orcid_not_found: {
    status: 422,
    message: "ORCID’da bunday iD topilmadi. Raqamni orcid.org profilingizdan ko‘chirib oling.",
    field: "orcid",
  },
  phone_not_registered: {
    status: 404,
    message: "Bu raqam ro‘yxatdan o‘tmagan. Avval ro‘yxatdan o‘ting.",
    field: "phone",
  },
  flow_expired: { status: 410, message: "Tasdiqlash muddati tugadi. Jarayonni qaytadan boshlang." },
  code_not_sent: { status: 409, message: "Avval Telegram botda kontaktingizni yuboring." },
  code_expired: { status: 410, message: "Kod eskirdi. Yangi kod oling." },
  wrong_code: { status: 400, message: "Kod noto‘g‘ri." },
  too_many_attempts: { status: 429, message: "Urinishlar tugadi. Jarayonni qaytadan boshlang." },
  too_many_codes: { status: 429, message: "Yangi kod so‘rash limiti tugadi. Jarayonni qaytadan boshlang." },
  resend_cooldown: { status: 429, message: "Yangi kodni biroz kutib so‘rang." },
  already_registered: {
    status: 409,
    message: "Bu ma’lumotlar bilan akkaunt allaqachon bor. Kirish sahifasidan foydalaning.",
  },
  telegram_mismatch: { status: 403, message: "Bu Telegram akkaunt profilingizga bog‘lanmagan." },
  telegram_send_failed: {
    status: 502,
    message: "Telegram’ga xabar yuborib bo‘lmadi. Birozdan so‘ng qayta urinib ko‘ring.",
  },
} satisfies Record<string, ErrorDef>;

export type AuthErrorCode = keyof typeof AUTH_ERRORS;

export class AuthError extends Error {
  constructor(
    public readonly code: AuthErrorCode,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(code);
  }
}
