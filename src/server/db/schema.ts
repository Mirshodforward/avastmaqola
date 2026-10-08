import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
// Nisbiy import: bu fayl drizzle-kit tomonidan ham o‘qiladi, u "@/" aliasini bilmaydi
import { ARTICLE_STATUSES, LICENSES, type ArticleStatus, type License } from "../../lib/article-rules";
import { UNIVERSITY_NAME } from "../../lib/brand";
import { LANGS, type Lang } from "../../lib/langs";
import {
  ACADEMIC_DEGREES,
  ACADEMIC_TITLES,
  type AcademicDegree,
  type AcademicTitle,
} from "../../lib/profile-labels";

const sqlList = (values: readonly string[]) => sql.raw(values.map((v) => `'${v}'`).join(", "));

export type AuthPurpose = "register" | "login";
export type AuthRequestStatus =
  | "pending" // yaratildi, foydalanuvchi hali botni ochmadi
  | "awaiting_contact" // bot ochildi (/start), kontakt kutilmoqda
  | "code_sent" // kontakt tasdiqlandi, kod Telegram’ga yuborildi
  | "verified" // kod to‘g‘ri kiritildi, jarayon tugadi
  | "failed"; // urinishlar tugadi

const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    phone: text("phone").notNull().unique(), // E.164: +998901234567
    // Profil tahririda kiritiladi (ro‘yxatdan o‘tishda so‘ralmaydi): 0000-0002-1825-0097
    orcid: text("orcid").unique(),
    // ORCID OAuth orqali egalik tasdiqlangan vaqt (keyingi bosqich)
    orcidVerifiedAt: timestamp("orcid_verified_at", { withTimezone: true }),
    // Telegram user id 52 bitgacha bo‘lishi mumkin — bigint shart
    telegramUserId: bigint("telegram_user_id", { mode: "number" }).unique(),
    role: text("role").notNull().default("teacher"),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    check("users_phone_format", sql`${t.phone} ~ '^[+]998[0-9]{9}$'`),
    check(
      "users_orcid_format",
      sql`${t.orcid} ~ '^[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{3}[0-9X]$'`,
    ),
    check("users_role_valid", sql`${t.role} in ('teacher', 'admin')`),
  ],
);

/**
 * Ro‘yxatdan o‘tish / kirish jarayoni. Foydalanuvchi faqat kod tasdiqlangandan
 * keyin yaratiladi, shuning uchun ro‘yxatdan o‘tish ma’lumotlari shu yerda kutib turadi.
 */
