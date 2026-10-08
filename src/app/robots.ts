import type { MetadataRoute } from "next";
import { siteUrl } from "@/server/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // Barcha qidiruv va AI botlariga ochiq (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot ham "*" ga bo‘ysunadi).
    // Faqat shaxsiy kabinet, admin va API yopiq.
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/admin", "/api/"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
