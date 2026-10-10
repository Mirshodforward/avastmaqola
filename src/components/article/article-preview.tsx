"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Problem } from "@/lib/article-rules";
import type { ArticleView as View } from "@/server/articles/view";
import { CloseIcon } from "./ai-panel";
import { ArticleView } from "./article-view";
import { IssueFields, type IssueValues } from "./issue-fields";

/**
 * Yuborishdan oldingi oxirgi qadam: o‘qituvchi maqola sahifasi aynan qanday ochilishini ko‘radi
 * va tasdiqlaydi — shundan keyingina maqola ko‘rib chiqishga (moderator yoki admin) yuboriladi.
 */
export function ArticlePreview({
  open,
  view,
  absoluteUrl,
  problems,
  issue,
  submitting,
  aiBusy,
  onClose,
  onSubmit,
  onFix,
  onIssueChange,
}: {
  open: boolean;
  /** Faqat ochiq paytda hisoblanadi */
  view: () => View;
  absoluteUrl: string;
  problems: Problem[];
  /** O‘qituvchi taklif qilgan joy: "3-son, 12-maqola" (oldindan to‘ldirilgan, moderator tasdiqlaydi) */
  issue: IssueValues;
  submitting: boolean;
  /** AI hali javob yozmoqda: forma o‘zgarishi mumkin — tasdiqlash kutadi */
  aiBusy: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onFix: (field: string) => void;
  onIssueChange: (next: IssueValues) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialog.current;
    if (open && !d?.open) d?.showModal();
    if (!open && d?.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      aria-labelledby="preview-title"
      className="m-auto h-[calc(100dvh-2rem)] max-h-none w-[min(64rem,calc(100%-2rem))] max-w-none overflow-hidden rounded-2xl border border-line bg-paper p-0 text-ink backdrop:bg-ink/50"
    >
      {open && (
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 border-b border-line px-5 py-3">
            <h2 id="preview-title" className="min-w-0 flex-1 font-serif text-lg font-semibold">
              Maqola sahifasi shunday ko‘rinadi
            </h2>
            <button type="button" className="btn btn-ghost px-2.5" onClick={onClose} aria-label="Ko‘rinishni yopish">
              <CloseIcon />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-mist px-4 py-8 sm:px-8">
            <ArticleView v={view()} absoluteUrl={absoluteUrl} preview />
          </div>

          <div className="border-t border-line px-5 py-4">
            {problems.length > 0 ? (
              <div>
                <p className="text-sm font-medium text-danger">Yuborishdan oldin tuzating:</p>
                <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {problems.map((p) => (
                    <li key={`${p.field}:${p.message}`}>
                      {p.field === "profile" ? (
                        <Link href="/dashboard/profile" className="link">
                          {p.message}
                        </Link>
                      ) : (
                        <button type="button" className="link text-left" onClick={() => onFix(p.field)}>
                          {p.message}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : aiBusy ? (
              <p className="text-sm text-muted">AI hali javob yozmoqda — tugashini kuting.</p>
            ) : (
              <p className="text-sm">Yuborish bilan maqolani ochiq joylashga huquqingiz borligini tasdiqlaysiz.</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <IssueFields value={issue} onChange={onIssueChange} />
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Tahrirga qaytish
              </button>
              <button
                type="button"
                className="btn btn-primary"
                aria-disabled={submitting || aiBusy || problems.length > 0}
                onClick={() => !submitting && !aiBusy && problems.length === 0 && onSubmit()}
              >
                {submitting ? "Yuborilmoqda…" : "Tasdiqlash va yuborish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
