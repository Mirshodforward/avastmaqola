"use client";

import { useRouter } from "next/navigation";
import { Fragment, useEffect, useId, useState } from "react";
import { postJson } from "@/lib/api-client";
import type { ZenodoErrorCode } from "@/server/db/schema";
import type { ZenodoFlash, ZenodoPanelData } from "@/server/zenodo/service";

const TEXT = {
  title: "Zenodo",
  sandbox: "Zenodo (sinov)",
  warning: "Zenodo’da chop etilgan yozuvni o‘chirib bo‘lmaydi.",
  rights: (license: string) =>
    `Tasdiqlayman: maqola mualliflarning o‘z ishi, hammualliflar rozi, u boshqa joyda (jurnal, to‘plam, Zenodo) chop etilmagan va uni «${license}» shartlari bilan ochiq joylashga huquqim bor.`,
  rightsRequired: "Avval tasdiqlang.",
  submit: "Zenodo’ga joylash",
  retry: "Qayta urinish",
  busy: "Zenodo’ga o‘tilmoqda…",
  failed: "Joylab bo‘lmadi.",
  inProgress: "Zenodo’ga joylanmoqda…",
  record: "Zenodo’dagi yozuv",
  ineligible: "Maqola boshqa joyda chop etilgan — Zenodo’ga joylanmaydi.",
};

const FLASH: Record<ZenodoFlash, string> = {
  denied: "Zenodo’da ruxsat berilmadi.",
  expired: "Havola eskirgan. Qayta urinib ko‘ring.",
  changed: "Maqola ma’lumotlari o‘zgargan. Qayta tekshirib, tasdiqlang.",
  failed: "Joylab bo‘lmadi. Qayta urinib ko‘ring.",
};

const ERROR_TEXT: Record<ZenodoErrorCode | "interrupted", string> = {
  grant: "Zenodo ruxsati olinmadi. Qayta urinib ko‘ring.",
  account_taken: "Bu Zenodo akkaunti boshqa o‘qituvchiniki. Zenodo’dan chiqib, o‘z akkauntingiz bilan kiring.",
  unavailable: "Zenodo javob bermadi. Birozdan so‘ng qayta urinib ko‘ring.",
  rate_limited: "Zenodo so‘rovlar limiti. Bir daqiqadan so‘ng qayta urinib ko‘ring.",
  rejected: "Zenodo ma’lumotlarni qabul qilmadi. Administratorga xabar berildi.",
  blocked: "Zenodo akkauntingizni blokladi. support@zenodo.org manziliga yozing.",
  config: "Zenodo bilan aloqa sozlamasida xato. Administratorga xabar berildi.",
  file: "PDF yuklanmadi. Qayta urinib ko‘ring.",
  article_changed: "Joylash paytida maqola holati o‘zgardi. Sahifani yangilang.",
  internal: "Kutilmagan xato. Qayta urinib ko‘ring.",
  interrupted: "Oldingi urinish yakunlanmadi. Qayta urinib ko‘ring.",
};

type Props = { id: number; sandbox: boolean; flash: ZenodoFlash | null; panel: ZenodoPanelData };

/** Chop etilgan maqolani o‘qituvchining o‘z Zenodo akkaunti orqali joylash va doimiy DOI olish */
export function ZenodoPanel({ id, sandbox, flash, panel }: Props) {
  const heading = useId();
  return (
    <section aria-labelledby={heading} className="mt-4 space-y-3 rounded-xl border border-line bg-paper p-5">
      <h2 id={heading} className="font-serif text-lg font-semibold">
        {sandbox ? TEXT.sandbox : TEXT.title}
      </h2>
      {/* Eski havoladagi (Orqaga, qayta yuklash) xato belgisi DOI yonida chiqmasin */}
      {flash && panel.state !== "published" && (
        <p role="status" className="text-sm font-medium">
          {FLASH[flash]}
        </p>
      )}
      {panel.state === "ineligible" && <p className="text-sm text-muted">{TEXT.ineligible}</p>}
      {panel.state === "in_progress" && <InProgress />}
      {panel.state === "published" && (
        <p className="text-sm">
          <span className="text-muted">DOI: </span>
          <a href={panel.doiHref} className="link" target="_blank" rel="noopener noreferrer">
            {panel.doi}
          </a>
          {" · "}
          <a href={panel.recordUrl} className="link" target="_blank" rel="noopener noreferrer">
            {TEXT.record}
          </a>
        </p>
      )}
      {panel.state === "ready" && <Ready id={id} {...panel} />}
    </section>
  );
}

/** Boshqa oynadagi joylash tugashi bilan natija ko‘rinsin */
function InProgress() {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(timer);
  }, [router]);
  return (
    <p role="status" className="text-sm">
      {TEXT.inProgress}
    </p>
  );
}

function Ready({ id, hash, preview, licenseLabel, error }: Extract<ZenodoPanelData, { state: "ready" }> & { id: number }) {
  const checkbox = useId();
  const [rights, setRights] = useState(false);
  const [rightsError, setRightsError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  async function start() {
    if (busy) return;
    if (!rights) {
      setRightsError(true);
      document.getElementById(checkbox)?.focus();
      return;
    }
    setBusy(true);
    setStartError(null);
    const res = await postJson<{ url: string }>(`/api/articles/${id}/zenodo`, { rights: true, hash });
    if (res.ok) {
      // Tugma Zenodo sahifasi ochilguncha band qoladi
      window.location.assign(res.url);
      return;
    }
    setBusy(false);
    if (res.error.fieldErrors?.rights) setRightsError(true);
    else setStartError(res.error.message);
  }

  return (
    <>
      <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[max-content_minmax(0,1fr)]">
        {preview.map(([label, value]) => (
          <Fragment key={label}>
            <dt className="text-muted">{label}</dt>
            <dd className="mb-1 break-words sm:mb-0">{value}</dd>
          </Fragment>
        ))}
      </dl>
      <p className="text-sm font-medium text-danger">{TEXT.warning}</p>
      <div>
        <label className="flex items-start gap-2 text-sm leading-relaxed">
          <input
            id={checkbox}
            type="checkbox"
            checked={rights}
            aria-invalid={rightsError || undefined}
            aria-describedby={rightsError ? `${checkbox}-m` : undefined}
            onChange={(e) => {
              setRights(e.target.checked);
              setRightsError(false);
            }}
            className="mt-1 size-4 shrink-0 accent-[var(--lapis)]"
          />
          <span>{TEXT.rights(licenseLabel)}</span>
        </label>
        {rightsError && (
          <p id={`${checkbox}-m`} className="mt-1.5 text-sm text-danger">
            {TEXT.rightsRequired}
          </p>
        )}
      </div>
      <button type="button" className="btn btn-primary" aria-disabled={busy} onClick={start}>
        {busy ? TEXT.busy : error ? TEXT.retry : TEXT.submit}
      </button>
      {(error || startError) && (
        <div role="alert" className="space-y-1 text-sm text-danger">
          {error && (
            <p>
              {TEXT.failed} {ERROR_TEXT[error.code]}
            </p>
          )}
          {error?.detail && <p className="text-xs text-muted">{error.detail}</p>}
          {startError && <p>{startError}</p>}
        </div>
      )}
    </>
  );
}
