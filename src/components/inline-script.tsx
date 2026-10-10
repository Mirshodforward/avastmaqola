"use client";

/**
 * Chizishdan oldin ishlaydigan inline skript (Next hujjati: "preventing flash before hydration"). Serverda
 * text/javascript — HTML o‘qilayotganda bajariladi; klientda text/plain — React <script> haqida ogohlantirmaydi va
 * qayta bajarmaydi (masalan, 404 qayta chizilganda). Farqni suppressHydrationWarning yopadi.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
