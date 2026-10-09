// AI yordamchi: server va klient o‘rtasidagi shakllar (faqat tiplar va yorliqlar).
import type { AuthorInput } from "./article-rules";
import { LANGS, LANG_LABELS, LANG_SUFFIX, type Lang } from "./langs";

type TextField = `${"title" | "abstract"}${"Uz" | "Ru" | "En"}`;
type KeywordsField = `keywords${"Uz" | "Ru" | "En"}`;

/** Model taklif qilgan o‘zgarishlar: faqat o‘zgaradigan maydonlar bo‘ladi */
export type AiProposal = Partial<
  { lang: Lang; authors: AuthorInput[] } & Record<TextField, string> & Record<KeywordsField, string[]>
>;
export type AiField = keyof AiProposal;

/** Formaning joriy (saqlanmagan bo‘lishi mumkin) holati — modelga kontekst */
export type AiDraft = {
  lang: Lang | "";
  authors: AuthorInput[];
  hasProfile: boolean;
} & Record<TextField, string> &
  Record<KeywordsField, string[]>;

export type AiTurn = { role: "user" | "assistant"; text: string };

/** Javob oqimi (NDJSON): har qatorda bitta hodisa */
export type AiEvent =
  | { t: "status"; v: "thinking" | "writing" | "filling" }
  | { t: "text"; v: string }
  | { t: "field"; v: string }
  | { t: "proposal"; v: AiProposal; dropped: string[] }
  | { t: "error"; message: string }
  | { t: "done"; remaining: number };

export const AI_FIELD_LABELS: Record<AiField, string> = {
  lang: "Maqola tili",
  authors: "Mualliflar",
  ...(Object.fromEntries(
    LANGS.flatMap((l) => [
      [`title${LANG_SUFFIX[l]}`, `Sarlavha (${LANG_LABELS[l]})`],
      [`abstract${LANG_SUFFIX[l]}`, `Annotatsiya (${LANG_LABELS[l]})`],
      [`keywords${LANG_SUFFIX[l]}`, `Kalit so‘zlar (${LANG_LABELS[l]})`],
    ]),
  ) as Record<TextField | KeywordsField, string>),
};
