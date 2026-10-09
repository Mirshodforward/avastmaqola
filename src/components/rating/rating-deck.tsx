"use client";

import Link from "next/link";
import { useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { s } from "./styles";
import { Stars } from "./stars";
import { T } from "./text";

export type DeckItem = {
  id: number;
  stars: number;
  body: string;
  name: string;
  slug: string | null;
  dateText: string;
  dateIso: string;
};

/** Oldingi karta va uning ortida ko‘rinadigan 3 ta; qolganlari to‘plam ichida yashirin */
const VISIBLE = 4;

const AVATARS = [
  "linear-gradient(135deg, #2b59c3, #4fc2c0)",
  "linear-gradient(135deg, #5b4bc4, #2b59c3)",
  "linear-gradient(135deg, #0f7b83, #4fc2c0)",
  "linear-gradient(135deg, #7c3aed, #3554c8)",
];

/** Bir xil ism doim bir xil rangda (sahifa qayta yuklansa ham) */
export function avatarStyle(name: string): CSSProperties {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.codePointAt(0)!) >>> 0;
  return { background: AVATARS[hash % AVATARS.length] };
}

export function ReviewerName({ name, slug }: { name: string; slug: string | null }) {
  return slug ? (
    <Link href={`/oqituvchi/${slug}`} className="underline-offset-4 hover:underline">
      {name}
    </Link>
  ) : (
    name
  );
}

/** Iqtiboslar 3D to‘plami: old kartani bosish yoki surish — keyingisi; tugmalar klaviatura va ekran o‘quvchi uchun */
export function RatingDeck({ items }: { items: DeckItem[] }) {
  const [current, setCurrent] = useState(0);
  const startX = useRef<number | null>(null);
  const n = items.length;
  const go = (step: number) => setCurrent((c) => (c + step + n) % n);

  function onPointerDown(e: PointerEvent) {
    // Faqat asosiy tugma: o‘ng tugma (nusxalash, tarjima) kartani almashtirmasin
    startX.current = e.button === 0 ? e.clientX : null;
  }

  function onPointerUp(e: PointerEvent) {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    startX.current = null;
    // Surish — faqat barmoq yoki qalam bilan; sichqonda tortish matn belgilash degani
    if (e.pointerType !== "mouse" && Math.abs(dx) > 40) return go(dx < 0 ? 1 : -1);
    // Oddiy bosish faqat old kartada (profil havolasi va matn belgilash bundan mustasno)
    if (Math.abs(dx) < 6 && window.getSelection()?.isCollapsed !== false) {
      const target = e.target as HTMLElement;
      if (target.closest("[data-front]") && !target.closest("a")) go(1);
    }
  }

  return (
    <div>
      <div
        role="region"
        aria-roledescription="karusel"
        aria-label={T.deck.label}
        className={s.deck}
        // Ortdagi kartalar bo‘yi: har biri 2,5rem yuqoriga chiqadi
        style={{ height: `${15 + Math.min(n - 1, VISIBLE - 1) * 2.5}rem` }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (startX.current = null)}
      >
        <div className={s.deckInner}>
          {items.map((item, i) => {
            const depth = (i - current + n) % n;
            const front = depth === 0;
            return (
              <figure
                key={item.id}
                role="group"
                aria-roledescription={T.deck.slide}
                aria-label={T.deck.position(i + 1, n)}
                aria-hidden={front ? undefined : true}
                inert={!front}
                data-front={front || undefined}
                data-hidden={depth >= VISIBLE || undefined}
                className={s.plate}
                style={{ "--d": Math.min(depth, VISIBLE) } as CSSProperties}
              >
                <span aria-hidden="true" className={s.quoteMark}>
                  «
                </span>
                <blockquote className={`${s.quote} ${s.clamp} mt-3 flex-1`}>{item.body}</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span aria-hidden="true" className={s.avatar} style={avatarStyle(item.name)}>
                    {item.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    {/* p-1/-m-1: truncate’ning overflow:hidden fokus halqasini kesmasin */}
                    <span className="-m-1 block truncate p-1 font-semibold">
                      <ReviewerName name={item.name} slug={item.slug} />
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                      <Stars value={item.stars} label={T.deck.stars(item.stars)} />
                      <time dateTime={item.dateIso} className={s.muted}>
                        {item.dateText}
                      </time>
                    </span>
                  </span>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>

      {n > 1 && (
        <div className="mt-6 flex items-center justify-center gap-5">
          <button type="button" className={s.round} aria-label={T.deck.prev} onClick={() => go(-1)}>
            <Chevron flip />
          </button>
          <p aria-live="polite" className="min-w-14 text-center text-sm tabular-nums">
            {T.deck.position(current + 1, n)}
          </p>
          <button type="button" className={s.round} aria-label={T.deck.next} onClick={() => go(1)}>
            <Chevron />
          </button>
        </div>
      )}
    </div>
  );
}

function Chevron({ flip = false }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" style={flip ? { transform: "scaleX(-1)" } : undefined}>
      <path d="M7.5 4.5 13 10l-5.5 5.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
