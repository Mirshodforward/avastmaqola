import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

// .env.local va boshqa env fayllarni Next.js bilan bir xil qoidalar bo‘yicha yuklaymiz
loadEnvConfig(process.cwd());

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL! },
  strict: true,
  verbose: true,
});
