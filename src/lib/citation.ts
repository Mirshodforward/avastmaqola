import type { VenueType } from "./article-rules";

// Iqtibos formatlari: mualliflarning ism/familiyasi alohida saqlangani uchun taxmin qilinmaydi
type CiteAuthor = { givenName: string; familyName: string };
/** ArticleView.publication bilan bir xil shakl */
type Publication = {
  type: VenueType | null;
  venue: string | null;
  volume: string | null;
  issue: string | null;
  pages: string | null;
  year: number | null;
  doi: string | null;
};
/** year — saytda chop etilgan yil: asl nashr yili bo‘lmasa ishlatiladi. place — portaldagi joyi ("3-son, 12-maqola") */
type CiteInput = {
  id: number;
  title: string;
  authors: CiteAuthor[];
  year: number;
  url: string;
  source: string;
  place?: string | null;
  publication?: Publication | null;
};
type VenueParts = Pick<Publication, "venue" | "volume" | "issue" | "pages">;

/** Manba nomidan keyingi qism, Scholar ko‘rinishida: " 2(11), 119–122", " 14126, 1412603" yoki ", 119–122" */
export function venueTail({ volume, issue, pages }: VenueParts): string {
  const number = `${volume ?? ""}${issue ? `(${issue})` : ""}`;
  return `${number && ` ${number}`}${pages ? `, ${pages}` : ""}`;
}

/** "Proceedings of SPIE 14126, 1412603", "Journal 2(11), 119–122"; nomsiz manba bo‘lmaydi */
export function venueLine(p: VenueParts): string | null {
  return p.venue ? p.venue + venueTail(p) : null;
}

/** "#", "?", "%" kabi belgilar havolani buzmasligi uchun kodlanadi ("/" esa qoladi) */
export const doiUrl = (doi: string) => `https://doi.org/${doi.replace(/[%"#?<>\s]/g, encodeURIComponent)}`;

const initials = (given: string) =>
  given
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => `${part[0].toUpperCase()}.`)
    .join(" ");

/**
 * APA 7. Boshqa joyda chop etilgan bo‘lsa: Qahramonov, M. A. (2022). Sarlavha. Jurnal, 2(11), 119–122. https://doi.org/…
 * aks holda: Qahramonov, M. A., & Karimov, A. (2026). Sarlavha. Manba, 3-son, 12-maqola. https://… (joyi yo‘q bo‘lsa №42)
 */
export function apaCitation({ id, title, authors, year, url, source, place, publication: p }: CiteInput): string {
  const names = authors.map((a) => `${a.familyName}, ${initials(a.givenName)}`);
  const list = names.length > 1 ? `${names.slice(0, -1).join(", ")}, & ${names.at(-1)}` : (names[0] ?? "");
  const where = p?.venue
    ? [p.venue, `${p.volume ?? ""}${p.issue ? `(${p.issue})` : ""}`, p.pages].filter(Boolean).join(", ")
    : `${source}, ${place ?? `№${id}`}`;
  return `${list} (${p?.year ?? year}). ${title}. ${where}. ${p?.doi ? doiUrl(p.doi) : url}`;
}

const bibEscape = (text: string) => text.replace(/([{}\\])/g, "\\$1");

export function bibtexCitation({ id, title, authors, year: siteYear, url, source, place, publication: p }: CiteInput): string {
  const year = p?.year ?? siteYear;
  const first = authors[0]?.familyName ?? "maqola";
  const key = `${first.normalize("NFKD").replace(/[^A-Za-z]/g, "").toLowerCase() || "maqola"}${year}_${id}`;
  const author = authors.map((a) => `${a.familyName}, ${a.givenName}`).join(" and ");
  const journal = p?.type === "journal";
  // Jurnal — @article, konferensiya to‘plami — @inproceedings; manba nomi bo‘lmasa saytdagi nusxa (@misc)
  const kind = p?.venue && p.type ? (journal ? "article" : "inproceedings") : "misc";
  const fields =
    p?.venue && p.type
      ? {
          author,
          title,
          [journal ? "journal" : "booktitle"]: p.venue,
          year,
          volume: p.volume,
          number: p.issue,
          pages: p.pages?.replace(/\s*[-–—]\s*/g, "--"),
          doi: p.doi,
          url,
        }
      : { author, title, year, howpublished: source, note: place ?? `№${id}`, doi: p?.doi, url };
  const lines = Object.entries(fields)
    .filter(([, value]) => value)
    .map(([name, value]) => `  ${name} = {${bibEscape(String(value))}}`);
  return [`@${kind}{${key},`, lines.join(",\n"), "}"].join("\n");
}
