"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { flushSync } from "react-dom";
import { getJson, sendJson } from "@/lib/api-client";
import { RATING_LIMITS, STAR_VALUES, type RatingStatus } from "@/lib/rating-rules";
import type { MyRating } from "@/server/ratings/service";
import { localePath } from "@/i18n/lang";
import { useLang } from "@/i18n/use-lang";
import { StarShape } from "./stars";
import { ratingText } from "./text";

type Me = ({ name: string } & MyRating) | null;
type Saved = NonNullable<MyRating["rating"]>;

/** Belgilar hisoblagichi faqat chegaraga yaqinlashganda ko‘rinadi */
const COUNTER_FROM = RATING_LIMITS.bodyMax - 100;
const STATUS_TONE: Record<RatingStatus, string> = { pending: "text-muted", approved: "text-tile", rejected: "text-danger" };

/**
 * Baho berish. Maqola sahifasi statik (sessiya o‘qilmaydi), shuning uchun kim kirganini forma o‘zi so‘raydi:
 * kirmagan — kirish tugmasi, muallif — izoh, qolganlar — forma (avvalgi bahosi bilan to‘ldirilgan).
 */
export function RatingForm({ articleId }: { articleId: number }) {
  const T = ratingText[useLang()];
  const [me, setMe] = useState<Me | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    let alive = true;
    getJson<{ me: Me }>(`/api/articles/${articleId}/rating`).then((res) => {
      if (!alive) return;
      if (res.ok) setMe(res.me);
      else setLoadError(res.error.message);
    });
    return () => {
      alive = false;
    };
  }, [articleId]);

  return (
    <section aria-labelledby="rating-form-title" aria-busy={me === undefined && !loadError}>
      {/* Oyna sarlavhasi (rating-dialog.tsx); o‘ngda yopish tugmasi — matn uning ostiga kirmasin */}
      <h3 id="rating-form-title" className="pr-12 font-serif text-lg font-semibold">
        {T.form.title}
      </h3>
      {loadError ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {loadError}
        </p>
      ) : me === undefined ? (
        <p className="mt-2 text-sm text-muted">{T.form.loading}</p>
      ) : me === null ? (
        <SignIn articleId={articleId} expired={expired} />
      ) : me.isAuthor ? (
        <p className="mt-4 rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-danger">{T.form.own}</p>
      ) : (
        <Form
          articleId={articleId}
          saved={me.rating}
          onSignedOut={() => {
            setExpired(true);
            setMe(null);
          }}
        />
      )}
    </section>
  );
}

/**
 * expired: yuborishda sessiya tugagan — forma yo‘qoladi, shuning uchun xabar e’lon qilinadi va fokus kirish tugmasiga o‘tadi.
 * Fokus o‘tganda ekran o‘quvchi alert’ni uzib qo‘yishi mumkin — xabar tugmaning tavsifi sifatida ham o‘qiladi.
 */
function SignIn({ articleId, expired }: { articleId: number; expired: boolean }) {
  const lang = useLang();
  const T = ratingText[lang];
  const login = useRef<HTMLAnchorElement>(null);
  // Kirgandan keyin shu maqolaning (shu tildagi) baho formasiga qaytadi (telegram-verify.tsx → safeNext)
  const href = `/login?next=${encodeURIComponent(`${localePath(lang, `/maqola/${articleId}`)}#iqtiboslar`)}`;
  const id = useId();
  useEffect(() => {
    if (expired) login.current?.focus();
  }, [expired]);

  return (
    <div className="mt-4 rounded-lg border border-line bg-mist px-4 py-3">
      <p id={id} role={expired ? "alert" : undefined}>
        {expired ? T.form.expired : T.form.signIn}
      </p>
      <Link ref={login} href={href} aria-describedby={expired ? id : undefined} className="btn btn-primary mt-3">
        {T.form.signInButton}
      </Link>
    </div>
  );
}

