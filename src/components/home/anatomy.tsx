import { homeText } from "@/i18n/home";
import type { Lang } from "@/lib/langs";
import { HomeSection } from "./home-section";
import { seq } from "./motion";

/** Raqamli belgi: sxemadagi joy va o‘ngdagi izoh bir xil raqam bilan bog‘lanadi (haqiqiy moslik, bezak emas) */
const PIN = "grid size-6 shrink-0 place-items-center rounded-full bg-tile font-serif text-xs font-semibold text-paper";

/** Sxemadagi belgi: sxema ko‘rinishga kirganda ketma-ket "chiqadi" (m-pop, sxemaning vaqt chizig‘ida — tl-grp) */
function Pin({ n, corner = false }: { n: number; corner?: boolean }) {
  return (
    <span
      style={seq(n - 1)}
      className={`${PIN} m-pop tl-grp absolute ${corner ? "-top-2 -right-2" : "top-1/2 right-0 -translate-y-1/2"}`}
    >
      {n}
    </span>
  );
}

/**
 * Chop etilgan maqola sahifasining sxemasi. Matn o‘rnida chiziqlar: soxta maqola ko‘rsatilmaydi
 * (qidiruv tizimlari uni haqiqiy deb indekslab olmasin). Ekran o‘quvchi uchun yashirin — ma’lumot o‘ngdagi ro‘yxatda.
 */
function PageSketch() {
  const line = "h-2 rounded-full bg-ink/12";
  return (
    <div aria-hidden="true" className="m-rise vt-grp w-full max-w-md rounded-2xl border border-line bg-mist p-5 shadow-lg shadow-ink/5 sm:p-6">
      <div className="relative flex items-center gap-1.5 pr-9">
        <span className="rounded-md bg-lapis px-2 py-1 text-[11px] font-semibold text-on-lapis">UZ</span>
        <span className="rounded-md border border-line px-2 py-1 text-[11px] font-medium text-muted">RU</span>
        <span className="rounded-md border border-line px-2 py-1 text-[11px] font-medium text-muted">EN</span>
        <Pin n={1} />
      </div>

      <div className="mt-5 space-y-2">
        <div className="h-3 w-11/12 rounded-full bg-ink/70" />
        <div className="h-3 w-7/12 rounded-full bg-ink/70" />
      </div>

      <div className="relative mt-5 flex items-center gap-2.5 pr-9">
        <span className="size-7 shrink-0 rounded-full bg-tile/25" />
        <div className="flex-1 space-y-1.5">
          <div className={`${line} w-2/5`} />
          <div className="h-1.5 w-1/4 rounded-full bg-ink/8" />
        </div>
        <span className="rounded border border-line px-1.5 py-0.5 text-[10px] font-medium text-muted">ORCID</span>
        <Pin n={2} />
      </div>

      <div className="relative mt-5 space-y-2 pr-9">
        <div className={`${line} w-full`} />
        <div className={`${line} w-11/12`} />
        <div className={`${line} w-full`} />
        <div className={`${line} w-3/5`} />
        <Pin n={3} />
      </div>

      <div className="mt-4 flex gap-1.5">
        <span className="h-5 w-14 rounded-full border border-line" />
        <span className="h-5 w-20 rounded-full border border-line" />
        <span className="h-5 w-12 rounded-full border border-line" />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="relative rounded-lg bg-lapis px-3 py-2.5 text-on-lapis">
          <p className="text-xs font-semibold">PDF</p>
          <p className="text-[10px] opacity-80">CC BY 4.0</p>
          <Pin n={4} corner />
        </div>
        <div className="relative rounded-lg border border-line bg-paper px-3 py-2.5">
          <p className="text-xs font-semibold">
            APA <span className="font-normal text-muted">BibTeX</span>
          </p>
          <p className="mt-0.5 h-1.5 w-3/4 rounded-full bg-ink/12" />
          <Pin n={5} corner />
        </div>
      </div>

      <div className="relative mt-5 flex flex-wrap gap-1.5 pr-9">
        {["citation_title", "citation_author", "citation_pdf_url"].map((tag) => (
          <span key={tag} className="rounded border border-dashed border-line px-1.5 py-0.5 font-mono text-[10px] text-muted">
            {tag}
          </span>
        ))}
        <Pin n={6} />
      </div>
    </div>
  );
}

/** Imkoniyatlar — bitta narsa: maqola sahifasining anatomiyasi (chapda sxema, o‘ngda raqamlangan izohlar) */
export function HomeAnatomy({ lang }: { lang: Lang }) {
  // Tartib sxemadagi 1–6 belgilar bilan bir xil
  const t = homeText[lang].features;
  return (
    <HomeSection id="features-title" title={t.title} tone="paper" stacked>
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] lg:gap-20">
        <PageSketch />
        <ol className="divide-y divide-line">
          {t.items.map((f, i) => (
            <li key={f.title} className="m-slide grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-4 py-5 first:pt-0 last:pb-0">
              <span aria-hidden="true" className={`${PIN} m-pop mt-0.5`}>
                {i + 1}
              </span>
              <div>
                <p className="font-medium">{f.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{f.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </HomeSection>
  );
}
