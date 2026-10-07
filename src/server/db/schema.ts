import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

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
    orcid: text("orcid").notNull().unique(), // 0000-0002-1825-0097
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
    orcid: text("orcid"),
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
      sql`${t.purpose} = 'login' or (${t.firstName} is not null and ${t.lastName} is not null and ${t.orcid} is not null)`,
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
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    userAgent: text("user_agent"),
    ip: text("ip"),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_id_idx").on(t.userId)],
);

export type User = typeof users.$inferSelect;
export type AuthRequest = typeof authRequests.$inferSelect;
