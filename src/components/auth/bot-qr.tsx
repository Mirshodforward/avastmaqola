"use client";

import Image from "next/image";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

/**
 * Kompyuterda o‘tirgan foydalanuvchi botni telefoni kamerasi bilan ochishi uchun QR kod.
 * Brauzerning o‘zida yaratiladi — start token tashqi QR servislarga yuborilmaydi.
 */
export function BotQr({ url }: { url: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toString(url, {
      type: "svg",
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#15213b", light: "#ffffff" },
    })
      .then((svg) => {
        if (!cancelled) setSrc(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
      })
      .catch((error) => console.error("QR kod yaratilmadi:", error));
    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <div className="size-36 shrink-0 rounded-lg border border-line bg-white p-1.5">
      {src && (
        <Image
          src={src}
          alt="Telegram botni ochish uchun QR kod"
          width={132}
          height={132}
          unoptimized
          className="size-full"
        />
      )}
    </div>
  );
}
