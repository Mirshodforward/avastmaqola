"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { PresenceEvent } from "@/lib/web-presence";

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/**
 * Izlash tugmasi va jarayon. Natija serverda saqlanadi va sahifa (server komponent) uni chizadi — bu yerda faqat
 * jarayon ko‘rinadi. running — izlash boshqa oynada yoki ulanish uzilgandan keyin ham davom etmoqda.
 */
export function PresenceSearch({ again, remaining, running }: { again: boolean; remaining: number; running: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [steps, setSteps] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [refreshing, startTransition] = useTransition();
  const button = useRef<HTMLButtonElement>(null);
  const focusResult = useRef(false);
  const active = busy || running;

  // Izlash serverda davom etayotgan bo‘lsa, tugaguncha sahifa o‘zi yangilanib turadi
  useEffect(() => {
    if (!running || busy) return;
    const timer = setInterval(() => router.refresh(), 10_000);
    return () => clearInterval(timer);
  }, [running, busy, router]);

  useEffect(() => {
    if (!busy) return;
    const started = Date.now();
    const timer = setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [busy]);

  // Yangi natija chizilgach fokus uning sarlavhasiga o‘tadi — o‘qituvchi boshqa joyga o‘tmagan bo‘lsa
  useEffect(() => {
    if (refreshing || !focusResult.current) return;
    focusResult.current = false;
    const focused = document.activeElement;
    if (focused === document.body || focused === button.current) document.getElementById("presence-summary")?.focus();
  }, [refreshing]);

  async function start() {
    if (active || remaining === 0) return;
    setBusy(true);
    setSteps([]);
    setError(null);
    setSeconds(0);
    setStatus("Izlash boshlandi.");
    let ok = true;
    try {
      const res = await fetch("/api/me/web-presence", { method: "POST", cache: "no-store" });
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        setError(data?.error?.message ?? "Izlashni boshlab bo‘lmadi. Qayta urinib ko‘ring.");
        ok = false;
      } else {
        const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
        let buffer = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += value;
          let nl: number;
          while ((nl = buffer.indexOf("\n")) >= 0) {
            const line = buffer.slice(0, nl).trim();
            buffer = buffer.slice(nl + 1);
            if (!line) continue; // bo‘sh qator — ulanishni tirik saqlovchi signal
            const event = JSON.parse(line) as PresenceEvent;
            if (event.t === "step") setSteps((s) => [...s, event.v].slice(-3));
            else if (event.t === "error") {
              setError(event.message);
              ok = false;
            }
          }
        }
      }
    } catch {
      // Ulanish uzildi: izlash serverda davom etadi va saqlanadi — sahifa running holatida kutadi
      setError("Aloqa uzildi. Izlash davom etmoqda, natija shu sahifada paydo bo‘ladi.");
      ok = false;
    }
    setBusy(false);
    setStatus(ok ? "Izlash tugadi." : "");
    focusResult.current = ok;
    startTransition(() => router.refresh());
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          ref={button}
          type="button"
          className="btn btn-primary btn-lg"
          aria-disabled={active || remaining === 0}
          onClick={start}
        >
          {active ? "Izlanmoqda…" : again ? "Qayta izlash" : "Izlash"}
        </button>
        {!active && (
          <span className="text-sm text-muted">
            {remaining > 0 ? `Bugun ${remaining} ta izlash qoldi` : "Bugungi izlashlar tugadi. Ertaga qayta urinib ko‘ring."}
          </span>
        )}
      </div>

      {active && (
        <div aria-hidden="true" className="mt-4 max-w-2xl rounded-xl border border-line bg-paper p-4 text-sm">
          <p className="flex justify-between gap-4 text-muted">
            <span>{busy ? "1–2 daqiqa davom etadi" : "Natija tayyor bo‘lgach shu yerda paydo bo‘ladi"}</span>
            {busy && <span className="tabular-nums">{clock(seconds)}</span>}
          </p>
          {steps.length > 0 && (
            <ul className="mt-2 space-y-1">
              {steps.map((step, i) => (
                <li key={`${i}-${step}`} className="truncate">
                  {step}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Jonli hudud doim DOM’da: boshlanish va tugash e’lon qilinadi (qadamlar ro‘yxati — vizual) */}
      <p role="status" className="sr-only">
        {status}
      </p>
      {error && (
        <p role="alert" className="mt-4 text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
