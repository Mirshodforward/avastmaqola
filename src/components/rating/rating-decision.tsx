"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { sendJson } from "@/lib/api-client";
import type { RatingStatus } from "@/lib/rating-rules";
import type { RatingAction } from "@/server/ratings/schemas";
import { T } from "./text";

/** Admin qarori. updatedAt — admin ko‘rgan matn versiyasi: muallif shu orada tahrirlagan bo‘lsa server 409 qaytaradi */
export function RatingDecision({ id, status, updatedAt }: { id: number; status: RatingStatus; updatedAt: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  // Yangilangan ro‘yxat kelguncha tugmalar bloklanadi: aks holda ikkinchi bosish 409 olardi
  const [refreshing, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const pending = busy || refreshing;

  async function decide(action: RatingAction) {
    if (pending) return;
    setBusy(true);
    setError(null);
    const res = await sendJson("POST", `/api/admin/ratings/${id}`, { action, updatedAt });
    setBusy(false);
    if (!res.ok) return setError(res.error.code === "state_conflict" ? T.admin.conflict : res.error.message);

    // Bosilgan tugma yangilangan ro‘yxatda yo‘qoladi: fokus keyingi (yoki oldingi) iqtibosga, bo‘lmasa sarlavhaga o‘tadi
    const item = root.current?.closest("li");
    const next = (item?.nextElementSibling ?? item?.previousElementSibling)?.querySelector<HTMLElement>("button");
    const heading = document.querySelector<HTMLElement>("h1");
    if (next) next.focus();
    else if (heading) {
      heading.tabIndex = -1;
      heading.focus();
    }
    startTransition(() => router.refresh());
  }

  // Kutayotgan iqtibos — asosiy amal (to‘ldirilgan tugma). Qaror qilinganlar tarixda: qarorni o‘zgartirish
  // tugmasi sokin (chegarasiz), ro‘yxat bajariladigan ishlar ro‘yxatiga o‘xshab qolmasin
  const decided = status !== "pending";

  return (
    <div ref={root} className="flex shrink-0 flex-col gap-2 sm:w-40">
      {status !== "approved" && (
        <button
          type="button"
          className={`btn ${decided ? "btn-ghost" : "btn-primary"}`}
          aria-disabled={pending}
          onClick={() => decide("approve")}
        >
          {T.admin.approve}
        </button>
      )}
      {status !== "rejected" && (
        <button
          type="button"
          className={`btn ${decided ? "btn-ghost" : "btn-secondary"} text-danger`}
          aria-disabled={pending}
          onClick={() => decide("reject")}
        >
          {status === "approved" ? T.admin.remove : T.admin.reject}
        </button>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
