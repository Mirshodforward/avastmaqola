"use client";

import Link from "next/link";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { getJson, postJson } from "@/lib/api-client";
import type { FlowView } from "@/lib/auth-types";
import { NAME_PATTERN, normalizeUzPhone } from "@/lib/validation";
import { Field } from "./field";
import { TelegramVerify, isResumable } from "./telegram-verify";

type Values = { firstName: string; lastName: string; phone: string };
type Errors = Partial<Record<keyof Values, string>>;

function checkName(value: string, label: string) {
  const name = value.trim();
  if (!name) return `${label}ni kiriting`;
  if (!NAME_PATTERN.test(name)) return `${label}da faqat harflar bo‘lishi kerak`;
}

function validate(values: Values): Errors {
  const errors: Errors = {
    firstName: checkName(values.firstName, "Ism"),
    lastName: checkName(values.lastName, "Familiya"),
    phone: normalizeUzPhone(values.phone) ? undefined : "Raqamni +998901234567 ko‘rinishida kiriting",
  };
  return Object.fromEntries(Object.entries(errors).filter(([, v]) => v)) as Errors;
}

export function RegisterForm() {
  const [values, setValues] = useState<Values>({ firstName: "", lastName: "", phone: "+998" });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [flow, setFlow] = useState<FlowView | null>(null);

  // Telefonda brauzer tabi qayta yuklangan bo‘lsa (foydalanuvchi Telegram’da edi), jarayonni davom ettiramiz
  useEffect(() => {
    let cancelled = false;
    getJson<{ flow: FlowView | null }>("/api/auth/flow").then((res) => {
      if (!cancelled && res.ok && res.flow?.purpose === "register" && isResumable(res.flow)) {
        setFlow(res.flow);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const bind = (key: keyof Values) => ({
    name: key,
    value: values[key],
    error: errors[key],
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      setValues((v) => ({ ...v, [key]: e.target.value }));
      setErrors((current) => ({ ...current, [key]: undefined }));
    },
  });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) return;

    setPending(true);
    const res = await postJson<{ flow: FlowView }>("/api/auth/register", values);
    setPending(false);
    if (!res.ok) {
      const { fieldErrors, field, message } = res.error;
      if (fieldErrors) setErrors(fieldErrors);
      else if (field) setErrors({ [field]: message });
      else setFormError(message);
      return;
    }
    setFlow(res.flow);
  }

  if (flow) {
    return <TelegramVerify initialFlow={flow} onRestart={() => setFlow(null)} />;
  }

  return (
    <section aria-labelledby="register-title">
      <h1 id="register-title" className="font-serif text-3xl font-semibold tracking-tight">
        Ro‘yxatdan o‘tish
      </h1>
      <p className="mt-2 text-muted">
        Parol kerak emas. Kod telefon raqamingiz ulangan Telegram akkauntga keladi.
      </p>

      <form noValidate onSubmit={onSubmit} className="mt-7 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Ism" autoComplete="given-name" {...bind("firstName")} />
          <Field label="Familiya" autoComplete="family-name" {...bind("lastName")} />
        </div>
        <Field
          label="Telefon raqam"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+998901234567"
          {...bind("phone")}
        />

        {formError && (
          <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2.5 text-sm text-danger">
            {formError}
          </p>
        )}

        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={pending}>
          {pending ? "Tekshirilmoqda…" : "Ro‘yxatdan o‘tish"}
        </button>
      </form>

      <p className="mt-7 border-t border-line pt-5 text-sm text-muted">
        Akkauntingiz bormi?{" "}
        <Link href="/login" className="link">
          Kirish
        </Link>
      </p>
    </section>
  );
}
