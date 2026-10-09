"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * O‘ng chekkadan ochiladigan panel. Ochiq holat URL’da (?view=ID): yopish — o‘sha manzilning view’siz nusxasiga
 * o‘tish, shuning uchun "Orqaga" tugmasi va havolani ulashish ham ishlaydi. Esc va panel tashqarisiga bosish yopadi.
 */
export function ArticleDrawer({ label, closeHref, children }: { label: string; closeHref: string; children: ReactNode }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialog.current;
    if (d && !d.open) d.showModal();
  }, []);

  const close = () => router.push(closeHref, { scroll: false });

  return (
    <dialog
      ref={dialog}
      aria-label={label}
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
