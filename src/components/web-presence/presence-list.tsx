import { Chip } from "@/components/article/status-chip";
import { formatDate } from "@/lib/format";
import type { PresenceCategory, PresenceResult } from "@/lib/web-presence";

const GROUPS: { category: PresenceCategory; title: string }[] = [
  { category: "profile", title: "Profillar" },
  { category: "publication", title: "Ilmiy ishlar" },
  { category: "mention", title: "Boshqa eslatmalar" },
];

/**
 * Oxirgi izlash natijasi. Matn faqat React orqali (HTML emas); havolalar yangi oynada, referer va "follow"siz.
 * "Aniq" — ORCID, OpenAlex yoki profildagi havola; "Ehtimol" — veb-qidiruvda topilgan.
 */
export function PresenceList({ result, searchedAt }: { result: PresenceResult; searchedAt: Date }) {
  const count = result.items.length;
  return (
    <section aria-labelledby="presence-summary" className="mt-10">
      {/* Izlash tugagach fokus shu yerga o‘tadi (presence-search.tsx) */}
      <h2 id="presence-summary" tabIndex={-1} className="text-sm text-muted outline-none!">
        Oxirgi izlash: {formatDate(searchedAt)} · {count} ta topildi
      </h2>
      {result.orcid === "mismatch" && (
        <p className="mt-2 text-sm text-danger">ORCID’dagi ism profildagi familiyaga mos kelmadi, shuning uchun ORCID ishlatilmadi.</p>
      )}
      {count === 0 && <p className="mt-6">Hech narsa topilmadi.</p>}

      {GROUPS.map((group) => {
        const items = result.items.filter((item) => item.category === group.category);
        if (!items.length) return null;
        return (
          <section key={group.category} aria-labelledby={`presence-${group.category}`} className="mt-8">
            <h3 id={`presence-${group.category}`} className="font-serif text-xl font-semibold">
              {group.title} <span className="tabular-nums text-muted">{items.length}</span>
            </h3>
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {items.map((item) => (
                <li key={item.url} className="grid gap-x-6 gap-y-1.5 py-4 sm:grid-cols-[1fr_auto] sm:items-baseline">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow ugc"
                    referrerPolicy="no-referrer"
                    className="min-w-0 break-words font-medium hover:text-lapis"
                  >
                    {item.title}
                    <span aria-hidden="true"> ↗</span>
                    <span className="sr-only"> (yangi oynada)</span>
                  </a>
                  <span className="sm:row-span-2 sm:self-center">
                    <Chip tone={item.confidence === "exact" ? "tile" : "neutral"}>{item.confidence === "exact" ? "Aniq" : "Ehtimol"}</Chip>
                  </span>
                  <p className="min-w-0 break-words text-sm text-muted">{[item.site, item.year, item.note].filter(Boolean).join(" · ")}</p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {result.namesakes > 0 && (
        <p className="mt-6 text-sm text-muted">Yana {result.namesakes} ta sahifa boshqa odamga tegishli bo‘lishi mumkin, ular ko‘rsatilmadi.</p>
      )}
    </section>
  );
}
