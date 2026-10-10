"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { getJson, postJson } from "@/lib/api-client";
import type { FlowStatus, FlowView } from "@/lib/auth-types";
import { safeNext } from "@/lib/safe-next";

const WAITING: FlowStatus[] = ["pending", "awaiting_contact"];

/** Sahifa qayta yuklanganda davom ettirsa bo‘ladigan holatlar */
export function isResumable(flow: FlowView) {
  return [...WAITING, "code_sent"].includes(flow.status);
}

// Ekranda ko‘rinmaydi — holat o‘zgarishini ekran o‘quvchilar uchun e’lon qiladi
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
  onRestart: () => void;
};

export function TelegramVerify({ initialFlow, onRestart }: Props) {
  const [flow, setFlow] = useState(initialFlow);
  // Qolgan vaqtni server aytadi, brauzer esa har soniyada kamaytirib boradi
  const [secondsLeft, setSecondsLeft] = useState(initialFlow.codeSecondsLeft);
  const [resendIn, setResendIn] = useState(initialFlow.resendInSeconds);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [focused, setFocused] = useState(false);
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
    const id = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
      setResendIn((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [flow.status]);

  const codeSent = flow.status === "code_sent";
  const codeExpired = codeSent && secondsLeft === 0;
  const canResend = codeSent && flow.codesLeft > 0 && resendIn === 0;
  const finished = flow.status === "failed" || flow.status === "expired";
  const inputReady = codeSent && !codeExpired && !busy;

  // Maydon faollashganda fokusni unga beramiz: kod kelganda, xato koddan va qayta yuborishdan keyin.
  // disabled input fokus olmaydi, shuning uchun buni React DOM'ni yangilagandan keyin qilamiz
  useEffect(() => {
    if (inputReady) codeInput.current?.focus();
  }, [inputReady]);

  async function submit(value: string) {
    if (busy || value.length !== 6) return;
    setBusy(true);
    setError(null);
    const res = await postJson<{ redirectTo: string }>("/api/auth/verify", { code: value });
    if (res.ok) {
      // To‘liq sahifa yuklanishi: yangi sessiya cookie’si bilan server sahifani qaytadan chizadi.
      // replace — "orqaga" tugmasi kod kiritish sahifasiga qaytarmaydi. ?next= — kirishga olib kelgan sahifa
      // (masalan, maqoladagi baho formasi); faqat saytning ichki manzili
      window.location.replace(safeNext(new URLSearchParams(window.location.search).get("next")) ?? res.redirectTo);
      return;
    }
    setBusy(false);
    setCode("");
    const { code: errorCode, message, attemptsLeft } = res.error;
    setError(errorCode === "wrong_code" && attemptsLeft ? `${message} Yana ${attemptsLeft} ta urinish qoldi.` : message);
    if (errorCode !== "wrong_code") void refresh();
  }

  async function resend() {
    setBusy(true);
    setError(null);
    const res = await postJson("/api/auth/resend");
    setCode("");
    if (!res.ok) setError(res.error.message);
    // busy yangi holat kelgandan keyin o‘chadi — aks holda tugma eski resendIn=0 bilan bir lahza qaytib chiqadi
    await refresh();
    setBusy(false);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit(code);
  }

  // Yagona doimiy live-hudud: yangi qo‘shilgan aria-live elementni ekran o‘quvchilar ko‘pincha o‘qimaydi
  const announcement = finished ? "" : busy ? "Tekshirilmoqda…" : codeExpired ? "Kod eskirdi." : STATUS_TEXT[flow.status];

  return (
    <section aria-labelledby="verify-title">
      {/* Ko‘rinishda faqat bot havolasi, qisqa izoh va kod maydoni; sarlavha ekran o‘quvchilar uchun */}
      <h1 id="verify-title" className="sr-only">
        Raqamni tasdiqlang
      </h1>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      {finished ? (
        <>
          <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2.5 text-sm text-danger">
            {error ?? STATUS_TEXT[flow.status]}
          </p>
          <button type="button" className="btn btn-primary mt-5" onClick={onRestart}>
            Qaytadan boshlash
          </button>
        </>
      ) : (
        <>
          {/* 6 ta raqam terilishi bilan o‘zi yuboriladi, Enter ham ishlaydi — alohida tugma kerak emas */}
          <form onSubmit={onSubmit}>
            <label htmlFor="otp-code" className="block text-sm font-medium">
              Tasdiqlash kodi
            </label>
            {/* Ko‘rinishda 6 ta katak, ichida bitta haqiqiy input: avto-to‘ldirish, paste va ekran o‘quvchi buzilmaydi */}
            <div className="relative mt-2">
              <div aria-hidden="true" className="grid grid-cols-6 gap-2 sm:gap-3">
                {Array.from({ length: 6 }, (_, i) => {
                  const active = focused && inputReady && i === Math.min(code.length, 5);
                  const tone = error
                    ? "border-danger"
                    : active
                      ? "border-tile ring-[3px] ring-tile/25"
                      : code[i]
                        ? "border-ink/50"
                        : "border-[var(--input-border)]";
                  return (
                    <div
                      key={i}
                      className={`grid h-14 place-items-center rounded-xl border bg-paper font-serif text-2xl font-semibold tabular-nums transition-[border-color,box-shadow] ${tone} ${inputReady ? "" : "opacity-55"}`}
                    >
                      {code[i] ?? (active ? <span className="h-7 w-0.5 animate-pulse rounded bg-ink motion-reduce:animate-none" /> : "")}
                    </div>
                  );
                })}
              </div>
              <input
                id="otp-code"
                ref={codeInput}
                value={code}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setCode(value);
                  setError(null);
                  if (value.length === 6) void submit(value);
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                aria-describedby="otp-status"
                aria-invalid={error ? true : undefined}
                disabled={!inputReady}
                className="absolute inset-0 h-full w-full cursor-text text-base opacity-0 disabled:cursor-not-allowed"
              />
            </div>
            <p id="otp-status" className="mt-3 flex min-h-5 items-center gap-2 text-sm text-muted">
              {waiting && (
                <>
                  <span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-tile motion-reduce:animate-none" />
                  Kod kelishini kutyapmiz…
                </>
              )}
              {codeSent && (busy ? "Tekshirilmoqda…" : codeExpired ? "Kod eskirdi. " : canResend ? "Kod kelmadimi? " : `Kod ${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")} amal qiladi`)}
              {codeSent && !busy && canResend && (
                <button type="button" className="link" onClick={resend}>
                  Kodni qayta yuborish
                </button>
              )}
            </p>
          </form>

          {/* Yozuv bot xabarlaridagi bilan bir xil (server/telegram/messages.ts). Kod kelgach asosiy e’tibor kod maydonida */}
          <a
            href={flow.botUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`btn btn-lg mt-5 w-full ${codeSent ? "btn-secondary" : "btn-telegram"}`}
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
              <path d="M21.94 4.3 18.7 19.42c-.24 1.06-.88 1.32-1.77.82l-4.9-3.6-2.36 2.27c-.26.26-.48.48-.98.48l.35-4.98 9.06-8.18c.39-.35-.09-.55-.61-.2L6.3 13.07l-4.82-1.5c-1.05-.33-1.07-1.05.22-1.55L20.56 2.7c.88-.32 1.65.2 1.38 1.6Z" />
            </svg>
            Kodni olish
          </a>

          {error && (
            <p role="alert" className="mt-5 rounded-lg bg-danger-soft px-3 py-2.5 text-sm text-danger">
              {error}
            </p>
          )}

          <p className="mt-7 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-5 text-sm">
            <span className="whitespace-nowrap text-muted">{flow.phoneMasked}</span>
            <button type="button" className="link" onClick={onRestart}>
              Raqamni o‘zgartirish
            </button>
          </p>
        </>
      )}
    </section>
  );
}
