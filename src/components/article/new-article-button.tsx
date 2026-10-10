"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { postJson } from "@/lib/api-client";

/**
 * Qoralama bosilganda yaratiladi (GET’da emas): saqlash uchun darhol manzil bo‘ladi.
 * Hech narsa yozilmagan qoralama bo‘lsa, server o‘shani qaytaradi.
 * variant="tile" — kabinetdagi katta asosiy harakat.
 */
export function NewArticleButton({ variant = "button" }: { variant?: "button" | "tile" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  // Cache Components kabinetni <Activity> ichida saqlaydi: "Orqaga"da tugma "Ochilmoqda…" holatida qotib qolmasin,
  // shuning uchun o‘tish transition orqali — u tugagach holat o‘zi tiklanadi
  const [navigating, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const pending = busy || navigating;

  async function create() {
    if (pending) return;
    setBusy(true);
    setError(null);
    const res = await postJson<{ id: number }>("/api/articles");
    setBusy(false);
    if (res.ok) startTransition(() => router.push(`/dashboard/articles/${res.id}`));
    else setError(res.error.message);
  }

  const label = pending ? "Ochilmoqda…" : "Yangi maqola";
  return (
    <div className={variant === "tile" ? "h-full" : undefined}>
      {variant === "tile" ? (
        <button
          type="button"
          aria-disabled={pending}
          onClick={create}
          className="flex h-full min-h-28 w-full items-center gap-4 rounded-xl bg-lapis px-6 py-5 text-left text-on-lapis transition-colors hover:bg-lapis-deep aria-disabled:cursor-progress"
        >
          <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full border border-on-lapis/40">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
          <span className="font-serif text-xl font-semibold">{label}</span>
        </button>
      ) : (
        <button type="button" className="btn btn-primary" aria-disabled={pending} onClick={create}>
          {label}
        </button>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
