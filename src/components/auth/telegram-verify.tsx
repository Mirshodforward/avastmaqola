"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { getJson, postJson } from "@/lib/api-client";
import type { FlowStatus, FlowView } from "@/lib/auth-types";
import { OrcidIcon } from "../orcid-icon";
import { BotQr } from "./bot-qr";

const WAITING: FlowStatus[] = ["pending", "awaiting_contact"];

/** Sahifa qayta yuklanganda davom ettirsa bo‘ladigan holatlar */
export function isResumable(flow: FlowView) {
  return [...WAITING, "code_sent"].includes(flow.status);
}

const STATUS_TEXT: Record<FlowStatus, string> = {
  pending: "Bot ochilishini kutyapmiz…",
  awaiting_contact: "Bot ochildi. Endi Telegram’da kontaktingizni yuboring.",
  code_sent: "Raqam tasdiqlandi, kod Telegram’ga yuborildi.",
  verified: "Tasdiqlandi.",
  failed: "Urinishlar tugadi.",
  expired: "Tasdiqlash muddati tugadi.",
};

type Props = {
  initialFlow: FlowView;
  orcidName?: string | null;
  onRestart: () => void;
};

export function TelegramVerify({ initialFlow, orcidName, onRestart }: Props) {
  const [flow, setFlow] = useState(initialFlow);
  // Qolgan vaqtni server aytadi, brauzer esa har soniyada kamaytirib boradi
  const [secondsLeft, setSecondsLeft] = useState(initialFlow.codeSecondsLeft);
  const [resendIn, setResendIn] = useState(initialFlow.resendInSeconds);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const codeInput = useRef<HTMLInputElement>(null);

  const apply = useCallback((next: FlowView) => {
    setFlow(next);
    setSecondsLeft(next.codeSecondsLeft);
    setResendIn(next.resendInSeconds);
  }, []);

  const refresh = useCallback(async () => {
    const res = await getJson<{ flow: FlowView | null }>("/api/auth/flow");
    if (res.ok && res.flow) apply(res.flow);
  }, [apply]);

  const waiting = WAITING.includes(flow.status);

  // Bot javobini kutish: har 2 soniyada so‘raymiz
  useEffect(() => {
    if (!waiting) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 2000);
    return () => clearInterval(id);
  }, [waiting, refresh]);

  // Foydalanuvchi Telegram’dan qaytganda holatni darhol yangilaymiz (fon tablarida taymer sekinlashadi)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  useEffect(() => {
    if (flow.status !== "code_sent") return;
    codeInput.current?.focus();
    const id = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
      setResendIn((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [flow.status]);

  const codeSent = flow.status === "code_sent";
  const codeExpired = codeSent && secondsLeft === 0;
  const finished = flow.status === "failed" || flow.status === "expired";

  async function submit(value: string) {
    if (busy || value.length !== 6) return;
    setBusy(true);
    setError(null);
    const res = await postJson<{ redirectTo: string }>("/api/auth/verify", { code: value });
    if (res.ok) {
      // To‘liq sahifa yuklanishi: yangi sessiya cookie’si bilan server sahifani qaytadan chizadi.
      // replace — "orqaga" tugmasi kod kiritish sahifasiga qaytarmaydi
      window.location.replace(res.redirectTo);
      return;
    }
    setBusy(false);
    setCode("");
    const { code: errorCode, message, attemptsLeft } = res.error;
    setError(errorCode === "wrong_code" && attemptsLeft ? `${message} Yana ${attemptsLeft} ta urinish qoldi.` : message);
    if (errorCode === "wrong_code") codeInput.current?.focus();
    else void refresh();
  }

  async function resend() {
    setBusy(true);
    setError(null);
    const res = await postJson("/api/auth/resend");
    setBusy(false);
    setCode("");
    if (!res.ok) setError(res.error.message);
    await refresh();
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit(code);
  }

  return (
    <section aria-labelledby="verify-title">
      <h1 id="verify-title" className="font-serif text-3xl font-semibold tracking-tight">
        Raqamni tasdiqlang
      </h1>
      <p className="mt-2 text-muted">
        Kod <span className="whitespace-nowrap text-ink">{flow.phoneMasked}</span> raqami ulangan
        Telegram akkauntga keladi.
      </p>

      {orcidName && (
        <p className="mt-5 flex items-center gap-2 rounded-lg bg-tile-soft px-3 py-2.5 text-sm">
          <OrcidIcon />
          <span>
            ORCID profili topildi: <strong className="font-medium">{orcidName}</strong>
          </span>
        </p>
      )}

      <ol className="mt-8 space-y-7">
        <Step n={1} title="Botni oching" done={flow.status !== "pending"}>
          <div className="mt-3 flex flex-wrap items-center gap-5">
            <a href={flow.botUrl} target="_blank" rel="noopener noreferrer" className="btn btn-telegram">
              Telegram’da ochish
            </a>
            {/* Kompyuterda: Telegram ko‘pincha telefonda bo‘ladi — QR orqali botni telefonda ochadi */}
            {flow.status === "pending" && (
              <div className="hidden items-center gap-3 sm:flex">
                <BotQr url={flow.botUrl} />
                <p className="max-w-36 text-xs leading-relaxed text-muted">
                  Yoki telefon kamerasi bilan QR kodni skanerlang
                </p>
              </div>
            )}
          </div>
        </Step>

        <Step n={2} title="Botda «📱 Kontaktni yuborish» tugmasini bosing" done={codeSent}>
          <p className="mt-1 text-sm text-muted" aria-live="polite">
            {STATUS_TEXT[flow.status]}
          </p>
        </Step>

        <Step n={3} title="Telegram’ga kelgan 6 xonali kodni kiriting" done={false}>
          <form onSubmit={onSubmit} className="mt-3">
            <input
              ref={codeInput}
              value={code}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                setCode(value);
                if (value.length === 6) void submit(value);
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              aria-label="6 xonali kod"
              placeholder="000000"
              disabled={!codeSent || codeExpired || busy}
              className="input max-w-56 text-center font-serif text-2xl tracking-[0.4em] tabular-nums"
            />
            {codeSent && (
              <p className="mt-2 text-sm text-muted" aria-live="polite">
                {codeExpired ? "Kod eskirdi. Yangisini oling." : `Kod yana ${formatSeconds(secondsLeft)} amal qiladi.`}
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!codeSent || codeExpired || busy || code.length !== 6}
              >
                {busy ? "Tekshirilmoqda…" : "Tasdiqlash"}
              </button>
              {codeSent && flow.codesLeft > 0 && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={resend}
                  disabled={busy || resendIn > 0}
                >
                  Kodni qayta yuborish{resendIn > 0 ? ` (${formatSeconds(resendIn)})` : ""}
                </button>
              )}
            </div>
          </form>
        </Step>
      </ol>

      {error && (
        <p role="alert" className="mt-6 rounded-lg bg-danger-soft px-3 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-8 border-t border-line pt-5">
        {finished ? (
          <button type="button" className="btn btn-primary" onClick={onRestart}>
            Qaytadan boshlash
          </button>
        ) : (
          <button type="button" className="link text-sm" onClick={onRestart}>
            Raqamni o‘zgartirish
          </button>
        )}
      </div>
    </section>
  );
}

function Step({ n, title, done, children }: { n: number; title: string; done: boolean; children: ReactNode }) {
  return (
    <li className="flex gap-4">
      <span
        className={`grid size-8 shrink-0 place-items-center rounded-full border font-serif text-sm ${
          done ? "border-tile bg-tile text-paper" : "border-line text-muted"
        }`}
        aria-hidden="true"
      >
        {done ? "✓" : n}
      </span>
      <div className="min-w-0 flex-1 pt-1">
        <p className="font-medium">
          {title}
          {done && <span className="sr-only"> (bajarildi)</span>}
        </p>
        {children}
      </div>
    </li>
  );
}

function formatSeconds(total: number) {
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
