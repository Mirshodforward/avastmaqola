import Link from "next/link";
import { OrcidIcon } from "@/components/orcid-icon";
import { Avatar } from "@/components/profile/avatar";
import { RATING_DIALOG_ID } from "@/components/rating/rating-dialog";
import { Stars } from "@/components/rating/stars";
import { formatAverage, ratingText } from "@/components/rating/text";
import { articleViewText } from "@/i18n/article-view";
import { localePath } from "@/i18n/lang";
import { LICENSE_INFO, type VenueType } from "@/lib/article-rules";
import { ARTICLE_SOURCE } from "@/lib/brand";
import { apaCitation, bibtexCitation, doiUrl, venueTail } from "@/lib/citation";
import { formatBytes, formatDate, truncate, yearOf } from "@/lib/format";
import { issueLabel } from "@/lib/issue";
import { ABSTRACT_HEADINGS, KEYWORDS_HEADINGS, LANGS, type Lang } from "@/lib/langs";
import { avatarUrl } from "@/lib/media";
import { credentialsLine } from "@/lib/profile-labels";
import type { ArticleView as View } from "@/server/articles/view";

/**
 * Maqola sahifasi — nashr etilgan maqola tartibida: sarlavha, mualliflar, muassasalar, nashr ma’lumotlari,
 * annotatsiya. Shriftlar ierarxiyasi Google Scholar uchun ataylab: sarlavha (h1) eng katta,
 * keyin muallif ismlari, bo‘lim sarlavhalari va sayt nomi ulardan kichik.
 */
