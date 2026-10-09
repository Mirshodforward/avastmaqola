import "server-only";
import { z } from "zod";
import type { AiDraft, AiProposal } from "@/lib/ai";
import { ARTICLE_LIMITS as L } from "@/lib/article-rules";
import { LANGS, LANG_SUFFIX } from "@/lib/langs";
import { cleanText } from "@/lib/text";
import { normalizeOrcid } from "@/lib/validation";
import { AI_LIMITS } from "./client";

const str = (max: number) => z.string().max(max);
const list = (max: number) => z.array(str(200)).max(max);

/** Formaning joriy holati — faqat modelga kontekst, bazaga yozilmaydi (qoidalari yumshoq) */
const draft = z.object({
  lang: z.union([z.literal(""), z.enum(LANGS)]),
  titleUz: str(2000),
  titleRu: str(2000),
  titleEn: str(2000),
  abstractUz: str(20_000),
  abstractRu: str(20_000),
  abstractEn: str(20_000),
  keywordsUz: list(50),
  keywordsRu: list(50),
  keywordsEn: list(50),
  authors: z
    .array(
      z.object({
        givenName: str(200),
        familyName: str(200),
        institution: str(500),
        orcid: str(50),
        isMe: z.boolean(),
      }),
    )
    .max(30),
  // Yuborishdan oldin yana nima kerakligini model o‘qituvchiga aytishi uchun
  hasProfile: z.boolean(),
});

const turnText = z.string().trim().min(1).max(AI_LIMITS.messageMax, `Ko‘pi bilan ${AI_LIMITS.messageMax} ta belgi`);

export const assistantRequestSchema = z
  .object({
    message: turnText,
    // user, assistant, user, assistant…: oxirgisi javob, yangi xabar esa message’da
    history: z
      .array(z.object({ role: z.enum(["user", "assistant"]), text: turnText }))
      .max(AI_LIMITS.historyMax)
      .refine(
        (h) =>
          h.length % 2 === 0 &&
          h.every((t, i) => t.role === (i % 2 ? "assistant" : "user") && (t.role === "user" || t.text.length <= AI_LIMITS.replyMax)),
        "Suhbat tartibi noto‘g‘ri",
      ),
    draft,
  })
  // Har bir so‘rov narxi chegaralangan bo‘lsin: tarix klientdan keladi va uni sun’iy kattalashtirish mumkin
  .refine((r) => r.message.length + r.history.reduce((n, t) => n + t.text.length, 0) <= AI_LIMITS.conversationMax, {
    message: "Suhbat juda uzun bo‘lib ketdi. «Yangi suhbat» tugmasini bosib, qaytadan boshlang.",
    path: ["message"],
  });

export type AssistantRequest = z.output<typeof assistantRequestSchema>;

/** Model chaqirgan propose_changes kirishi. eager_input_streaming’da server tekshirmaydi — shu yerda tekshiriladi */
export const toolInputSchema = z.object({
  lang: z.enum(LANGS).optional(),
  titleUz: z.string().optional(),
  titleRu: z.string().optional(),
  titleEn: z.string().optional(),
  abstractUz: z.string().optional(),
  abstractRu: z.string().optional(),
  abstractEn: z.string().optional(),
  keywordsUz: z.array(z.string()).optional(),
  keywordsRu: z.array(z.string()).optional(),
  keywordsEn: z.array(z.string()).optional(),
  authors: z
    .array(
      z.object({
        givenName: z.string(),
        familyName: z.string(),
        institution: z.string(),
        orcid: z.string(),
        isMe: z.boolean(),
      }),
    )
    .optional(),
});

export type ToolInput = z.output<typeof toolInputSchema>;

const oneLine = (v: string) => cleanText(v).replace(/\s+/g, " ");

/** Chegaradan uzun matn so‘z o‘rtasida emas, gap (bo‘lmasa so‘z) oxirida kesiladi */
function clamp(value: string, max: number): string {
  if (value.length <= max) return value;
  const cut = value.slice(0, max);
  const sentence = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf(".\n"));
  if (sentence > max * 0.6) return cut.slice(0, sentence + 1);
  const space = cut.lastIndexOf(" ");
  return (space > max * 0.6 ? cut.slice(0, space) : cut).trimEnd();
}

