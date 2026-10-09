import type { MetadataRoute } from "next";
import { siteUrl } from "@/server/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // Barcha qidiruv va AI botlariga ochiq (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot ham "*" ga bo‘ysunadi).
    // Faqat shaxsiy kabinet, admin, moderator va API yopiq.
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/admin", "/moderator", "/api/"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
