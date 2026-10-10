"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { TextAreaField } from "@/components/profile/controls";
import { sendJson } from "@/lib/api-client";
import type { ArticleStatus } from "@/lib/article-rules";
import type { ApiError } from "@/lib/auth-types";
import { issueLabel } from "@/lib/issue";
import type { ReviewAction } from "@/server/articles/schemas";
import { IssueFields, type IssueValues } from "./issue-fields";

const DONE: Record<ReviewAction, string> = {
  approve: "Maqola chop etildi",
  reject: "Maqola bekor qilindi: izoh o‘qituvchiga yuborildi.",
  unpublish: "Maqola saytdan olib tashlandi.",
};

/** Maqolaning joyi: o‘qituvchi taklifi yoki chop etilgan joyi. takenBy — shu joydagi boshqa chop etilgan maqola */
export type ReviewPlace = { issueNo: number; issueSeq: number | null; takenBy: number | null; nextSeq: number };

/**
 * Moderator yoki admin qarori. Izoh "bekor qilish" va "olib tashlash"da majburiy — o‘qituvchi Telegram’da oladi.
 * Chop etishda maqola joyi ("3-son, 12-maqola") shu yerda tasdiqlanadi; band bo‘lsa, bo‘sh raqam taklif qilinadi.
 */