/** O‘zbekcha imlo: o‘ va g‘ — ‘ (U+2018), tutuq belgisi — ’ (U+2019). Model belgilarni aralashtirib yozishi mumkin */
const uzApostrophes = (v: string) =>
  v.replace(/(\p{L})['`ʻʼ‘’´](?=\p{L})/gu, (_, letter: string) => `${letter}${/[oOgG]/.test(letter) ? "‘" : "’"}`);

// Saqlashdagi muallif ismi qoidasiga (harflar, tutuq belgilari, nuqta, defis) mos kelmaydigan belgilar
const NOT_NAME = /[^\p{L}\p{M}'‘’ʻʼ`.\- ]/gu;
// Bo‘shliqlar avval oddiy probelga aylanadi (aks holda NBSP kabi belgi o‘chib, ism va familiya yopishib qoladi)
const name = (v: string) =>
  uzApostrophes(v.replace(/\s+/g, " ").replace(NOT_NAME, "").replace(/ +/g, " ").trim()).slice(0, 64);
/** Familiyalarni solishtirish: katta-kichik harf, tutuq belgisi va nuqtalar farqi hisobga olinmaydi */
const sameName = (a: string, b: string) => a.toLowerCase().replace(/[^\p{L}]/gu, "") === b.toLowerCase().replace(/[^\p{L}]/gu, "");

/**
 * Taklifni forma qoidalariga moslaydi: ortiqcha belgilar tozalanadi, uzun matn qisqartiriladi.
 * Tuzatib bo‘lmaydigan maydon taklifdan chiqariladi (dropped). notes — modelga qaytariladigan izoh (inglizcha):
 * qaysi maydon kesildi yoki qo‘llanmadi, model keyingi qadamda to‘g‘rilab yuboradi.
 */
export function normalizeProposal(input: ToolInput, draft: AiDraft) {
  const proposal: AiProposal = {};
  const dropped: string[] = [];
  const notes: string[] = [];
  if (input.lang) proposal.lang = input.lang;

  for (const lang of LANGS) {
    const s = LANG_SUFFIX[lang];
    const uz = (v: string) => (lang === "uz" ? uzApostrophes(v) : v);
    const title = input[`title${s}`];
    if (title !== undefined) {
      const full = uz(oneLine(title).replace(/(?<!\.)\.$/, ""));
      const v = clamp(full, L.titleMax);
      if (v.length < full.length) notes.push(`title${s} had ${full.length} characters (max ${L.titleMax}) and was cut; send a shorter title.`);
      if (v) proposal[`title${s}`] = v;
      else dropped.push(`title${s}`);
    }
    const abstract = input[`abstract${s}`];
    if (abstract !== undefined) {
      const full = uz(cleanText(abstract));
      const v = clamp(full, L.abstractMax);
      if (v.length < full.length)
        notes.push(`abstract${s} had ${full.length} characters (max ${L.abstractMax}) and was cut at a sentence end; send a complete version under ${L.abstractMax} characters.`);
      if (v) proposal[`abstract${s}`] = v;
      else dropped.push(`abstract${s}`);
    }
    const words = input[`keywords${s}`];
    if (words !== undefined) {
      // Formada kalit so‘zlar vergul bilan yoziladi: ichida vergul bo‘lgan "so‘z" saqlashda ikkiga bo‘linib, limitdan oshardi
      const split = words.flatMap((w) => w.split(/[,;\n]/)).map((w) => uz(oneLine(w).replace(/\.+$/, ""))).filter(Boolean);
      const long = split.filter((w) => w.length > L.keywordMax);
      if (long.length) notes.push(`keywords${s}: removed keywords longer than ${L.keywordMax} characters: ${long.join("; ")}.`);
      const seen = new Set<string>();
      const unique = split.filter((w) => w.length <= L.keywordMax && !seen.has(w.toLowerCase()) && seen.add(w.toLowerCase()));
      if (unique.length > L.keywordsMax) notes.push(`keywords${s}: only the first ${L.keywordsMax} keywords were kept.`);
      const v = unique.slice(0, L.keywordsMax);
      if (v.length) proposal[`keywords${s}`] = v;
      else dropped.push(`keywords${s}`);
    }
  }

  if (input.authors !== undefined) {
    // O‘qituvchining o‘z qatori (profiliga bog‘lanadi) formadagidek qoladi: maqola matnidagi yashirin
    // ko‘rsatma uning ismi yoki ORCID’ini almashtira olmasin
    const me = draft.authors.find((a) => a.isMe);
    const marked = input.authors.filter((a) => a.isMe);
    const problem =
      input.authors.length === 0 || input.authors.length > L.authorsMax
        ? `the list must have 1-${L.authorsMax} authors`
        : marked.length !== 1
          ? "exactly one author must have isMe: true (the teacher's own row)"
          : // Boshqa muallif "isMe" deb belgilansa, uning ismi o‘qituvchinikiga almashib ketardi
            me?.familyName && !sameName(marked[0].familyName, me.familyName)
            ? `the row marked isMe is "${marked[0].givenName} ${marked[0].familyName}", but the teacher is "${me.givenName} ${me.familyName}"; keep the teacher's row with exactly their name`
            : null;
    if (problem) {
      dropped.push("authors");
      notes.push(`authors were not applied: ${problem}.`);
    } else {
      // Ismi bo‘sh hammuallif ham qoladi: forma saqlashda aynan o‘sha qatorni ko‘rsatadi
      proposal.authors = input.authors.map((a) => ({
        givenName: name(a.isMe && me?.givenName ? me.givenName : a.givenName),
        familyName: name(a.isMe && me?.familyName ? me.familyName : a.familyName),
        institution: clamp(oneLine(a.institution), 150),
        orcid: normalizeOrcid(a.isMe && me ? me.orcid : a.orcid) ?? "",
        isMe: a.isMe,
      }));
    }
  }
  return { proposal, dropped, notes };
}
