import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Dev rejimida HMR modulni qayta yuklaydi. Pool’ni globalThis’da saqlamasak,
// har bir o‘zgarishda yangi ulanishlar ochilib, Postgres limitiga yetib qolamiz.
const globalForDb = globalThis as unknown as { pgPool?: Pool };

// Pool ulanishni birinchi so‘rovda ochadi, shuning uchun build paytida baza shart emas.
const pool =
  globalForDb.pgPool ?? new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
if (process.env.NODE_ENV !== "production") globalForDb.pgPool = pool;

export const db = drizzle({ client: pool, schema });

export type Db = typeof db;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