export function ReviewPanel({
  id,
  status,
  submittedAt,
  place,
  canUnpublish = true,
  zenodoDoi = null,
}: {
  id: number;
  status: ArticleStatus;
  submittedAt: string | null;
  place: ReviewPlace;
  /** Saytdan olib tashlash — faqat admin */
  canUnpublish?: boolean;
  /** Zenodo’dagi nusxa (10.5281): saytdan olib tashlansa ham Zenodo’da qoladi */
  zenodoDoi?: string | null;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState<string>();
  const [issue, setIssue] = useState<IssueValues>({
    issueNo: String(place.issueNo),
    issueSeq: place.issueSeq ? String(place.issueSeq) : "",
  });
  const unchanged = issue.issueNo === String(place.issueNo) && issue.issueSeq === String(place.issueSeq ?? "");
  const [placeError, setPlaceError] = useState(
    place.takenBy ? `${issueLabel(place.issueNo, place.issueSeq)} band (№${place.takenBy}).` : undefined,
  );
  // Band bo‘lsa taklif: shu sondagi navbatdagi bo‘sh raqam
  const [free, setFree] = useState(place.takenBy || !place.issueSeq ? { issueNo: place.issueNo, issueSeq: place.nextSeq } : null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Yangilangan holat kelguncha tugmalar bloklanadi: aks holda ikkinchi bosish 409 olardi
  const [refreshing, startTransition] = useTransition();
  const heading = useRef<HTMLHeadingElement>(null);
  const pending = busy || refreshing;

  const chosen = () =>
    issue.issueNo && issue.issueSeq ? { issueNo: Number(issue.issueNo), issueSeq: Number(issue.issueSeq) } : null;

  /** Yangilangan holat chizilgach (xato aria-describedby bilan bog‘langach) maydonga fokus */
  const focusPlace = (name: keyof IssueValues) =>
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`[name="${name}"]`)?.focus());

  /** Joy xatosi (band yoki noto‘g‘ri): xabar va bo‘sh raqam maydon yonida, fokus raqamga */
  function placeFailed(err: ApiError & { nextSeq?: number }, issueNo: number) {
    const message = Object.entries(err.fieldErrors ?? {}).find(([key]) => key.startsWith("place"))?.[1];
    if (!message) return false;
    setPlaceError(message);
    setFree(err.nextSeq ? { issueNo, issueSeq: err.nextSeq } : null);
    focusPlace("issueSeq");
    return true;
  }

  async function send(url: string, body: object, success: string) {
    setBusy(true);
    setError(null);
    setDone(null);
    setNoteError(undefined);
    const res = await sendJson("POST", url, body);
    setBusy(false);
    if (res.ok) {
      setNote("");
      setPlaceError(undefined);
      setFree(null);
      setDone(success);
      startTransition(() => router.refresh());
      // Bosilgan tugma yangi holatda yo‘qolishi mumkin — fokus panel sarlavhasiga o‘tadi
      heading.current?.focus();
      return;
    }
    return res.error;
  }

  async function decide(action: ReviewAction) {
    if (pending) return;
    const where = chosen();
    if (action === "approve" && !where) {
      setPlaceError("Son va raqamni kiriting.");
      // Xato maydonga bog‘langan (aria-describedby): fokus bo‘sh maydonga o‘tganda o‘qiladi
      focusPlace(issue.issueNo ? "issueSeq" : "issueNo");
      return;
    }
    // Zenodo’da chop etilgan yozuvni o‘chirib bo‘lmaydi — admin buni bilib qaror qilsin
    const zenodo = zenodoDoi ? ` Zenodo’dagi nusxasi (DOI ${zenodoDoi}) o‘chmaydi.` : "";
    if (action === "unpublish" && !window.confirm(`Maqola saytdan olib tashlansinmi? Sahifa darhol yopiladi.${zenodo}`)) return;
    // submittedAt: o‘qituvchi shu orada qayta yuborgan bo‘lsa, server 409 qaytaradi (yangi matnni ko‘rmasdan tasdiqlanmaydi)
    const failed = await send(
      `/api/admin/articles/${id}/review`,
      { action, note, submittedAt: submittedAt ?? undefined, place: action === "approve" ? where : undefined },
      action === "approve" ? `${DONE.approve}: ${issueLabel(where!.issueNo, where!.issueSeq)}.` : DONE[action],
    );
    if (!failed || (where && placeFailed(failed, where.issueNo))) return;
    if (failed.field === "note") {
      setNoteError(failed.message);
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[name="note"]')?.focus());
    } else setError(failed.message);
  }

  /** Chop etilgan maqolani boshqa son yoki raqamga ko‘chirish */
  async function move() {
    const where = chosen();
    if (pending || !where || unchanged) return;
    if (!window.confirm(`Maqola joyi ${issueLabel(where.issueNo, where.issueSeq)} bo‘lsinmi? Sahifadagi raqam ham o‘zgaradi.`)) return;
    const failed = await send(`/api/admin/articles/${id}/issue`, { place: where }, `Joy saqlandi: ${issueLabel(where.issueNo, where.issueSeq)}.`);
    if (failed && !placeFailed(failed, where.issueNo)) setError(failed.message);
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

  const placeField = (
    <div role="group" aria-labelledby="place-label">
      <p id="place-label" className="text-sm font-medium">
        Son va raqam
      </p>
      <div className="mt-1.5">
        <IssueFields
          value={issue}
          invalid={Boolean(placeError)}
          describedBy={placeError ? "place-error" : undefined}
          onChange={(next) => {
            setIssue(next);
            setPlaceError(undefined);
          }}
        />
      </div>
      {placeError && (
        <p id="place-error" className="mt-1.5 text-sm text-danger">
          {placeError}{" "}
          {free && (
            <button
              type="button"
              className="link"
              onClick={() => {
                setIssue({ issueNo: String(free.issueNo), issueSeq: String(free.issueSeq) });
                setPlaceError(undefined);
                // Tugma yo‘qoladi — fokus <body>ga tushmasin
                focusPlace("issueSeq");
              }}
            >
              Bo‘sh: {issueLabel(free.issueNo, free.issueSeq)}
            </button>
          )}
        </p>
      )}
    </div>
  );

  return (
    <section aria-labelledby="decision-title" className="space-y-4 rounded-xl border border-line bg-paper p-5">
      {/* Qarordan keyin fokus shu yerga o‘tadi; sarlavha bosiladigan element emas — halqasiz (! globals.css qoidasidan ustun) */}
      <h2 id="decision-title" ref={heading} tabIndex={-1} className="font-serif text-lg font-semibold outline-none!">
        Qaror
      </h2>
      {/* Jonli hudud doim DOM’da (display:none bo‘lsa ekran o‘quvchi e’lon qilmasligi mumkin), bo‘shida joy egallamaydi */}
      <p role="status" className={done ? "text-sm font-medium text-tile" : "sr-only"}>
        {done}
      </p>
      {status === "submitted" && (
        <>
          <p className="text-sm text-muted">ORCID va mualliflarni PDF bilan solishtiring.</p>
          {placeField}
          {noteField("Izoh o‘qituvchiga", "Bekor qilishda majburiy, kamida 10 belgi.")}
          <div className="grid grid-cols-2 gap-3">
            <button type="button" className="btn btn-primary btn-lg" aria-disabled={pending} onClick={() => decide("approve")}>
              Chop etish
            </button>
            <button type="button" className="btn btn-secondary btn-lg text-danger" aria-disabled={pending} onClick={() => decide("reject")}>
              Bekor qilish
            </button>
          </div>
        </>
      )}
      {status === "published" && (
        <>
          {placeField}
          <button
            type="button"
            className="btn btn-secondary"
            aria-disabled={pending || unchanged}
            onClick={move}
          >
            Joyni saqlash
          </button>
          {canUnpublish && (
            <>
              {noteField("Olib tashlash sababi", "Kamida 10 belgi.")}
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
        </>
      )}
      {(status === "draft" || status === "rejected") && <p className="text-sm text-muted">Maqola o‘qituvchida.</p>}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </section>
  );
}
