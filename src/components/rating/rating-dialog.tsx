import type { Lang } from "@/lib/langs";
import { RatingForm } from "./rating-form";
import { ratingText } from "./text";

/** Maqola sahifasidagi «Iqtibos keltirish» tugmalari shu oynani ochadi (popoverTarget) */
export const RATING_DIALOG_ID = "iqtibos-yozish";

/**
 * «Iqtibos keltirish» oynasi: baho + iqtibos formasi, kirmagan yoki muallif bo‘lsa — ogohlantirish (forma o‘zi
 * tanlaydi). Popover API: JS’siz ochiladi, Esc va tashqariga bosish yopadi. Sarlavha — formaning o‘zi (h3).
 */
export function RatingDialog({ articleId, lang = "uz" }: { articleId: number; lang?: Lang }) {
  return (
    <div
      id={RATING_DIALOG_ID}
      popover="auto"
      role="dialog"
      aria-labelledby="rating-form-title"
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(36rem,calc(100%-2rem))] overflow-y-auto rounded-2xl border border-line bg-paper p-0 text-ink backdrop:bg-ink/50"
    >
      <div className="relative p-6">
        <button
          type="button"
          popoverTarget={RATING_DIALOG_ID}
          popoverTargetAction="hide"
          aria-label={ratingText[lang].form.close}
          className="btn btn-ghost absolute top-4 right-4 px-2.5"
        >
          <span aria-hidden="true">✕</span>
        </button>
        <RatingForm articleId={articleId} />
      </div>
    </div>
  );
}
