import type { ReactNode } from "react";
import { HomeSection } from "./home-section";

/** Ikonkalar bitta uslubda: 24px chiziqli, currentColor */
function Icon({ children }: { children: ReactNode }) {
  return (
    <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-lg bg-tile-soft text-tile">
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </span>
  );
}

const FEATURES = [
  {
    title: "Uch tilda",
    text: "Sarlavha, annotatsiya va kalit so‘zlar o‘zbek, rus va ingliz tilida.",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
      </>
    ),
  },
  {
    title: "Google Scholar",
    text: "Har bir maqola sahifasi Scholar indeksi uchun moslangan.",
    icon: (
      <>
        <path d="M2 9l10-5 10 5-10 5-10-5z" />
        <path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" />
      </>
    ),
  },
  {
    title: "Ochiq kirish",
    text: "PDF va annotatsiya hammaga ochiq, CC BY 4.0 litsenziyasi bilan.",
    icon: (
      <>
        <rect x="4" y="11" width="16" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 7.5-2" />
      </>
    ),
  },
  {
    title: "AI yordamchi",
    text: "PDF asosida sarlavha, annotatsiya va kalit so‘zlarni uch tilda to‘ldiradi.",
    icon: <path d="M12 3c.4 4.6 2.9 7.1 7.5 7.5-4.6.4-7.1 2.9-7.5 7.5-.4-4.6-2.9-7.1-7.5-7.5C9.1 10.1 11.6 7.6 12 3z" />,
  },
  {
    title: "Tayyor iqtibos",
    text: "APA va BibTeX formatida bir bosishda nusxa olinadi.",
    icon: (
      <>
        <path d="M7 7h4v4c0 3-1.5 5-4 6" />
        <path d="M14 7h4v4c0 3-1.5 5-4 6" />
      </>
    ),
  },
  {
    title: "Muallif profili",
    text: "Rasm, lavozim, ORCID iD va barcha maqolalar bitta sahifada.",
    icon: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
      </>
    ),
  },
];

export function HomeFeatures() {
  return (
    <HomeSection id="features-title" title="Imkoniyatlar" tone="paper">
      <ul className="grid gap-x-8 gap-y-8 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <li key={f.title} className="flex gap-4">
            <Icon>{f.icon}</Icon>
            <div>
              <p className="font-medium">{f.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{f.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </HomeSection>
  );
}
