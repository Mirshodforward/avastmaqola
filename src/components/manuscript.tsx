import { OrcidIcon } from "./orcid-icon";

const slip = [
  { place: "ORCID profilingiz", state: "joylandi", done: true },
  { place: "Zenodo, DOI bilan", state: "joylandi", done: true },
  { place: "Universitet repozitoriysi", state: "joylandi", done: true },
  { place: "Google Scholar", state: "indekslanmoqda", done: false },
];

/** Bosh sahifadagi namuna: maqolaning birinchi varag‘i va uning joylash varaqasi. */
export function Manuscript() {
  return (
    <figure className="mx-auto w-full max-w-md" aria-label="Namuna: maqola va uning joylanish holati">
      <div className="-rotate-1 rounded-sm bg-sheet p-7 text-sheet-ink shadow-[0_1px_0_var(--sheet-line),0_28px_56px_-28px_rgba(13,20,36,0.45)] sm:p-9">
        <p className="text-xs text-sheet-muted">Preprint, 2026</p>
        <p className="mt-3 font-serif text-xl leading-snug font-semibold">
          Farg‘ona vodiysi tuproqlarining sho‘rlanish dinamikasi (2015–2024)
        </p>
        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="inline-flex items-center gap-1">
            D. Rahimova <OrcidIcon className="size-3.5" />
          </span>
          <span className="inline-flex items-center gap-1">
            A. Karimov <OrcidIcon className="size-3.5" />
          </span>
        </p>

        <div className="mt-5 space-y-2" aria-hidden="true">
          <p className="font-serif text-sm italic text-sheet-muted">Annotatsiya</p>
          {["w-full", "w-full", "w-11/12", "w-full", "w-2/3"].map((width, i) => (
            <div key={i} className={`h-1.5 rounded-full bg-sheet-line ${width}`} />
          ))}
        </div>

        <div className="mt-7 border-t-[3px] border-double border-sheet-line pt-4">
          <p className="font-serif text-sm font-semibold">Joylash varaqasi</p>
          <ul className="mt-2.5 space-y-1.5 text-sm">
            {slip.map((row, i) => (
              <li
                key={row.place}
                className="slip-row flex items-baseline gap-2"
                style={{ animationDelay: `${500 + i * 420}ms` }}
              >
                <span>{row.place}</span>
                <span className="flex-1 border-b border-dotted border-sheet-muted/50" aria-hidden="true" />
                <span className={row.done ? "font-medium text-sheet-accent" : "text-sheet-muted"}>
                  {row.state}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </figure>
  );
}
