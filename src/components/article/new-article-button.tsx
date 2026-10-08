"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { postJson } from "@/lib/api-client";

/** Qoralama bosilganda yaratiladi (GET’da emas): saqlash uchun darhol manzil bo‘ladi */
export function NewArticleButton() {
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

  return (
    <div>
      <button type="button" className="btn btn-primary" aria-disabled={pending} onClick={create}>
        {pending ? "Ochilmoqda…" : "Yangi maqola"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
