import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
// Nisbiy import: bu fayl drizzle-kit tomonidan ham o‘qiladi, u "@/" aliasini bilmaydi
import {
  ARTICLE_STATUSES,
  LICENSES,
  VENUE_TYPES,
  type ArticleStatus,
  type License,
  type VenueType,
} from "../../lib/article-rules";
import { UNIVERSITY_NAME } from "../../lib/brand";
import { LANGS, type Lang } from "../../lib/langs";
import { ACADEMIC_DEGREES, type AcademicDegree } from "../../lib/profile-labels";
import { RATING_STATUSES, type RatingStatus } from "../../lib/rating-rules";
import type { PresenceResult } from "../../lib/web-presence";

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
    check("users_role_valid", sql`${t.role} in ('teacher', 'moderator', 'admin')`),
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
    position: text("position").notNull(), // lavozim
    academicDegree: text("academic_degree").$type<AcademicDegree>(),
    institution: text("institution").notNull().default(UNIVERSITY_NAME),
    department: text("department"), // fakultet / kafedra
    direction: text("direction").notNull(), // ilmiy yo‘nalish
    bio: text("bio"),
    keywords: text("keywords").array().notNull().default(sql`'{}'::text[]`),
    googleScholarUrl: text("google_scholar_url"),
    scopusAuthorId: text("scopus_author_id"),
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
    // Nashr ma’lumotlari (ixtiyoriy): maqola jurnal yoki konferensiya to‘plamida allaqachon chiqqan bo‘lsa
    venueType: text("venue_type").$type<VenueType>(),
    venue: text("venue"),
    volume: text("volume"),
    issue: text("issue"),
    pages: text("pages"), // "125–128" yoki maqola raqami
    pubYear: smallint("pub_year"),
    doi: text("doi"), // 10.1117/12.3110012 (https://doi.org/ prefiksisiz)
    // Portaldagi joyi: "3-son, 12-maqola". O‘qituvchi yozadi, moderator yoki admin chop etishda tasdiqlaydi yoki
    // o‘zgartiradi. Yuqoridagi `issue` — boshqa (tashqi) jurnalning soni, bu emas
    issueNo: smallint("issue_no").notNull().default(1),
    issueSeq: smallint("issue_seq"),
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
    check("articles_venue_type_valid", sql`${t.venueType} in (${sqlList(VENUE_TYPES)})`),
    check("articles_pub_year_valid", sql`${t.pubYear} between 1900 and 2100`),
    check("articles_doi_format", sql`${t.doi} ~ '^10[.][0-9]{4,9}/[^[:space:]]+$'`),
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
    check("articles_issue_no_valid", sql`${t.issueNo} between 1 and 999`),
    check("articles_issue_seq_valid", sql`${t.issueSeq} between 1 and 999`),
    // Bir joyda faqat bitta chop etilgan maqola. Qoralama va navbatdagilar bir xil joyni taklif qilishi mumkin
    uniqueIndex("articles_issue_slot_uq").on(t.issueNo, t.issueSeq).where(sql`${t.status} = 'published'`),
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

/** assistant — maqola muharriridagi AI yordamchi; web — "Internetdagi ma’lumotlarim" izlashi */
export type AiRequestKind = "assistant" | "web";

/**
 * AI chaqiruvlari: kunlik limit, admin statistikasi va xarajat hisobi uchun. Yordamchi matni saqlanmaydi;
 * internetdagi izlashning natijasi (topilgan havolalar) result’da — uni faqat egasi ko‘radi.
 */
export const aiRequests = pgTable(
  "ai_requests",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    articleId: integer("article_id").references(() => articles.id, { onDelete: "set null" }),
    kind: text("kind").$type<AiRequestKind>().notNull().default("assistant"),
    status: text("status").$type<AiRequestStatus>().notNull().default("running"),
    model: text("model").notNull(),
    withPdf: boolean("with_pdf").notNull().default(false),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    cacheReadTokens: integer("cache_read_tokens").notNull().default(0),
    cacheWriteTokens: integer("cache_write_tokens").notNull().default(0),
    costMicroUsd: integer("cost_micro_usd").notNull().default(0), // taxminiy narx, 1 USD = 1 000 000
    proposedFields: integer("proposed_fields").notNull().default(0), // taklifdagi maydonlar soni
    webSearches: integer("web_searches").notNull().default(0), // veb-qidiruvlar soni (har biri $0.01, narxga qo‘shilgan)
    result: jsonb("result").$type<PresenceResult>(),
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
    check("ai_requests_kind_valid", sql`${t.kind} in ('assistant', 'web')`),
  ],
);

