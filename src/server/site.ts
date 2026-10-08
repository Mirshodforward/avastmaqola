import "server-only";

export { SERVICE_NAME, SITE_NAME, UNIVERSITY_NAME, UNIVERSITY_NAME_EN } from "@/lib/brand";

/**
 * Saytning tashqi manzili (oxirida "/"siz). env() dan farqli o‘laroq faqat APP_URL’ni o‘qiydi,
 * shuning uchun build paytida (metadata, sitemap, JSON-LD) boshqa sozlamalarni talab qilmaydi.
 */
export function siteUrl(): string {
  const url = process.env.APP_URL;
  // robots.txt build paytida statik yoziladi: manzil yo‘q bo‘lsa, jimgina localhost yozilib qolmasin
  if (!url && process.env.NODE_ENV === "production") {
    throw new Error("APP_URL o‘rnatilmagan: production build va server saytning tashqi manzilini bilishi shart.");
  }
  return (url ?? "http://localhost:3000").replace(/\/+$/, "");
}
