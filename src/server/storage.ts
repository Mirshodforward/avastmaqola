import "server-only";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

// Foydalanuvchi fayllari public/ da EMAS: tasdiqlanmagan maqolalar PDF’i URL orqali ochilib qolmasligi uchun
// ular faqat ruxsatni tekshiradigan route handler’lar orqali beriladi.
// turbopackIgnore: bu runtime ma’lumoti — build uni (va butun loyihani) server bundle’iga kuzatib qo‘shmasin
const ROOT = path.resolve(/*turbopackIgnore: true*/ process.env.STORAGE_DIR ?? "storage");

export type Bucket = "avatars" | "articles";

function filePath(bucket: Bucket, name: string) {
  // Yo‘l kesib o‘tishdan (path traversal) himoya: faqat oddiy fayl nomlari
  if (!/^[\w.-]+$/.test(name) || name.startsWith(".")) throw new Error(`Noto‘g‘ri fayl nomi: ${name}`);
  return path.join(ROOT, bucket, name);
}

export async function saveFile(bucket: Bucket, name: string, data: Uint8Array) {
  await mkdir(path.join(ROOT, bucket), { recursive: true });
  await writeFile(filePath(bucket, name), data);
}

export function readStoredFile(bucket: Bucket, name: string): Promise<Buffer> {
  return readFile(filePath(bucket, name));
}

export async function deleteFile(bucket: Bucket, name: string) {
  await rm(filePath(bucket, name), { force: true });
}
