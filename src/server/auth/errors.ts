type ErrorDef = { status: number; message: string; field?: string };

export const AUTH_ERRORS = {
  validation: { status: 400, message: "Ma’lumotlarni tekshirib, qayta yuboring." },
  payload_too_large: { status: 413, message: "So‘rov hajmi juda katta." },
  unauthorized: { status: 401, message: "Avval tizimga kiring." },
  forbidden: { status: 403, message: "Ruxsat etilmagan so‘rov." },
  profile_required: { status: 409, message: "Avval profilingizni to‘ldirib, saqlang." },
  not_found: { status: 404, message: "Topilmadi." },
  state_conflict: { status: 409, message: "Maqola holati o‘zgargan. Sahifani yangilang." },
  incomplete: { status: 422, message: "Maqola hali to‘liq emas. Ro‘yxatdagi kamchiliklarni tuzating." },
  file_invalid: { status: 422, message: "Fayl PDF formatida bo‘lishi kerak.", field: "pdf" },
  file_too_large: { status: 413, message: "PDF hajmi 10 MB dan oshmasligi kerak.", field: "pdf" },
  limit_reached: {
    status: 429,
    message: "Chop etilmagan maqolalaringiz juda ko‘p. Avval mavjudlarini tugating yoki qoralamalarni o‘chiring.",
  },
  note_required: { status: 400, message: "Sababni yozing (kamida 10 belgi).", field: "note" },
  photo_invalid: { status: 422, message: "Rasm JPG, PNG yoki WebP formatida bo‘lishi kerak.", field: "photo" },
  photo_too_large: { status: 413, message: "Rasm hajmi 10 MB dan oshmasligi kerak.", field: "photo" },
  rate_limited: { status: 429, message: "Urinishlar juda ko‘p. Bir soatdan so‘ng qayta urinib ko‘ring." },
  phone_taken: {
    status: 409,
    message: "Bu raqam allaqachon ro‘yxatdan o‘tgan. Kirish sahifasidan foydalaning.",
    field: "phone",
  },
  orcid_taken: {
    status: 409,
    message: "Bu ORCID iD boshqa profilga biriktirilgan. Xato bo‘lsa, administratorga murojaat qiling.",
    field: "orcid",
  },
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
  ai_unavailable: { status: 503, message: "AI yordamchi hozircha sozlanmagan." },
  ai_failed: { status: 502, message: "AI xizmati javob bermadi. Birozdan so‘ng qayta urinib ko‘ring." },
  ai_limit: { status: 429, message: "Bugungi AI so‘rovlar limiti tugadi. Ertaga qayta urinib ko‘ring." },
  ai_busy: { status: 429, message: "Oldingi so‘rovga javob hali tugamadi." },
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
