"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { getJson, postJson } from "@/lib/api-client";
import type { FlowView } from "@/lib/auth-types";
import { normalizeUzPhone } from "@/lib/validation";
import { Field } from "./field";
import { TelegramVerify, isResumable } from "./telegram-verify";

export function LoginForm() {
  const [phone, setPhone] = useState("+998");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [flow, setFlow] = useState<FlowView | null>(null);

  useEffect(() => {
    let cancelled = false;
    getJson<{ flow: FlowView | null }>("/api/auth/flow").then((res) => {
      if (!cancelled && res.ok && res.flow?.purpose === "login" && isResumable(res.flow)) {
        setFlow(res.flow);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!normalizeUzPhone(phone)) {
      setError("Raqamni +998901234567 ko‘rinishida kiriting");
      return;
    }
    setPending(true);
    setError(null);
    const res = await postJson<{ flow: FlowView }>("/api/auth/login", { phone });
    setPending(false);
    if (!res.ok) {
      setError(res.error.fieldErrors?.phone ?? res.error.message);
      return;
    }
    setFlow(res.flow);
  }

  if (flow) {
    return <TelegramVerify initialFlow={flow} onRestart={() => setFlow(null)} />;
  }

  return (
    <section aria-labelledby="login-title">
      <h1 id="login-title" className="font-serif text-3xl font-semibold tracking-tight">
        Kirish
      </h1>
      <p className="mt-2 text-muted">Tasdiqlash kodi Telegram botimizdan keladi.</p>

      <form noValidate onSubmit={onSubmit} className="mt-7 space-y-5">
        <Field
          label="Telefon raqam"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+998901234567"
          value={phone}
          error={error ?? undefined}
          onChange={(e) => {
            setPhone(e.target.value);
            setError(null);
          }}
        />
        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={pending}>
          {pending ? "Yuborilmoqda…" : "Kodni olish"}
        </button>
      </form>

      <p className="mt-7 border-t border-line pt-5 text-sm text-muted">
        Hali ro‘yxatdan o‘tmaganmisiz?{" "}
        <Link href="/register" className="link">
          Ro‘yxatdan o‘ting
        </Link>
      </p>
    </section>
  );
}
