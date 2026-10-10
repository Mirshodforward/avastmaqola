import "server-only";
import { z } from "zod";
import { cleanText } from "@/lib/text";
import type { PresenceItem, PresenceResult } from "@/lib/web-presence";
import { hasSurname } from "./names";

// Faqat shu ikki xost: manzil qismlari — tekshirilgan ORCID iD (0000-0002-1825-0097 shaklida)
const ORCID_API = "https://pub.orcid.org/v3.0";
const OPENALEX_API = "https://api.openalex.org";
const TIMEOUT_MS = 8000;
const MAX_BYTES = 4 * 1024 * 1024;
/** Eng yangi ishlardan shuncha: ro‘yxat ham, modelga yuboriladigan "ma’lum" ro‘yxat ham cheksiz o‘smasin */
const MAX_WORKS = 50;

async function getJson(url: string): Promise<unknown> {
  try {
    const res = await fetch(url, {
      headers: { accept: "application/json", "user-agent": `Avtomaqola/1.0 (+${process.env.APP_URL ?? "localhost"})` },
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok || Number(res.headers.get("content-length") ?? 0) > MAX_BYTES) return null;
    const text = await res.text();
    return text.length > MAX_BYTES ? null : JSON.parse(text);
  } catch {
    // Tashqi API ishlamasa izlash to‘xtamaydi — veb-qidiruv baribir bajariladi
    return null;
  }
}

const value = z.object({ value: z.string() }).nullish();

const orcidRecord = z.object({
  person: z
    .object({
      name: z.object({ "given-names": value, "family-name": value, "credit-name": value }).nullish(),
      "other-names": z.object({ "other-name": z.array(z.object({ content: z.string() })).nullish() }).nullish(),
      "researcher-urls": z
        .object({ "researcher-url": z.array(z.object({ "url-name": z.string().nullish(), url: value })).nullish() })
        .nullish(),
    })
    .nullish(),
  "activities-summary": z
    .object({
      works: z
        .object({
          group: z
            .array(
              z.object({
                "work-summary": z.array(
                  z.object({
                    title: z.object({ title: value }).nullish(),
                    "external-ids": z
                      .object({
                        "external-id": z
                          .array(z.object({ "external-id-type": z.string(), "external-id-value": z.string() }))
                          .nullish(),
                      })
                      .nullish(),
                    url: value,
                    "publication-date": z.object({ year: value }).nullish(),
                  }),
                ),
              }),
            )
            .nullish(),
        })
        .nullish(),
    })
    .nullish(),
});

const openAlexWorks = z.object({
  results: z.array(
    z.object({
      doi: z.string().nullish(),
      display_name: z.string().nullish(),
      publication_year: z.number().nullish(),
      primary_location: z.object({ landing_page_url: z.string().nullish() }).nullish(),
      authorships: z
        .array(
          z.object({
            author: z.object({ display_name: z.string().nullish(), orcid: z.string().nullish() }).nullish(),
            raw_author_name: z.string().nullish(),
          }),
        )
        .nullish(),
    }),
  ),
});

/** Faqat http(s), parolsiz; aks holda null */
export function safeUrl(raw: string | null | undefined): URL | null {
  try {
    const url = new URL(raw ?? "");
    return (url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password && raw!.length <= 2048
      ? url
      : null;
  } catch {
    return null;
  }
}

export const siteOf = (url: URL) => url.hostname.replace(/^www\./, "");

const doiOf = (raw: string) => raw.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").trim().toLowerCase();

/**
 * ORCID’dagi ish — "Aniq" (ro‘yxatni o‘qituvchining o‘zi yoki u ruxsat bergan manba to‘ldiradi). Faqat OpenAlex’da
 * topilgani — "Ehtimol": noshirlar ORCID’ni ba’zan boshqa muallifning ishiga xato biriktiradi.
 */
function work(source: "orcid" | "openalex", title: string, link: string | null, year: number | null): PresenceItem | null {
  const url = safeUrl(link);
  const name = cleanText(title).replace(/\s+/g, " ").slice(0, 300);
  if (!url || !name) return null;
  const confidence = source === "orcid" ? "exact" : "likely";
  return { url: url.href, title: name, site: siteOf(url), category: "publication", confidence, source, year, note: null };
}

function profile(source: PresenceItem["source"], title: string, link: string | null): PresenceItem | null {
  const url = safeUrl(link);
  return url
    ? { url: url.href, title: title.trim() || siteOf(url), site: siteOf(url), category: "profile", confidence: "exact", source, year: null, note: null }
    : null;
}

export type Known = { items: PresenceItem[]; orcid: PresenceResult["orcid"] };

/**
 * Bepul va aniq manbalar: ORCID yozuvi (ism, havolalar, ishlar) va OpenAlex (ORCID bo‘yicha ishlar), hamda
 * profildagi havolalar. ORCID iD tasdiqlanmagan (profilda qo‘lda yoziladi): undagi ism profildagi familiyaga
 * mos kelmasa, ORCID umuman ishlatilmaydi — boshqa odamning ishlari "Aniq" bo‘lib chiqmasin.
 */
export async function loadKnown(input: {
  lastName: string;
  orcid: string | null;
  googleScholarUrl: string | null;
  scopusAuthorId: string | null;
}): Promise<Known> {
  const items: PresenceItem[] = [];
  const push = (item: PresenceItem | null) => item && items.push(item);
  push(profile("profile", "Google Scholar", input.googleScholarUrl));
  if (input.scopusAuthorId)
    push(profile("profile", "Scopus", `https://www.scopus.com/authid/detail.uri?authorId=${encodeURIComponent(input.scopusAuthorId)}`));
  if (!input.orcid) return { items, orcid: "none" };

  const [rawRecord, rawWorks] = await Promise.all([
    getJson(`${ORCID_API}/${input.orcid}/record`),
    getJson(
      `${OPENALEX_API}/works?filter=authorships.author.orcid:https://orcid.org/${input.orcid}&sort=publication_year:desc&per-page=${MAX_WORKS}&select=doi,display_name,publication_year,primary_location,authorships`,
    ),
  ]);
  const record = orcidRecord.safeParse(rawRecord);
  const person = record.success ? record.data.person : null;
  const names = [
    [person?.name?.["given-names"]?.value, person?.name?.["family-name"]?.value].filter(Boolean).join(" "),
    person?.name?.["credit-name"]?.value ?? "",
    ...(person?.["other-names"]?.["other-name"] ?? []).map((n) => n.content),
  ].filter(Boolean);
  // ORCID javob bermagan bo‘lsa ism tekshirib bo‘lmaydi — iD ham, OpenAlex natijalari ham ishlatilmaydi
  if (!hasSurname(input.lastName, names)) return { items, orcid: record.success ? "mismatch" : "none" };

  push(profile("orcid", "ORCID", `https://orcid.org/${input.orcid}`));
  for (const link of person?.["researcher-urls"]?.["researcher-url"] ?? []) {
    push(profile("orcid", cleanText(link["url-name"] ?? "").slice(0, 120) || safeUrl(link.url?.value)?.hostname || "", link.url?.value ?? null));
  }

  const seen = new Set<string>();
  const add = (item: PresenceItem | null, doi: string | null) => {
    if (!item) return;
    const key = doi ?? item.title.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    items.push(item);
  };
  const groups = record.success ? (record.data["activities-summary"]?.works?.group ?? []) : [];
  for (const group of groups.slice(0, MAX_WORKS)) {
    const w = group["work-summary"][0];
    if (!w) continue;
    const doi = w["external-ids"]?.["external-id"]?.find((id) => id["external-id-type"].toLowerCase() === "doi")?.["external-id-value"];
    const year = Number(w["publication-date"]?.year?.value) || null;
    add(work("orcid", w.title?.title?.value ?? "", doi ? `https://doi.org/${doiOf(doi)}` : (w.url?.value ?? null), year), doi ? doiOf(doi) : null);
  }
  const works = openAlexWorks.safeParse(rawWorks);
  for (const w of works.success ? works.data.results : []) {
    // Shu ORCID biriktirilgan muallifning ismi boshqa bo‘lsa — ORCID xato biriktirilgan, ish tashlanadi
    const mine = w.authorships?.find((a) => a.author?.orcid?.endsWith(input.orcid!));
    if (mine && !hasSurname(input.lastName, [mine.author?.display_name ?? "", mine.raw_author_name ?? ""])) continue;
    const doi = w.doi ? doiOf(w.doi) : null;
    add(work("openalex", w.display_name ?? "", doi ? `https://doi.org/${doi}` : (w.primary_location?.landing_page_url ?? null), w.publication_year ?? null), doi);
  }
  return { items, orcid: "used" };
}
