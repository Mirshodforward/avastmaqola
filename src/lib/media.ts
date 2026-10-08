export type AvatarSize = 128 | 512;

/** Profil rasmi manzili. Kalit har yangi yuklashda o‘zgaradi, shuning uchun brauzer uni abadiy keshlaydi. */
export function avatarUrl(photoKey: string, size: AvatarSize): string {
  return `/media/avatars/${photoKey}-${size}.webp`;
}
