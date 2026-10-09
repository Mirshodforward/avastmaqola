import "server-only";
import { z } from "zod";
import { cleanText } from "@/lib/text";

export const NEWS_LIMITS = { titleMax: 200, bodyMax: 20_000 };

const text = (max: number) => z.string().transform(cleanText).pipe(z.string().max(max, `Ko‘pi bilan ${max} ta belgi`));

/** Saqlash: qoralama chala bo‘lishi mumkin. Chop etishda sarlavha va matn shart (DB CHECK ham bor) */
export const newsSchema = z
  .object({
    title: text(NEWS_LIMITS.titleMax).transform((v) => v.replace(/\s+/g, " ")),
    body: text(NEWS_LIMITS.bodyMax),
    published: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (!v.published) return;
    if (!v.title) ctx.addIssue({ code: "custom", path: ["title"], message: "Sarlavhani kiriting" });
    if (!v.body) ctx.addIssue({ code: "custom", path: ["body"], message: "Matnni kiriting" });
  });

export type NewsInput = z.output<typeof newsSchema>;

export function parseNewsId(raw: string): number | null {
  return /^[1-9][0-9]{0,8}$/.test(raw) ? Number(raw) : null;
}
