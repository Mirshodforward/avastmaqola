"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { TextAreaField } from "@/components/profile/controls";
import { sendJson } from "@/lib/api-client";
import { STATUS_LABELS, type ArticleStatus } from "@/lib/article-rules";
import type { ReviewAction } from "@/server/articles/schemas";

const DONE: Record<ReviewAction, string> = {
  approve: "Maqola chop etildi.",
  reject: "Maqola tuzatish uchun qaytarildi.",
  unpublish: "Maqola saytdan olib tashlandi.",
};

/** Admin qarori. Izoh "tuzatishga qaytarish" va "olib tashlash"da majburiy — o‘qituvchi Telegram’da oladi. */
export function ReviewPanel({ id, status, submittedAt }: { id: number; status: ArticleStatus; submittedAt: string | null }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState<string>();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Yangilangan holat kelguncha tugmalar bloklanadi: aks holda ikkinchi bosish 409 olardi
  const [refreshing, startTransition] = useTransition();
  const heading = useRef<HTMLHeadingElement>(null);
  const pending = busy || refreshing;

  async function decide(action: ReviewAction) {
    if (pending) return;
    if (action === "unpublish" && !window.confirm("Maqola saytdan olib tashlansinmi? Sahifa darhol yopiladi.")) return;
    setBusy(true);
    setError(null);
    setDone(null);
    setNoteError(undefined);
    // submittedAt: o‘qituvchi shu orada qayta yuborgan bo‘lsa, server 409 qaytaradi (yangi matnni ko‘rmasdan tasdiqlanmaydi)
    const res = await sendJson("POST", `/api/admin/articles/${id}/review`, { action, note, submittedAt: submittedAt ?? undefined });
    setBusy(false);
    if (res.ok) {
      setNote("");
      setDone(DONE[action]);
      startTransition(() => router.refresh());
      // Bosilgan tugma yangi holatda yo‘qoladi — fokus panel sarlavhasiga o‘tadi
      heading.current?.focus();
      return;
    }
    if (res.error.field === "note") {
      setNoteError(res.error.message);
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[name="note"]')?.focus());
    } else setError(res.error.message);
  }

  const noteField = (label: string, hint: string) => (
    <TextAreaField
      label={label}
      name="note"
      rows={4}
      maxLength={1000}
      value={note}
      error={noteError}
      hint={hint}
      className="input mt-1.5 min-h-0 leading-relaxed"
      onChange={(e) => {
        setNote(e.target.value);
        setNoteError(undefined);
      }}
    />
  );

  return (
    <section aria-labelledby="decision-title" className="space-y-4 rounded-xl border border-line bg-paper p-5">
      <h2 id="decision-title" ref={heading} tabIndex={-1} className="font-serif text-lg font-semibold outline-none">
        Qaror
      </h2>
      {/* Jonli hudud doim DOM’da (display:none bo‘lsa ekran o‘quvchi e’lon qilmasligi mumkin), bo‘shida joy egallamaydi */}
      <p role="status" className={done ? "text-sm font-medium text-tile" : "sr-only"}>
        {done}
      </p>
      {status === "submitted" && (
        <>
          <p className="text-sm text-muted">
            Tekshiring: PDF ochiladimi, sarlavha va mualliflar PDF’dagi bilan bir xilmi, annotatsiyalar to‘g‘ri tildami.
          </p>
          <button type="button" className="btn btn-primary w-full" aria-disabled={pending} onClick={() => decide("approve")}>
            Chop etish
          </button>
          <div className="border-t border-line pt-4">
            {noteField("Tuzatish uchun izoh", "Kamida 10 belgi. O‘qituvchiga Telegram’da yuboriladi.")}
            <button type="button" className="btn btn-secondary mt-3 w-full" aria-disabled={pending} onClick={() => decide("reject")}>
              Tuzatishga qaytarish
            </button>
          </div>
        </>
      )}
      {status === "published" && (
        <>
          {noteField("Olib tashlash sababi", "Kamida 10 belgi. Maqola o‘qituvchiga tuzatish uchun qaytadi.")}
          <button
            type="button"
            className="btn btn-secondary w-full text-danger"
            aria-disabled={pending}
            onClick={() => decide("unpublish")}
          >
            Saytdan olib tashlash
          </button>
        </>
      )}
      {(status === "draft" || status === "rejected") && (
        <p className="text-sm text-muted">
          Maqola o‘qituvchida: {STATUS_LABELS[status].toLowerCase()}. Qayta yuborilgach, shu yerda qaror qabul qilasiz.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </section>
  );
}