function Form({ articleId, saved, onSignedOut }: { articleId: number; saved: Saved | null; onSignedOut: () => void }) {
  const T = ratingText[useLang()];
  const [stars, setStars] = useState(saved?.stars ?? 0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState(saved?.body ?? "");
  const [status, setStatus] = useState<RatingStatus | null>(saved?.status ?? null);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<{ stars?: string; body?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const id = useId();
  const starsRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const shown = hover || stars;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    // Ikkala xato birdan ko‘rsatiladi, fokus birinchisiga. Eng kam uzunlik faqat xato sifatida (oldindan yordamchi matn
    // yo‘q); yakuniy tekshiruv — serverda. flushSync: xato matni va aria-describedby fokus kelguncha DOM’da bo‘lsin
    const local = {
      stars: stars ? undefined : T.form.starsRequired,
      body: body.trim().length < RATING_LIMITS.bodyMin ? T.form.bodyMin(RATING_LIMITS.bodyMin) : undefined,
    };
    if (local.stars || local.body) {
      flushSync(() => setErrors(local));
      if (local.stars) starsRef.current?.querySelector("input")?.focus();
      else bodyRef.current?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    setErrors({});
    const res = await sendJson<{ rating: Saved; changed: boolean }>("PUT", `/api/articles/${articleId}/rating`, { stars, body });
    setBusy(false);
    // O‘zgarmagan matn qayta yuborilmaydi — holat xabari (masalan, "chop etilgan") o‘z joyida qoladi.
    // Yuborish paytida eski holat qaytib e’lon qilinmasin: "yuborildi" faqat javobdan keyin almashadi
    setSent(res.ok && res.changed);
    if (res.ok) {
      setBody(res.rating.body);
      setStatus(res.rating.status);
      return;
    }
    if (res.error.code === "unauthorized") return onSignedOut();
    const fields = res.error.fieldErrors ?? {};
    if (fields.stars || fields.body) {
      flushSync(() => setErrors({ stars: fields.stars, body: fields.body }));
      if (fields.body) bodyRef.current?.focus();
    } else setError(res.error.message);
  }

  return (
    <form onSubmit={submit} noValidate className="mt-4 max-w-xl space-y-5">
      <fieldset>
        <legend className="text-sm font-medium">{T.form.stars}</legend>
        {/* Har bir yulduz — 44px bosish maydoni; tanlov shakl bilan ko‘rinadi (to‘la/bo‘sh), harakatsiz.
            Oldindan ko‘rish faqat sichqonda: barmoq bosgandan keyin "hover" yopishib qolib, tanlovni yashirmasin */}
        <div ref={starsRef} className="mt-1 flex" onPointerLeave={() => setHover(0)}>
          {STAR_VALUES.map((v) => (
            <label
              key={v}
              className="relative grid size-11 cursor-pointer place-items-center rounded-lg has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-tile"
              onPointerEnter={(e) => e.pointerType === "mouse" && setHover(v)}
            >
              <input
                type="radio"
                name="stars"
                value={v}
                checked={stars === v}
                required
                aria-label={`${T.form.star(v)}, ${T.form.starWords[v - 1]}`}
                aria-describedby={errors.stars ? `${id}-s` : undefined}
                className="absolute inset-0 m-0 cursor-pointer appearance-none opacity-0"
                onChange={() => {
                  setStars(v);
                  setHover(0); // strelka bilan tanlanganda sichqon ostidagi yulduz tanlovni yashirmasin
                  setErrors((x) => ({ ...x, stars: undefined }));
                }}
              />
              <StarShape lit={shown >= v} className={`size-8 ${shown >= v ? "text-lapis" : "text-[var(--input-border)]"}`} />
            </label>
          ))}
        </div>
        {errors.stars && (
          <p id={`${id}-s`} className="mt-1 text-sm text-danger">
            {errors.stars}
          </p>
        )}
      </fieldset>

      <div>
        <label htmlFor={id} className="text-sm font-medium">
          {T.form.body}
        </label>
        <textarea
          ref={bodyRef}
          id={id}
          name="body"
          rows={5}
          maxLength={RATING_LIMITS.bodyMax}
          required
          value={body}
          placeholder={T.form.bodyPlaceholder}
          aria-invalid={errors.body ? true : undefined}
          aria-describedby={`${id}-m`}
          // placeholder:text-muted — umumiy .input’dagi xira rang (3:1) o‘rniga to‘liq kontrast (WCAG 1.4.3)
          className="input mt-1.5 block resize-y leading-relaxed placeholder:text-muted"
          onChange={(e) => {
            setBody(e.target.value);
            setErrors((x) => ({ ...x, body: undefined }));
          }}
        />
        <p id={`${id}-m`} className="mt-1.5 flex gap-3 text-sm empty:hidden">
          {errors.body && <span className="text-danger">{errors.body}</span>}
          {body.length >= COUNTER_FROM && (
            <span className="ml-auto text-muted tabular-nums">{T.form.counter(body.length, RATING_LIMITS.bodyMax)}</span>
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <button type="submit" className="btn btn-primary" aria-disabled={busy}>
          {T.form.submit}
        </button>
        {/* Jonli hudud doim DOM’da: holat o‘zgarsa ekran o‘quvchi e’lon qiladi */}
        <p role="status" className={`text-sm ${sent ? "font-medium text-tile" : status ? STATUS_TONE[status] : ""}`}>
          {sent ? T.form.sent : status ? T.form.status[status] : ""}
        </p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
