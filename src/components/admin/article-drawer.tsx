"use client";

import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";

/**
 * O‘ng chekkadan ochiladigan panel. Ochiq holat URL’da (?view=ID): yopish — o‘sha manzilning view’siz nusxasiga
 * o‘tish, shuning uchun "Orqaga" tugmasi va havolani ulashish ham ishlaydi. Esc va panel tashqarisiga bosish yopadi.
 * Ochilganda fokus panel sarlavhasiga (titleId). Yopilganda (Esc, fon, "Yopish", "Orqaga") panel URL bilan birga
 * yo‘qoladi va brauzer fokusni <body>ga tashlardi — shuning uchun fokus panelni ochgan qatorga qaytariladi
 * (o‘sha element yoki ro‘yxatdagi data-review-id): klaviatura bilan ishlovchi ro‘yxatdagi o‘rnini yo‘qotmaydi.
 */
export function ArticleDrawer({
  articleId,
  titleId,
  closeHref,
  children,
}: {
  articleId: number;
  titleId: string;
  closeHref: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  // Panel ichida boshqa maqolaga o‘tilsa (Orqaga/Oldinga), yopilganda oxirgisining qatoriga qaytamiz
  const current = useRef(articleId);
  useEffect(() => {
    current.current = articleId;
  }, [articleId]);

  // Layout effekt: Next sahifani <Activity> bilan yashirganda (boshqa sahifaga o‘tib "Orqaga") tozalash darhol ishlaydi.
  // Ochiq modal oyna yopilmasa, ko‘rinmay qolib yangi sahifani bosib bo‘lmas qilardi; qayta ko‘rsatilganda yana ochiladi
  useLayoutEffect(() => {
    const d = dialog.current;
    if (!d) return;
    const active = document.activeElement;
    const opener = active instanceof HTMLElement && active !== document.body ? active : null;
    if (!d.open) d.showModal();
    document.getElementById(titleId)?.focus();
    return () => {
      if (d.open) d.close();
      // Panel DOM’dan chiqqach (keyingi kadr) — ochgan element ko‘rinib tursa o‘sha, aks holda shu maqola qatori
      requestAnimationFrame(() => {
        const visible = (el: Element | null): el is HTMLElement =>
          el instanceof HTMLElement && el.isConnected && el.checkVisibility?.() !== false;
        const row = document.querySelector<HTMLElement>(`[data-review-id="${current.current}"]`);
        if (visible(opener) && !opener.closest("dialog")) {
          opener.focus();
          // checkVisibility’siz brauzerda yashirin element "ko‘rinadi" deb o‘tadi — fokus tushmasa, qatorga
          if (document.activeElement === opener) return;
        }
        if (visible(row)) row.focus();
      });
    };
  }, [titleId]);

  const close = () => router.push(closeHref, { scroll: false });

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      // Faqat qoraygan fonga bosish (panelning o‘ziga emas)
      onClick={(e) => e.target === e.currentTarget && close()}
      className="m-0 ml-auto h-dvh max-h-none w-full max-w-none bg-mist p-0 text-ink backdrop:bg-ink/40 sm:w-[min(72rem,94vw)] sm:border-l sm:border-line"
    >
      {children}
    </dialog>
  );
}
