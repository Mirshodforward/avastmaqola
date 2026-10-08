import Link from "next/link";
import { OrcidIcon } from "@/components/orcid-icon";
import { Avatar } from "@/components/profile/avatar";
import { LICENSE_INFO } from "@/lib/article-rules";
import { ARTICLE_SOURCE } from "@/lib/brand";
import { apaCitation, bibtexCitation } from "@/lib/citation";
import { formatBytes, formatDate, truncate, yearOf } from "@/lib/format";
import { ABSTRACT_HEADINGS, KEYWORDS_HEADINGS, LANGS, type Lang } from "@/lib/langs";
import { avatarUrl } from "@/lib/media";
import { credentialsLine } from "@/lib/profile-labels";
import type { ArticleView as View } from "@/server/articles/view";

/**
 * Maqola sahifasi. Shriftlar ierarxiyasi Google Scholar uchun ataylab: sarlavha (h1) eng katta,
 * keyin muallif ismlari, bo‘lim sarlavhalari va sayt nomi ulardan kichik.
 */
export function ArticleView({ v, absoluteUrl, preview = false }: { v: View; absoluteUrl: string; preview?: boolean }) {
  const title = v.titles[v.lang];
  const year = yearOf(v.publishedAt ?? v.updatedAt);
  const cite = { id: v.id, title, authors: v.authors, year, url: absoluteUrl, source: ARTICLE_SOURCE };
  const license = LICENSE_INFO[v.license];
  const institutions = [...new Set(v.authors.map((a) => a.institution).filter(Boolean))];

  // Sahifa matni o‘zbekcha; sarlavha va annotatsiyalar o‘z tilida (ekran o‘quvchi talaffuzi uchun)
  return (
    <article lang="uz" className="mx-auto max-w-3xl">
      {preview && (
        <p className="mb-6 rounded-lg border border-lapis/30 bg-paper px-3 py-2 text-sm text-lapis">
          Oldindan ko‘rish. Sahifa ommaga faqat administrator tasdiqlagach ochiladi.
        </p>
      )}

      {/* Muallif bloki — eng tepada (sarlavhadan kichik shriftda) */}
      <AuthorBlock owner={v.owner} />

      <p className="mt-6 text-sm text-muted">
        Ilmiy maqola.{" "}
        {v.publishedAt ? (
          <>
            Chop etilgan: <time dateTime={new Date(v.publishedAt).toISOString()}>{formatDate(v.publishedAt)}</time>
          </>
        ) : (
          "Hali chop etilmagan."
        )}
      </p>

      <h1 lang={v.lang} className="mt-2 font-serif text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
        {title}
      </h1>

      <p className="mt-4 text-lg leading-snug">
        {v.authors.map((a, i) => {
          const name = `${a.givenName} ${a.familyName}`;
          return (
            <span key={i}>
              {i > 0 && ", "}
              {a.isOwner && v.owner.slug ? (
                <Link href={`/oqituvchi/${v.owner.slug}`} className="link">
                  {name}
                </Link>
              ) : (
                name
              )}
              {a.orcid && (
                <a href={`https://orcid.org/${a.orcid}`} className="ml-1 align-middle" aria-label={`${name}: ORCID`} target="_blank" rel="noopener noreferrer">
                  <OrcidIcon />
                </a>
              )}
            </span>
          );
        })}
      </p>
      {institutions.length > 0 && <p className="mt-1 text-sm text-muted">{institutions.join("; ")}</p>}

      <p className="mt-3 text-sm text-muted">
        №{v.id}. Litsenziya:{" "}
        {license.url ? (
          <a href={license.url} className="link" target="_blank" rel="license noopener noreferrer">
            {license.label}
          </a>
        ) : (
          license.label
        )}
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        {v.pdfBytes && (
          <a href={`/maqola/${v.id}/pdf`} className="btn btn-primary btn-lg" target="_blank" rel="noopener">
            PDF ochish ({formatBytes(v.pdfBytes)})
          </a>
        )}
        <a href="#iqtibos" className="btn btn-secondary btn-lg">
          Iqtibos keltirish
        </a>
        {!preview && (
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(absoluteUrl)}&text=${encodeURIComponent(title)}`}
            className="btn btn-ghost btn-lg"
            target="_blank"
            rel="noopener noreferrer"
          >
            Telegram’da ulashish
          </a>
        )}
      </div>

      {/* Uch tildagi annotatsiyalar: hammasi ochiq matn, tablarsiz (Scholar to‘liq annotatsiyani ko‘rishi shart) */}
      <section lang={v.lang} id={`annotatsiya-${v.lang}`} className="mt-10">
        <h2 className="font-serif text-lg font-semibold">{ABSTRACT_HEADINGS[v.lang]}</h2>
        <Paragraphs text={v.abstracts[v.lang]} />
        <Keywords lang={v.lang} list={v.keywords[v.lang]} />
      </section>
      {LANGS.filter((l) => l !== v.lang && v.titles[l]).map((l) => (
        <section key={l} lang={l} id={`annotatsiya-${l}`} className="mt-10 border-t border-line pt-8">
          <p className="font-serif text-lg font-semibold leading-snug">{v.titles[l]}</p>
          <h2 className="mt-3 text-base font-semibold text-muted">{ABSTRACT_HEADINGS[l]}</h2>
          <Paragraphs text={v.abstracts[l]} />
          <Keywords lang={l} list={v.keywords[l]} />
        </section>
      ))}

      <section id="iqtibos" className="mt-12 border-t border-line pt-8">
        <h2 className="font-serif text-lg font-semibold">Iqtibos keltirish</h2>
        <p className="mt-4 text-sm font-medium">APA</p>
        <p className="mt-1 rounded-lg border border-line bg-paper p-4 text-sm leading-relaxed">{apaCitation(cite)}</p>
        <p className="mt-4 text-sm font-medium">BibTeX</p>
        <pre className="mt-1 overflow-x-auto rounded-lg border border-line bg-paper p-4 text-xs leading-relaxed">
          {bibtexCitation(cite)}
        </pre>
      </section>

      {v.owner.slug && <AboutAuthor owner={v.owner} />}

      {v.others.length > 0 && (
        <section className="mt-10">
          <h2 className="font-serif text-lg font-semibold">Muallifning boshqa maqolalari</h2>
          <ul className="mt-3 space-y-2">
            {v.others.map((o) => (
              <li key={o.id}>
                <Link href={`/maqola/${o.id}`} className="link">
                  {o.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

function AuthorBlock({ owner }: { owner: View["owner"] }) {
  const details = [owner.direction, owner.institution].filter(Boolean).join(", ");
  const body = (
    <span className="flex items-center gap-3">
      <Avatar src={owner.photoKey ? avatarUrl(owner.photoKey, 128) : null} name={owner.name} size={56} />
      <span className="min-w-0">
        <span className="block text-xl font-semibold leading-tight">{owner.name}</span>
        {details && <span className="mt-0.5 block text-sm text-muted">{details}</span>}
      </span>
    </span>
  );
  return owner.slug ? (
    <Link href={`/oqituvchi/${owner.slug}`} rel="author" className="-m-2 inline-block rounded-xl p-2 hover:bg-paper">
      {body}
    </Link>
  ) : (
    <div>{body}</div>
  );
}

function AboutAuthor({ owner }: { owner: View["owner"] }) {
  const credentials = credentialsLine(owner);
  return (
    <aside aria-labelledby="about-author" className="mt-12 rounded-xl border border-line bg-paper p-6">
      <h2 id="about-author" className="font-serif text-lg font-semibold">
        Muallif haqida
      </h2>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row">
        <Avatar src={owner.photoKey ? avatarUrl(owner.photoKey, 512) : null} name={owner.name} size={96} />
        <div className="min-w-0">
          <p className="font-semibold">{owner.name}</p>
          {credentials && <p className="text-sm text-muted">{credentials}</p>}
          <p className="text-sm text-muted">{[owner.department, owner.institution].filter(Boolean).join(", ")}</p>
          {owner.bio && <p className="mt-3 text-sm leading-relaxed">{truncate(owner.bio, 300)}</p>}
          <Link href={`/oqituvchi/${owner.slug}`} className="link mt-3 inline-block text-sm">
            Profil sahifasi
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
