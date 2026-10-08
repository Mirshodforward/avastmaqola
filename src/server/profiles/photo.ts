import "server-only";
import sharp from "sharp";
import { AuthError } from "../auth/errors";

export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

/**
 * Har qanday JPEG/PNG/WebP rasmni kvadrat WebP’ga aylantiradi (512 va 128 px).
 * sharp metama’lumotlarni (EXIF, GPS koordinatalari) sukut bo‘yicha olib tashlaydi;
 * rotate() esa EXIF’dagi burilishni olib tashlashdan oldin rasmga qo‘llaydi.
 */
export async function processAvatar(input: Buffer): Promise<{ large: Buffer; small: Buffer }> {
  // Formatni fayl kengaytmasi yoki MIME’ga emas, faylning o‘ziga qarab aniqlaymiz
  const format = await sharp(input)
    .metadata()
    .then((m) => m.format)
    .catch(() => undefined);
  if (format !== "jpeg" && format !== "png" && format !== "webp") throw new AuthError("photo_invalid");

  const render = (size: number) =>
    sharp(input, { limitInputPixels: 50_000_000 })
      .rotate()
      .resize(size, size, { fit: "cover", position: sharp.strategy.attention })
      .webp({ quality: 82 })
      .toBuffer();

  const [large, small] = await Promise.all([render(512), render(128)]);
  return { large, small };
}
