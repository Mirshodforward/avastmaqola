"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { flushSync } from "react-dom";
import { getJson, sendJson } from "@/lib/api-client";
import { RATING_LIMITS, STAR_VALUES, type RatingStatus } from "@/lib/rating-rules";
import type { MyRating } from "@/server/ratings/service";
import { s } from "./styles";
import { StarShape } from "./stars";
import { T } from "./text";

type Me = ({ name: string } & MyRating) | null;
type Saved = NonNullable<MyRating["rating"]>;

/**
 * Baho berish. Maqola sahifasi statik (sessiya o‘qilmaydi), shuning uchun kim kirganini forma o‘zi so‘raydi:
 * kirmagan — kirish tugmasi, muallif — izoh, qolganlar — forma (avvalgi bahosi bilan to‘ldirilgan).
 */
export function RatingForm({ articleId }: { articleId: number }) {
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
    <section aria-labelledby="rating-form-title" aria-busy={me === undefined && !loadError} className={s.panel}>
      <h3 id="rating-form-title" className="text-lg font-semibold">
        {T.form.title}
      </h3>
      {loadError ? (
        <p role="alert" className={`${s.error} mt-3 text-sm`}>
          {loadError}
        </p>
      ) : me === undefined ? (
        <p className={`${s.muted} mt-3 text-sm`}>{T.form.loading}</p>
      ) : me === null ? (
        <SignIn expired={expired} />
      ) : me.isAuthor ? (
        <p className={`${s.muted} mt-3`}>{T.form.own}</p>
      ) : (
        <Form
          articleId={articleId}
          name={me.name}
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

/** expired: yuborishda sessiya tugagan — forma yo‘qoladi, shuning uchun xabar e’lon qilinadi va fokus kirish tugmasiga o‘tadi */
function SignIn({ expired }: { expired: boolean }) {
  const login = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (expired) login.current?.focus();
  }, [expired]);

  return (
    <>
      <p role={expired ? "alert" : undefined} className={`${s.muted} mt-3`}>
        {expired ? T.form.expired : T.form.signIn}
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Link ref={login} href="/login" className={s.submit}>
          {T.form.signInButton}
        </Link>
        <Link href="/register" className={s.ghost}>
          {T.form.register}
        </Link>
      </div>
    </>
  );
}

function Form({
  articleId,
  name,
  saved,
  onSignedOut,
}: {
  articleId: number;
  name: string;
  saved: Saved | null;
  onSignedOut: () => void;
}) {
  const [stars, setStars] = useState(saved?.stars ?? 0);
  const [hover, setHover] = useState(0);
  const [picked, setPicked] = useState(0); // tanlash animatsiyasi faqat foydalanuvchi bosganda
  const [body, setBody] = useState(saved?.body ?? "");
  const [status, setStatus] = useState<RatingStatus | null>(saved?.status ?? null);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<{ stars?: string; body?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const bodyId = useId();
  const starsRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const shown = hover || stars;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    // flushSync: xato matni va aria-describedby fokus kelguncha DOM’da bo‘lsin — ekran o‘quvchi ularni birga o‘qiydi
    if (!stars) {
      flushSync(() => setErrors({ stars: T.form.starsRequired }));
      starsRef.current?.querySelector("input")?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    setErrors({});
    setSent(false);
    const res = await sendJson<{ rating: Saved; changed: boolean }>("PUT", `/api/articles/${articleId}/rating`, { stars, body });
    setBusy(false);
    if (res.ok) {
      setBody(res.rating.body);
      setStatus(res.rating.status);
      // O‘zgarmagan matn qayta yuborilmaydi — holat xabari (masalan, "chop etilgan") o‘z joyida qoladi
      setSent(res.changed);
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
    <form onSubmit={submit} noValidate className="mt-1">
      <p className={`${s.muted} text-sm`}>{name}</p>

      <fieldset className="mt-5">
        <legend className="text-sm font-medium">{T.form.stars}</legend>
        <div ref={starsRef} className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <div className={s.picker} onMouseLeave={() => setHover(0)}>
            {STAR_VALUES.map((v) => (
              <label
                key={v}
                className={s.pick}
                data-lit={shown >= v || undefined}
                data-picked={picked === v || undefined}
                onMouseEnter={() => setHover(v)}
              >
                <input
                  type="radio"
                  name="stars"
                  value={v}
                  checked={stars === v}
                  required
                  aria-label={`${T.form.star(v)}, ${T.form.starWords[v - 1]}`}
                  aria-describedby={errors.stars ? `${bodyId}-s` : undefined}
                  onChange={() => {
                    setStars(v);
                    setPicked(v);
                    setErrors((x) => ({ ...x, stars: undefined }));
                  }}
                />
                <StarShape lit={shown >= v} />
              </label>
            ))}
          </div>
          <span aria-hidden="true" className="min-w-20 text-sm font-medium">
            {shown ? T.form.starWords[shown - 1] : ""}
          </span>
        </div>
        {errors.stars && (
          <p id={`${bodyId}-s`} className={`${s.error} mt-2 text-sm`}>
            {errors.stars}
          </p>
        )}
      </fieldset>

      <div className="mt-5">
        <label htmlFor={bodyId} className="text-sm font-medium">
          {T.form.body}
        </label>
        <textarea
          ref={bodyRef}
          id={bodyId}
          name="body"
          rows={5}
          maxLength={RATING_LIMITS.bodyMax}
          required
          value={body}
          placeholder={T.form.bodyPlaceholder}
          aria-invalid={errors.body ? true : undefined}
          aria-describedby={`${bodyId}-m`}
          className={`${s.field} mt-2`}
          onChange={(e) => {
            setBody(e.target.value);
            setErrors((x) => ({ ...x, body: undefined }));
          }}
        />
        <p id={`${bodyId}-m`} className="mt-1.5 flex justify-between gap-3 text-sm">
          <span className={errors.body ? s.error : s.muted}>{errors.body ?? T.form.bodyMin(RATING_LIMITS.bodyMin)}</span>
          <span className={`${s.muted} tabular-nums`}>{T.form.counter(body.length, RATING_LIMITS.bodyMax)}</span>
        </p>
      </div>

      <button type="submit" className={`${s.submit} mt-5`} aria-disabled={busy}>
        {T.form.submit}
      </button>
      {/* Jonli hudud doim DOM’da: holat o‘zgarsa ekran o‘quvchi e’lon qiladi */}
      <p role="status" className="mt-4 text-sm">
        {sent ? T.form.sent : status ? T.form.status[status] : ""}
      </p>
      {error && (
        <p role="alert" className={`${s.error} mt-2 text-sm`}>
          {error}
        </p>
      )}
    </form>
  );
}
