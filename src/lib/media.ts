export type AvatarSize = 128 | 512;

/** Profil rasmi manzili. Kalit har yangi yuklashda o‘zgaradi, shuning uchun brauzer uni abadiy keshlaydi. */
export function avatarUrl(photoKey: string, size: AvatarSize): string {
  return `/media/avatars/${photoKey}-${size}.webp`;
}

/** Yangilik muqovasi (1200×675). Kalit har yuklashda o‘zgaradi */
export function newsImageUrl(imageKey: string): string {
  return `/media/news/${imageKey}.webp`;
}
