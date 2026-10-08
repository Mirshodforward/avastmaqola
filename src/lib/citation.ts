// Iqtibos formatlari: mualliflarning ism/familiyasi alohida saqlangani uchun taxmin qilinmaydi
type CiteAuthor = { givenName: string; familyName: string };
type CiteInput = { id: number; title: string; authors: CiteAuthor[]; year: number; url: string; source: string };

const initials = (given: string) =>
  given
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => `${part[0].toUpperCase()}.`)
    .join(" ");

/** APA 7: Qahramonov, M. A., & Karimov, A. (2026). Sarlavha. Manba, №42. https://… */
export function apaCitation({ id, title, authors, year, url, source }: CiteInput): string {
  const names = authors.map((a) => `${a.familyName}, ${initials(a.givenName)}`);
  const list = names.length > 1 ? `${names.slice(0, -1).join(", ")}, & ${names.at(-1)}` : (names[0] ?? "");
  return `${list} (${year}). ${title}. ${source}, №${id}. ${url}`;
}

const bibEscape = (text: string) => text.replace(/([{}\\])/g, "\\$1");

export function bibtexCitation({ id, title, authors, year, url, source }: CiteInput): string {
  const first = authors[0]?.familyName ?? "maqola";
  const key = `${first.normalize("NFKD").replace(/[^A-Za-z]/g, "").toLowerCase() || "maqola"}${year}_${id}`;
  return [
    `@misc{${key},`,
    `  author = {${bibEscape(authors.map((a) => `${a.familyName}, ${a.givenName}`).join(" and "))}},`,
    `  title = {${bibEscape(title)}},`,
    `  year = {${year}},`,
    `  howpublished = {${bibEscape(source)}},`,
    `  note = {№${id}},`,
    `  url = {${url}}`,
    `}`,
  ].join("\n");
}