export const authRequests = pgTable(
  "auth_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    purpose: text("purpose").$type<AuthPurpose>().notNull(),
    status: text("status").$type<AuthRequestStatus>().notNull().default("pending"),
    phone: text("phone").notNull(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    // Tokenlarning o‘zi emas, faqat sha256 xeshi saqlanadi
    flowTokenHash: text("flow_token_hash").notNull().unique(),
    startTokenHash: text("start_token_hash").notNull().unique(),
    telegramUserId: bigint("telegram_user_id", { mode: "number" }),
    telegramChatId: bigint("telegram_chat_id", { mode: "number" }),
    codeHash: text("code_hash"),
    codeExpiresAt: timestamp("code_expires_at", { withTimezone: true }),
    codeAttempts: integer("code_attempts").notNull().default(0),
    codesSent: integer("codes_sent").notNull().default(0),
    lastCodeSentAt: timestamp("last_code_sent_at", { withTimezone: true }),
    ip: text("ip"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [
    index("auth_requests_phone_created_idx").on(t.phone, t.createdAt),
    index("auth_requests_ip_created_idx").on(t.ip, t.createdAt),
    index("auth_requests_telegram_status_idx").on(t.telegramUserId, t.status),
    index("auth_requests_user_id_idx").on(t.userId),
    check("auth_requests_purpose_valid", sql`${t.purpose} in ('register', 'login')`),
    check(
      "auth_requests_status_valid",
      sql`${t.status} in ('pending', 'awaiting_contact', 'code_sent', 'verified', 'failed')`,
    ),
    check(
      "auth_requests_register_payload",
      sql`${t.purpose} = 'login' or (${t.firstName} is not null and ${t.lastName} is not null)`,
    ),
    check(
      "auth_requests_login_user",
      sql`${t.purpose} = 'register' or ${t.userId} is not null`,
    ),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Joriy refresh tokenning sha256 xeshi (har yangilashda almashadi)
    tokenHash: text("token_hash").notNull().unique(),
    // Oldingi refresh token: qisqa oraliqda parallel so‘rovlarga ruxsat, keyin qayta ishlatilsa — o‘g‘irlik belgisi
    prevTokenHash: text("prev_token_hash"),
    rotatedAt: timestamp("rotated_at", { withTimezone: true }),
    // Kirishdan 7 kun: yangilash uni uzaytirmaydi
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    userAgent: text("user_agent"),
    ip: text("ip"),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_id_idx").on(t.userId), index("sessions_prev_token_hash_idx").on(t.prevTokenHash)],
);

/** Olimning ORCID’ga o‘xshash profili. Ism, familiya va ORCID iD users jadvalida qoladi. */
export const profiles = pgTable(
  "profiles",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    // /oqituvchi/{slug}. Bir marta yaratiladi va o‘zgarmaydi: barqaror URL Scholar va AI uchun muhim
    slug: text("slug").notNull().unique(),
    patronymic: text("patronymic"),
    publishedName: text("published_name"), // ilmiy nashrlardagi ism, masalan "M. A. Qahramonov"
    position: text("position").notNull(), // lavozim
    academicDegree: text("academic_degree").$type<AcademicDegree>(),
    academicTitle: text("academic_title").$type<AcademicTitle>(),
    institution: text("institution").notNull().default(UNIVERSITY_NAME),
    department: text("department"), // fakultet / kafedra
    direction: text("direction").notNull(), // ilmiy yo‘nalish
    bio: text("bio"),
    keywords: text("keywords").array().notNull().default(sql`'{}'::text[]`),
    googleScholarUrl: text("google_scholar_url"),
    scopusAuthorId: text("scopus_author_id"),
    researcherId: text("researcher_id"), // Web of Science ResearcherID
    researchgateUrl: text("researchgate_url"),
    websiteUrl: text("website_url"),
    publicEmail: text("public_email"),
    photoKey: text("photo_key"), // storage/avatars/{photoKey}-{512|128}.webp
    isPublic: boolean("is_public").notNull().default(true),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    check("profiles_slug_format", sql`${t.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`),
    check("profiles_degree_valid", sql`${t.academicDegree} in (${sqlList(ACADEMIC_DEGREES)})`),
    check("profiles_title_valid", sql`${t.academicTitle} in (${sqlList(ACADEMIC_TITLES)})`),
  ],
);

const textArray = (name: string) => text(name).array().notNull().default(sql`'{}'::text[]`);
const filled = (column: unknown) => sql`btrim(coalesce(${column}, '')) <> ''`;

/** Maqola. Ommaviy manzil: /maqola/{id}. Sarlavha, annotatsiya va kalit so‘zlar uch tilda. */
export const articles = pgTable(
  "articles",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id), // yuborgan o‘qituvchi; o‘chirilsa maqolalar yo‘qolmasin
    status: text("status").$type<ArticleStatus>().notNull().default("draft"),
    lang: text("lang").$type<Lang>(), // PDF qaysi tilda
    titleUz: text("title_uz"),
    titleRu: text("title_ru"),
    titleEn: text("title_en"),
    abstractUz: text("abstract_uz"),
    abstractRu: text("abstract_ru"),
    abstractEn: text("abstract_en"),
    keywordsUz: textArray("keywords_uz"),
    keywordsRu: textArray("keywords_ru"),
    keywordsEn: textArray("keywords_en"),
    license: text("license").$type<License>().notNull().default("cc-by-4.0"),
    rightsConfirmedAt: timestamp("rights_confirmed_at", { withTimezone: true }),
    pdfKey: text("pdf_key"), // storage/articles/{pdfKey}
    pdfBytes: integer("pdf_bytes"),
    reviewNote: text("review_note"), // administrator izohi (rad etilganda o‘qituvchiga ko‘rinadi)
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }), // birinchi chop etilgan sana
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("articles_user_idx").on(t.userId, t.updatedAt),
    index("articles_status_idx").on(t.status, t.submittedAt),
    check("articles_status_valid", sql`${t.status} in (${sqlList(ARTICLE_STATUSES)})`),
    check("articles_lang_valid", sql`${t.lang} in (${sqlList(LANGS)})`),
    check("articles_license_valid", sql`${t.license} in (${sqlList(LICENSES)})`),
    // Ilova xato qilsa ham chala maqola yuborilmaydi yoki chop etilmaydi
    check(
      "articles_complete_unless_editable",
      sql`${t.status} in ('draft', 'rejected') or (${t.lang} is not null and ${t.pdfKey} is not null
        and ${t.rightsConfirmedAt} is not null
        and ${filled(t.titleUz)} and ${filled(t.titleRu)} and ${filled(t.titleEn)}
        and ${filled(t.abstractUz)} and ${filled(t.abstractRu)} and ${filled(t.abstractEn)}
        and cardinality(${t.keywordsUz}) > 0 and cardinality(${t.keywordsRu}) > 0 and cardinality(${t.keywordsEn}) > 0)`,
    ),
    check("articles_published_has_date", sql`${t.status} <> 'published' or ${t.publishedAt} is not null`),
  ],
);