export function ArticleView({
  v,
  absoluteUrl,
  preview = false,
  rating,
  lang = "uz",
  allLangs = false,
}: {
  v: View;
  absoluteUrl: string;
  preview?: boolean;
  /** Ommaviy sahifada: o‘rtacha baho — pastdagi "Iqtiboslar" bo‘limiga havola */
  rating?: { avg: number; count: number };
  /** Sahifa tili: sarlavha va annotatsiya faqat shu tilda */
  lang?: Lang;
  /** Ko‘rib chiquvchilar uchun: asl tildan boshlab uch tildagi sarlavha va annotatsiyalar hammasi */
  allLangs?: boolean;
}) {
  const t = articleViewText[lang];
  const RT = ratingText[lang];
  const main = allLangs ? v.lang : shownLang(v, lang);
  const title = v.titles[main];
  const year = yearOf(v.publishedAt ?? v.updatedAt);
  // "3-son, 12-maqola" — sahifadagi va iqtibosdagi raqam (saytdagi №id emas). Iqtibos jurnal nomi kabi o‘zbekcha qoladi
  const place = issueLabel(v.issueNo, v.issueSeq);
  // Zenodo DOI’si (nashriyot DOI’si bo‘lmasa): nashr qatori o‘rnida va iqtiboslarda. "Chop etilgan" sanasi o‘zgarmaydi
  const zenodo: View["publication"] =
    v.zenodoDoi && !v.publication?.doi
      ? { type: null, venue: null, volume: null, issue: null, pages: null, year: null, doi: v.zenodoDoi }
      : null;
  // Iqtibos asl tildagi sarlavha bilan — Scholar va kutubxonalardagi yozuv shu
  const cite = { id: v.id, title: v.titles[v.lang], authors: v.authors, year, url: absoluteUrl, source: ARTICLE_SOURCE, place: v.issueSeq ? place : null, publication: v.publication ?? zenodo };
  const license = LICENSE_INFO[v.license];
  // Muassasalar birinchi uchragan tartibida. Hamma bitta muassasadan bo‘lsa, raqamlar ortiqcha
  const institutions = [...new Set(v.authors.map((a) => a.institution).filter((name) => name !== null))];
  const numbered = institutions.length > 1 || (institutions.length === 1 && v.authors.some((a) => !a.institution));

  // Sahifa matni sahifa tilida; sarlavha va annotatsiyalar o‘z tilida (ekran o‘quvchi talaffuzi uchun).
  // break-words: sarlavhadagi uzun bo‘linmas so‘z (formula, havola) telefonda sahifani kengaytirmasin
  return (
    <article lang={lang} className="mx-auto max-w-3xl break-words">
      {preview && (
        <p className="mb-6 rounded-lg border border-lapis/30 bg-paper px-3 py-2 text-sm text-lapis">{t.preview}</p>
      )}

      <p className="text-sm text-muted">
        {t.kind}{" "}
        {v.publishedAt ? (
          <>
            {/* Boshqa joyda chiqqan maqolaning nashr yili pastdagi nashr qatorida — bu sana faqat saytga joylangan kun */}
            {v.publication ? t.postedOnSite : t.published}:{" "}
            <time dateTime={new Date(v.publishedAt).toISOString()}>{formatDate(v.publishedAt, lang)}</time>
          </>
        ) : (
          t.notPublished
        )}
      </p>

      <h1 lang={main} className="mt-2 font-serif text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
        {title}
      </h1>

      <p className="mt-4 text-lg leading-snug">
        {v.authors.map((a, i) => {
          const name = `${a.givenName} ${a.familyName}`;
          return (
            <span key={i}>
              {i > 0 && ", "}
              {a.isOwner && v.owner.slug ? (
                <Link href={localePath(lang, `/oqituvchi/${v.owner.slug}`)} rel="author" className="link">
                  {name}
                </Link>
              ) : (
                name
              )}
              {numbered && a.institution && <sup>{institutions.indexOf(a.institution) + 1}</sup>}
              {a.orcid && (
                <a href={`https://orcid.org/${a.orcid}`} className="ml-1 align-middle" aria-label={`${name}: ORCID`} target="_blank" rel="noopener noreferrer">
                  <OrcidIcon />
                </a>
              )}
            </span>
          );
        })}
      </p>
      {numbered ? (
        <ol className="mt-2 space-y-0.5 text-sm text-muted">
          {institutions.map((name, i) => (
            <li key={name}>
              <sup>{i + 1}</sup> {name}
            </li>
          ))}
        </ol>
      ) : (
        institutions.length > 0 && <p className="mt-1 text-sm text-muted">{institutions[0]}</p>
      )}

      {v.publication && <PublicationLine p={v.publication} venues={t.venues} />}
      {zenodo && <PublicationLine p={zenodo} venues={t.venues} />}

      <p className="mt-3 text-sm text-muted">
        {t.place(v.issueNo, v.issueSeq)}. {t.license}:{" "}
        {license.url ? (
          <a href={license.url} className="link" target="_blank" rel="license noopener noreferrer">
            {license.label}
          </a>
        ) : (
          (t.licenses[v.license] ?? license.label)
        )}
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        {v.pdfBytes && (
          <a href={`/maqola/${v.id}/pdf`} className="btn btn-primary btn-lg" target="_blank" rel="noopener">
            {t.openPdf(formatBytes(v.pdfBytes))}
          </a>
        )}
        {/* «Iqtibos keltirish» — baho va fikr oynasi (rating-dialog.tsx), faqat ommaviy sahifada: preview, admin va
            moderator drawer’ida rating berilmaydi — u yerlarda faqat APA / BibTeX */}
        {rating && (
          <button type="button" popoverTarget={RATING_DIALOG_ID} className="btn btn-secondary btn-lg">
            {RT.section.write}
          </button>
        )}
        <button type="button" popoverTarget="iqtibos" className="btn btn-ghost btn-lg">
          APA / BibTeX
        </button>
        {!preview && (
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(absoluteUrl)}&text=${encodeURIComponent(title)}`}
            className="btn btn-ghost btn-lg"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.shareTelegram}
          </a>
        )}
        {rating && (
          <a
            href="#iqtiboslar"
            className="btn btn-ghost btn-lg"
            aria-label={rating.count ? RT.badge.label(formatAverage(rating.avg, lang), rating.count) : undefined}
          >
            <Stars value={rating.avg} tone="paper" className="text-lg" />
            {rating.count ? (
              <>
                <span className="font-semibold">{formatAverage(rating.avg, lang)}</span>
                <span className="text-muted">({rating.count})</span>
              </>
            ) : (
              RT.badge.rate
            )}
          </a>
        )}
      </div>

      {/* Annotatsiya ochiq matn, tablarsiz (Scholar to‘liq annotatsiyani ko‘rishi shart); sahifada bitta — sahifa tilida */}
      <section lang={main} id={`annotatsiya-${main}`} className="mt-10">
        <h2 className="font-serif text-lg font-semibold">{ABSTRACT_HEADINGS[main]}</h2>
        <Paragraphs text={v.abstracts[main]} />
        <Keywords lang={main} list={v.keywords[main]} />
      </section>
      {(allLangs ? LANGS.filter((l) => l !== v.lang && v.titles[l]) : []).map((l) => (
        <section key={l} lang={l} id={`annotatsiya-${l}`} className="mt-10 border-t border-line pt-8">
          <p className="font-serif text-lg font-semibold leading-snug">{v.titles[l]}</p>
          <h2 className="mt-3 text-base font-semibold text-muted">{ABSTRACT_HEADINGS[l]}</h2>
          <Paragraphs text={v.abstracts[l]} />
          <Keywords lang={l} list={v.keywords[l]} />
        </section>
      ))}

      {/* Akademik havola (APA, BibTeX) sahifada ochiq turmaydi — «APA / BibTeX» bosilganda oynada. Popover API: JS’siz
          ochiladi, tashqariga bosish va Esc yopadi. Display klassi faqat ichki div’da: popover’ning yopiq holatini bekor qilmasin */}
      <div
        id="iqtibos"
        popover="auto"
        role="dialog"
        aria-labelledby="iqtibos-title"
        className="m-auto max-h-[calc(100dvh-2rem)] w-[min(42rem,calc(100%-2rem))] rounded-2xl border border-line bg-paper p-0 text-ink backdrop:bg-ink/50"
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 id="iqtibos-title" className="font-serif text-lg font-semibold">
              APA / BibTeX
            </h2>
            <button
              type="button"
              popoverTarget="iqtibos"
              popoverTargetAction="hide"
              aria-label={t.close}
              className="btn btn-ghost -mt-1.5 -mr-2 px-2.5"
            >
              <span aria-hidden="true">✕</span>
            </button>
          </div>
          <p className="mt-4 text-sm font-medium">APA</p>
          <p className="mt-1 rounded-lg border border-line bg-mist p-4 text-sm leading-relaxed">{apaCitation(cite)}</p>
          <p className="mt-4 text-sm font-medium">BibTeX</p>
          <pre className="mt-1 overflow-x-auto rounded-lg border border-line bg-mist p-4 text-xs leading-relaxed">
            {bibtexCitation(cite)}
          </pre>
        </div>
      </div>

      {v.owner.slug && <AboutAuthor owner={v.owner} lang={lang} />}

      {v.others.length > 0 && (
        <section className="mt-10">
          <h2 className="font-serif text-lg font-semibold">{t.otherArticles}</h2>
          <ul className="mt-3 space-y-2">
            {v.others.map((o) => (
              <li key={o.id} lang={o.titles[lang] ? lang : undefined}>
                <Link href={localePath(lang, `/maqola/${o.id}`)} className="link">
                  {o.titles[lang] || o.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

/** Sahifa tilidagi tarjima bo‘lmasa (eski maqolalar) — asl tili */
export const shownLang = (v: View, lang: Lang): Lang => (v.titles[lang] ? lang : v.lang);

/** "Konferensiya to‘plami: Proceedings of SPIE 14126, 1412603 (2026) · DOI: 10.1117/12.3110012" */
function PublicationLine({ p, venues }: { p: NonNullable<View["publication"]>; venues: Record<VenueType, string> }) {
  return (
    <p className="mt-4 text-sm leading-relaxed">
      {p.venue && (
        <>
          {p.type && <span className="text-muted">{venues[p.type]}: </span>}
          <cite className="italic">{p.venue}</cite>
          {venueTail(p)}
          {p.year !== null && ` (${p.year})`}
        </>
      )}
      {p.venue && p.doi && " · "}
      {p.doi && (
        <>
          <span className="text-muted">DOI: </span>
          <a href={doiUrl(p.doi)} className="link" target="_blank" rel="noopener noreferrer">
            {p.doi}
          </a>
        </>
      )}
    </p>
  );
}

/** Lavozim, kafedra va bio — o‘qituvchi o‘zbekcha yozgan matn (lang="uz"), daraja va yozuvlar sahifa tilida */
function AboutAuthor({ owner, lang }: { owner: View["owner"]; lang: Lang }) {
  const t = articleViewText[lang];
  const credentials = credentialsLine(owner, lang);
  return (
    <aside aria-labelledby="about-author" className="mt-12 rounded-xl border border-line bg-paper p-6">
      <h2 id="about-author" className="font-serif text-lg font-semibold">
        {t.aboutAuthor}
      </h2>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row">
        <Avatar src={owner.photoKey ? avatarUrl(owner.photoKey, 512) : null} name={owner.name} size={96} />
        <div className="min-w-0">
          <p className="font-semibold">{owner.name}</p>
          {credentials && <p className="text-sm text-muted">{credentials}</p>}
          <p lang="uz" className="text-sm text-muted">
            {[owner.department, owner.institution].filter(Boolean).join(", ")}
          </p>
          {owner.bio && (
            <p lang="uz" className="mt-3 text-sm leading-relaxed">
              {truncate(owner.bio, 300)}
            </p>
          )}
          <Link href={localePath(lang, `/oqituvchi/${owner.slug}`)} className="link mt-3 inline-block text-sm">
            {t.profilePage}
          </Link>
        </div>
      </div>
    </aside>
  );
}

function Paragraphs({ text }: { text: string }) {
  return (
    <div className="mt-3 space-y-3 leading-relaxed">
      {text.split(/\n{2,}/).map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {p}
        </p>
      ))}
    </div>
  );
}

function Keywords({ lang, list }: { lang: Lang; list: string[] }) {
  if (list.length === 0) return null;
  return (
    <p className="mt-4 text-sm">
      <span className="font-medium">{KEYWORDS_HEADINGS[lang]}:</span> {list.join(", ")}
    </p>
  );
}
