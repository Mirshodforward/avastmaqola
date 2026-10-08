import Image from "next/image";

/** Profil rasmi yoki (rasm bo‘lmasa) bosh harflar. Ism yonida turadi, shuning uchun alt bo‘sh. */
export function Avatar({ src, name, size }: { src: string | null; name: string; size: number }) {
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={size}
        height={size}
        unoptimized // 128 va 512 px variantlar yuklashda tayyorlangan
        className="shrink-0 rounded-full bg-mist object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-full bg-tile-soft font-serif font-semibold text-tile"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {initials}
    </span>
  );
}