export type ZenodoStatus = "in_progress" | "published" | "failed";
export type ZenodoErrorCode =
  | "grant" // kod tokenga almashmadi
  | "account_taken" // bu Zenodo akkaunti boshqa o‘qituvchiniki
  | "unavailable" // tarmoq, timeout yoki 5xx
  | "rate_limited"
  | "rejected" // Zenodo ma’lumotni qabul qilmadi
  | "blocked" // spam filtri yoki IP bloki
  | "config" // JSON’siz 4xx yoki noto‘g‘ri client: sozlama xatosi
  | "file" // yuklangan PDF’ning md5’i mos emas
  | "article_changed"
  | "internal";

/**
 * Maqolaning Zenodo’dagi nusxasi. Kalit (maqola, Zenodo serveri): bitta serverda bitta yozuv — ikkinchi DOI chiqmaydi;
 * sandbox va production qatorlari bir-biriga xalaqit bermaydi. Zenodo kaliti (token) hech qayerda saqlanmaydi.
 */
export const zenodoDeposits = pgTable(
  "zenodo_deposits",
  {
    articleId: integer("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    host: text("host").notNull(), // zenodo.org | sandbox.zenodo.org | 127.0.0.1:4010 (test)
    status: text("status").$type<ZenodoStatus>().notNull(),
    // Qoralama qaysi Zenodo akkauntida: bitta akkaunt — bitta o‘qituvchi (DOI fabrikasi bo‘lmasin)
    zenodoUserId: text("zenodo_user_id"),
    // Qoralama yaratilishi bilan yoziladi: qayta urinishda chop etilganini topib olish yoki o‘chirish uchun
    recordId: text("record_id"),
    doi: text("doi"), // Zenodo bergan DOI (articles.doi — nashriyot DOI’si, unga tegilmaydi)
    error: text("error").$type<ZenodoErrorCode>(), // qisqa xato kodi
    errorDetail: text("error_detail"), // Zenodo xabari, ko‘pi bilan 300 belgi (tokensiz)
    // Baza soati bilan (render Date.now() o‘qimaydi): 10 daqiqadan eski in_progress — uzilgan urinish
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.articleId, t.host] }),
    check("zenodo_deposits_status_valid", sql`${t.status} in ('in_progress', 'published', 'failed')`),
    check("zenodo_deposits_doi_format", sql`${t.doi} ~ '^10[.][0-9]{4,9}/[^[:space:]]+$'`),
    check(
      "zenodo_deposits_published_complete",
      sql`${t.status} <> 'published' or (${t.doi} is not null and ${t.recordId} is not null)`,
    ),
  ],
);

/** Portal yangiliklari: admin yozadi. URL: /yangiliklar/{id}. publishedAt bo‘lmasa — qoralama, saytda ko‘rinmaydi. */
export const news = pgTable(
  "news",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    title: text("title").notNull().default(""),
    body: text("body").notNull().default(""), // oddiy matn, xatboshilar bo‘sh qator bilan
    imageKey: text("image_key"), // storage/news/{imageKey}.webp
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("news_published_at_idx").on(t.publishedAt),
    // Ilova xato qilsa ham sarlavhasiz yoki matnsiz yangilik chop etilmaydi
    check("news_complete_if_published", sql`${t.publishedAt} is null or (btrim(${t.title}) <> '' and btrim(${t.body}) <> '')`),
  ],
);

/**
 * Ro‘yxatdan o‘tgan foydalanuvchining maqolaga bahosi (1–5 yulduz) va iqtibosi. Bitta maqolaga bittadan: qayta yuborsa
 * tahrirlanadi va yana moderatsiyaga tushadi. Ommaga va o‘rtacha bahoga faqat admin tasdiqlagani kiradi.
 */
export const articleRatings = pgTable(
  "article_ratings",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    articleId: integer("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").$type<RatingStatus>().notNull().default("pending"),
    stars: smallint("stars").notNull(),
    body: text("body").notNull(), // iqtibos matni
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("article_ratings_article_user_idx").on(t.articleId, t.userId),
    index("article_ratings_status_idx").on(t.status, t.updatedAt),
    check("article_ratings_status_valid", sql`${t.status} in (${sqlList(RATING_STATUSES)})`),
    check("article_ratings_stars_valid", sql`${t.stars} between 1 and 5`),
  ],
);

export type User = typeof users.$inferSelect;
export type AuthRequest = typeof authRequests.$inferSelect;
