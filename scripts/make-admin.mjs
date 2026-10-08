// Administrator tayinlash: npm run admin -- +998901234567
// Admin /admin sahifasida maqolalarni ko‘rib chiqadi va yangi maqolalar haqida Telegram xabarini oladi.
// Foydalanuvchi avval saytda ro‘yxatdan o‘tgan bo‘lishi kerak.
import nextEnv from "@next/env";
import pg from "pg";

nextEnv.loadEnvConfig(process.cwd(), true);

const phone = process.argv[2]?.replace(/[\s()-]/g, "");
if (!phone || !/^\+998\d{9}$/.test(phone)) {
  console.error("Foydalanish: npm run admin -- +998901234567");
  process.exit(1);
}

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
const { rowCount } = await db.query("update users set role = 'admin' where phone = $1", [phone]);
await db.end();

if (!rowCount) {
  console.error(`${phone} ro‘yxatdan o‘tmagan. Avval saytda ro‘yxatdan o‘ting.`);
  process.exit(1);
}
console.log(`${phone} endi administrator: /admin sahifasi ochiq.`);
