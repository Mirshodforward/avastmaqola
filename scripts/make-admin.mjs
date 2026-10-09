// Rol tayinlash: npm run admin -- +998901234567 yoki npm run moderator -- +998901234567
// Admin /admin sahifasida hammasini ko‘radi, moderator /moderator’da faqat maqolalarni ko‘rib chiqadi.
// Ikkalasi ham yangi maqolalar haqida Telegram xabarini oladi. Foydalanuvchi avval saytda ro‘yxatdan o‘tgan bo‘lishi kerak.
import nextEnv from "@next/env";
import pg from "pg";

nextEnv.loadEnvConfig(process.cwd(), true);

const role = process.argv[2] === "moderator" ? "moderator" : "admin";
const phone = process.argv[role === "moderator" ? 3 : 2]?.replace(/[\s()-]/g, "");
if (!phone || !/^\+998\d{9}$/.test(phone)) {
  console.error(`Foydalanish: npm run ${role} -- +998901234567`);
  process.exit(1);
}

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
// Administratorni moderatorga tushirib qo‘ymaslik uchun (adashib uning raqami yozilsa, /admin yopilib qolardi)
const { rowCount } = await db.query("update users set role = $2 where phone = $1 and (role <> 'admin' or $2 = 'admin')", [phone, role]);
const [user] = rowCount ? [] : (await db.query("select role from users where phone = $1", [phone])).rows;
await db.end();

if (user?.role === "admin") {
  console.error(`${phone} — administrator, moderator qilinmadi.`);
  process.exit(1);
}
if (!rowCount) {
  console.error(`${phone} ro‘yxatdan o‘tmagan. Avval saytda ro‘yxatdan o‘ting.`);
  process.exit(1);
}
console.log(`${phone} endi ${role === "admin" ? "administrator: /admin" : "moderator: /moderator"} sahifasi ochiq.`);
