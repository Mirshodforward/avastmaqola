// Faqat lokal ishlab chiqish uchun: hech narsa o‘rnatmasdan haqiqiy PostgreSQL serverini ko‘taradi
// (binarlar npm paketi ichida). Production’da oddiy PostgreSQL server yoki boshqariladigan xizmat ishlating.
import { existsSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import EmbeddedPostgres from "embedded-postgres";

const port = Number(process.env.DEV_DB_PORT ?? 5432);
const dataDir = path.resolve(".pgdata");

function portInUse() {
  return new Promise((resolve) => {
    const socket = net.connect(port, "127.0.0.1");
    socket.once("connect", () => {
      socket.end();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });
}

// Skript ikkinchi marta ishga tushirilsa, yangi server ochilmaydi — tushunarli xabar beramiz
if (await portInUse()) {
  console.log(`${port}-portda server allaqachon ishlayapti (ehtimol baza oldinroq ishga tushirilgan).`);
  console.log("Agar bu boshqa dastur bo‘lsa, boshqa port tanlang: DEV_DB_PORT=5434 va DATABASE_URL’ni ham o‘zgartiring.");
  process.exit(0);
}

const logs = [];
const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  port,
  user: "postgres",
  password: "postgres",
  persistent: true,
  // Windows locale’i (masalan Russian_Russia.1252) bazani WIN1252 kodirovkasida yaratadi —
  // o‘zbekcha ʻ/ʼ va kirill harflari buziladi. Shuning uchun UTF-8 ni majburan beramiz.
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
  // Postgres loglarini faqat xato bo‘lganda ko‘rsatamiz
  onLog: (message) => logs.push(message),
});

try {
  if (!existsSync(path.join(dataDir, "PG_VERSION"))) {
    console.log("Birinchi ishga tushirish: .pgdata papkasi yaratilmoqda…");
    await pg.initialise();
  }
  // Server "tayyor" deyishdan oldin yopilsa, kutubxona sababsiz reject qiladi — logni o‘zimiz chiqaramiz
  await pg.start();
} catch (error) {
  console.error("PostgreSQL ishga tushmadi.", error instanceof Error ? error.message : "");
  console.error(logs.join("").trim().split("\n").slice(-15).join("\n"));
  process.exit(1);
}

try {
  await pg.createDatabase("avtomaqola");
} catch (error) {
  // 42P04 — baza allaqachon mavjud
  if (error?.code !== "42P04") throw error;
}

console.log(`PostgreSQL ishlayapti: postgres://postgres:postgres@localhost:${port}/avtomaqola`);
console.log("To‘xtatish uchun Ctrl+C bosing.");

const shutdown = async () => {
  await pg.stop();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
