import "server-only";
import { z } from "zod";
import { RATING_LIMITS as L } from "@/lib/rating-rules";
import { cleanText } from "@/lib/text";

const STARS_REQUIRED = "Yulduzlardan birini tanlang";

/** Baho va iqtibos. Matn tozalangach o‘lchanadi: faqat bo‘shliq yoki ko‘rinmas belgilar iqtibos bo‘lib o‘tmasin */
export const ratingInputSchema = z.object({
  stars: z.number({ error: STARS_REQUIRED }).int().min(1, STARS_REQUIRED).max(5, STARS_REQUIRED),
  body: z
    .string()
    .transform(cleanText)
    .pipe(z.string().min(L.bodyMin, `Kamida ${L.bodyMin} ta belgi yozing`).max(L.bodyMax, `Ko‘pi bilan ${L.bodyMax} ta belgi`)),
});

export type RatingInput = z.output<typeof ratingInputSchema>;

export const ratingDecisionSchema = z.object({
  action: z.enum(["approve", "reject"]),
  /** Admin ko‘rgan tahrir vaqti: muallif shu orada matnni o‘zgartirgan bo‘lsa, ko‘rilmagan matn tasdiqlanmaydi */
  updatedAt: z.iso.datetime(),
});

export type RatingAction = z.output<typeof ratingDecisionSchema>["action"];