/** Mualliflar maqoladagi (PDF’dagi) tartibda. Faqat yuborgan o‘qituvchi users’ga bog‘lanadi. */
export const articleAuthors = pgTable(
  "article_authors",
  {
    articleId: integer("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    position: smallint("position").notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    givenName: text("given_name").notNull(),
    familyName: text("family_name").notNull(),
    institution: text("institution"),
    orcid: text("orcid"),
  },
  (t) => [
    primaryKey({ columns: [t.articleId, t.position] }),
    index("article_authors_user_idx").on(t.userId),
    check(
      "article_authors_orcid_format",
      sql`${t.orcid} ~ '^[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{3}[0-9X]$'`,
    ),
  ],
);

export type AiRequestStatus =
  | "running" // javob kutilmoqda (server o‘chib qolsa, eskirgan qator limitni band qilmaydi)
  | "ok"
  | "refusal" // model rad etdi
  | "truncated" // max_tokens: javob kesildi, taklif qo‘llanmadi
  | "aborted" // o‘qituvchi to‘xtatdi yoki sahifani yopdi
  | "error";

/** AI yordamchi chaqiruvlari: kunlik limit, admin statistikasi va xarajat hisobi uchun. Matnning o‘zi saqlanmaydi. */
export const aiRequests = pgTable(
  "ai_requests",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    articleId: integer("article_id").references(() => articles.id, { onDelete: "set null" }),
    status: text("status").$type<AiRequestStatus>().notNull().default("running"),
    model: text("model").notNull(),
    withPdf: boolean("with_pdf").notNull().default(false),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    cacheReadTokens: integer("cache_read_tokens").notNull().default(0),
    cacheWriteTokens: integer("cache_write_tokens").notNull().default(0),
    costMicroUsd: integer("cost_micro_usd").notNull().default(0), // taxminiy narx, 1 USD = 1 000 000
    proposedFields: integer("proposed_fields").notNull().default(0), // taklifdagi maydonlar soni
    durationMs: integer("duration_ms"),
    error: text("error"), // qisqa xato kodi (matnsiz)
    createdAt: createdAt(),
  },
  (t) => [
    index("ai_requests_user_created_idx").on(t.userId, t.createdAt),
    index("ai_requests_created_idx").on(t.createdAt),
    check(
      "ai_requests_status_valid",
      sql`${t.status} in ('running', 'ok', 'refusal', 'truncated', 'aborted', 'error')`,
    ),
  ],
);

export type User = typeof users.$inferSelect;
export type AuthRequest = typeof authRequests.$inferSelect;
