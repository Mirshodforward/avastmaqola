import "server-only";
import { createHash } from "node:crypto";
import { LICENSE_INFO, type License } from "@/lib/article-rules";
import { formatBytes } from "@/lib/format";
import { LANGS, LANG_SUFFIX, type Lang } from "@/lib/langs";
import { articleUrl } from "../articles/seo";
import type { OwnArticle } from "../articles/service";

// Zenodo yozuvi: panel ko‘rinishi ham, so‘rov tanasi ham shu bitta funksiyadan — faqat bazadan, klientdan emas.
// Lug‘at id’lari 2026-10-09 da zenodo.org’da tekshirilgan.

const ISO3: Record<Lang, string> = { uz: "uzb", ru: "rus", en: "eng" };
const RIGHTS: Record<License, string> = {
  "cc-by-4.0": "cc-by-4.0",
  "cc-by-nc-4.0": "cc-by-nc-4.0",
  // "Other (Not Open)": yopiq litsenziya bilan ochiq fayl Zenodo’da ruxsat etilgan
  "all-rights-reserved": "other-closed",
};
// Jurnal maqolasi emas: Zenodo "soxta nashr" va DOI fabrikasi yozuvlarini o‘chiradi
const RESOURCE_TYPE = "publication-preprint";
// Zenodo’ning AI siyosati (2026-04-27): vosita, maqsad va qaysi qismlarga ta’sir qilgani tavsifda yoziladi
const AI_NOTE =
  "<p>AI use: the titles, abstracts and keywords of this record in Uzbek, Russian and English, and the author list, " +
  "were prepared from the article text with an AI assistant (Claude, Anthropic) in the Avtomaqola submission tool and " +
  "reviewed by the authors. The article itself (the attached PDF) is the authors' own work; the AI is not an author.</p>";

const PARTS = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Tashkent" });

/** Toshkent vaqti bo‘yicha YYYY-MM-DD: 31-dekabr kechasi chop etilgan maqola keyingi yilga tushadi */
export function isoDate(value: Date | string): string {
  const p = Object.fromEntries(PARTS.formatToParts(new Date(value)).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };

/** Annotatsiya HTML’i: xatboshilar saytdagidek bo‘sh qator bilan ajraladi, o‘qituvchi matni ekranlanadi */
const html = (text: string) =>
  text
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/[&<>"]/g, (ch) => ESCAPES[ch]).replace(/\n/g, "<br>")}</p>`)
    .join("");

/** Zenodo’dagi fayl nomi — ommaviy PDF manzilimizdagi bilan bir xil */
export const fileKey = (id: number) => `maqola-${id}.pdf`;

/**
 * InvenioRDM yozuvi. Chaqiruvchi isEligible() ni tekshirgan bo‘ladi (til, sana va PDF bor).
 * Yuborilmaydi: pids (DOI’ni Zenodo beradi), custom_fields (ISSN IsPartOf bo‘lib, ORCID’ga avtomatik tushishni to‘sadi),
 * jamoalar, versiya, telefon va Telegram. AI hech qachon muallif (creators/contributors) emas.
 */
export function zenodoRecord({ article: a, authors }: OwnArticle, aiUsed: boolean) {
  const lang = a.lang!;
  const others = LANGS.filter((l) => l !== lang);
  const title = (l: Lang) => a[`title${LANG_SUFFIX[l]}`] ?? "";
  const abstract = (l: Lang) => html(a[`abstract${LANG_SUFFIX[l]}`] ?? "");
  // Kalit so‘zlar: avval PDF tilidagilari, takrorlar (katta-kichik harfdan qat’i nazar) bir marta
  const subjects: { subject: string }[] = [];
  const seen = new Set<string>();
  for (const keyword of [lang, ...others].flatMap((l) => a[`keywords${LANG_SUFFIX[l]}`])) {
    if (seen.has(keyword.toLowerCase())) continue;
    seen.add(keyword.toLowerCase());
    subjects.push({ subject: keyword });
  }
  const url = articleUrl(a.id);

  return {
    access: { record: "public", files: "public" },
    files: { enabled: true },
    metadata: {
      resource_type: { id: RESOURCE_TYPE },
      title: title(lang),
      additional_titles: others.map((l) => ({ title: title(l), type: { id: "translated-title" }, lang: { id: ISO3[l] } })),
      description: abstract(lang),
      additional_descriptions: [
        ...others.map((l) => ({ description: abstract(l), type: { id: "abstract" }, lang: { id: ISO3[l] } })),
        ...(aiUsed ? [{ description: AI_NOTE, type: { id: "notes" }, lang: { id: "eng" } }] : []),
      ],
      // DataCite faqat birinchisini oladi: PDF tili
      languages: [{ id: ISO3[lang] }],
      subjects,
      creators: authors.map((x) => ({
        person_or_org: {
          type: "personal",
          given_name: x.givenName,
          family_name: x.familyName,
          ...(x.orcid ? { identifiers: [{ scheme: "orcid", identifier: x.orcid }] } : {}),
        },
        ...(x.institution ? { affiliations: [{ name: x.institution }] } : {}),
      })),
      // Bizning portalda birinchi chop etilgan sana
      publication_date: isoDate(a.publishedAt!),
      publisher: "Zenodo",
      rights: [{ id: RIGHTS[a.license] }],
      // Faqat https: localhost yoki sinov saytining tekshirib bo‘lmaydigan manzili yuborilmaydi
      ...(url.startsWith("https://")
        ? {
            related_identifiers: [
              { identifier: url, scheme: "url", relation_type: { id: "isidenticalto" }, resource_type: { id: RESOURCE_TYPE } },
            ],
          }
        : {}),
    },
  };
}

export type ZenodoRecordBody = ReturnType<typeof zenodoRecord>;

/** O‘qituvchi tasdiqlagan yozuv: aynan shu metama’lumot va aynan shu PDF (pdf_key har yuklashda o‘zgaradi) */
export function recordHash(record: ZenodoRecordBody, pdfKey: string): string {
  return createHash("sha256").update(`${JSON.stringify(record)}\n${pdfKey}`).digest("base64url");
}

/** Panel uchun qisqa ko‘rinish — yozuvning o‘zidan, yuboriladigan narsadan farq qilmasligi uchun */
export function previewOf(record: ZenodoRecordBody, a: OwnArticle["article"]): [string, string][] {
  const md = record.metadata;
  const authors = md.creators.map(
    ({ person_or_org: p }) => `${p.given_name} ${p.family_name}${"identifiers" in p ? " (ORCID)" : ""}`,
  );
  const rows: [string, string][] = [
    ["Turi", "Preprint"],
    ["Sarlavha", md.title],
    ["Mualliflar", authors.join(", ")],
    ["Sana", md.publication_date],
    ["Litsenziya", LICENSE_INFO[a.license].label],
    ["Annotatsiya, kalit so‘zlar", "uch tilda"],
    ["Fayl", a.pdfBytes ? `${fileKey(a.id)} · ${formatBytes(a.pdfBytes)}` : fileKey(a.id)],
  ];
  if (md.additional_descriptions.some((d) => d.type.id === "notes")) rows.push(["AI izohi", "AI yordami qayd etiladi"]);
  return rows;
}
