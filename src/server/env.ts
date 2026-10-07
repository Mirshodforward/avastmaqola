import "server-only";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1, "kerak"),
  AUTH_SECRET: z.string().min(32, "kamida 32 belgi bo‘lishi kerak"),
  APP_URL: z.url().default("http://localhost:3000"),
  TELEGRAM_BOT_USERNAME: z.string().min(1, "kerak"),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_WEBHOOK_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

/** Muhit o‘zgaruvchilarini birinchi so‘rovda tekshiradi — build paytida emas. */
export function env(): Env {
  if (!cached) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      const details = parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
      throw new Error(`Muhit o‘zgaruvchilari noto‘g‘ri (.env.local): ${details}`);
    }
    cached = parsed.data;
  }
  return cached;
}
