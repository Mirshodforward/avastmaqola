"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Field } from "@/components/auth/field";
import { Section, TextAreaField } from "@/components/profile/controls";
import type { AiDraft, AiProposal } from "@/lib/ai";
import { sendForm, sendJson } from "@/lib/api-client";
import {
  ARTICLE_LIMITS as L,
  LICENSES,
  LICENSE_INFO,
  articleProblems,
  splitKeywords,
  type AuthorInput,
  type License,
  type Problem,
} from "@/lib/article-rules";
import type { ApiError } from "@/lib/auth-types";
import { formatBytes } from "@/lib/format";
import { LANGS, LANG_LABELS, LANG_SUFFIX, type Lang } from "@/lib/langs";
import type { ArticleView as View } from "@/server/articles/view";
import { AiPanel, SparkIcon } from "./ai-panel";
import { ArticlePreview } from "./article-preview";
import { useAssistant } from "./use-assistant";

type TextKey = `${"title" | "abstract" | "keywords"}${"Uz" | "Ru" | "En"}`;

/** Formadagi matnlar: kalit so‘zlar vergul bilan yoziladi, saqlashda ro‘yxatga aylanadi */
export type EditorValues = { lang: Lang | ""; license: License; rightsConfirmed: boolean } & Record<TextKey, string>;

type Errors = Partial<Record<string, string>>;
/** Muallif qatori barqaror kalit bilan: tartib o‘zgarganda fokus o‘sha muallif bilan birga ko‘chadi */
type Row = AuthorInput & { uid: number };


const langOf = (field: string) => LANGS.find((l) => field.split(".")[0].endsWith(LANG_SUFFIX[l]));

/** Oldindan ko‘rish uchun serverdan: maqoladagi muallif bloki va sahifa manzili */
export type PreviewContext = {
  owner: View["owner"];
  others: View["others"];
  updatedAt: string;
  absoluteUrl: string;
};

/** AI taklifi qo‘llanishidan oldingi qiymatlar: "Bekor qilish" ularni qaytaradi */
type AiSnapshot = { values: Partial<EditorValues>; rows: Row[] | null };

function payload(values: EditorValues, rows: Row[]) {
  return {
    ...values,
    keywordsUz: splitKeywords(values.keywordsUz),
    keywordsRu: splitKeywords(values.keywordsRu),
    keywordsEn: splitKeywords(values.keywordsEn),
    authors: rows.map((r) => ({
      givenName: r.givenName,
      familyName: r.familyName,
      institution: r.institution,
      orcid: r.orcid,
      isMe: r.isMe,
    })),
  };
}

export function ArticleEditor({
  id,
  initial,
  initialAuthors,
  initialPdfBytes,
  reviewNote,
  hasProfile,
  canDelete,
  ai,
  preview,
}: {
  id: number;
  initial: EditorValues;
  initialAuthors: AuthorInput[];
  initialPdfBytes: number | null;
  reviewNote: string | null;
  hasProfile: boolean;
  canDelete: boolean;
  /** AI yordamchi yoqilganmi (serverda API kalit bor) */
  ai: boolean;
  preview: PreviewContext;
}) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  // Boshlang‘ich kalitlar tartib raqami: server va brauzer bir xil chizadi (gidratsiya mos keladi)
  const [rows, setRows] = useState<Row[]>(() => initialAuthors.map((a, i) => ({ ...a, uid: i + 1 })));
  const uidSeq = useRef(initialAuthors.length);
  const withUid = (a: AuthorInput): Row => ({ ...a, uid: ++uidSeq.current });
  const [pdfBytes, setPdfBytes] = useState(initialPdfBytes);
  const [tab, setTab] = useState<Lang>(initial.lang || "uz");
  const [errors, setErrors] = useState<Errors>({});
  const [serverProblems, setServerProblems] = useState<Problem[] | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState<"save" | "submit" | "delete" | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const aiDialog = useRef<HTMLDialogElement>(null);
  const aiSnapshots = useRef(new Map<number, AiSnapshot>());
  // PDF almashtirilayotganda yuborilsa, admin eski PDF’ni ko‘rardi — yuklash ham umumiy qulfga kiradi
  const blocked = busy !== null || uploading;

  const assistant = useAssistant(id, {
    draft: (): AiDraft => ({
      lang: values.lang,
      titleUz: values.titleUz,
      titleRu: values.titleRu,
      titleEn: values.titleEn,
      abstractUz: values.abstractUz,
      abstractRu: values.abstractRu,
      abstractEn: values.abstractEn,
      keywordsUz: body.keywordsUz,
      keywordsRu: body.keywordsRu,
      keywordsEn: body.keywordsEn,
      authors: body.authors,
    }),
    apply: applyAi,
    undo: undoAi,
  });

  // Mobil ekranda AI yordamchi alohida oynada
  useEffect(() => {
    const d = aiDialog.current;
    if (aiOpen && !d?.open) d?.showModal();
    if (!aiOpen && d?.open) d.close();
  }, [aiOpen]);

  // Saqlanmagan matn bilan chiqishdan ogohlantirish: yopish/yangilash (beforeunload) va sayt ichidagi
  // havolalar — Next Link sahifani almashtirganda beforeunload ishlamaydi
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    const onClick = (e: MouseEvent) => {
      const link = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank" || link.origin !== location.origin) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // yangi oynada ochish
      if (!window.confirm("Saqlanmagan o‘zgarishlar yo‘qoladi. Sahifadan chiqasizmi?")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);

  const body = payload(values, rows);
  const problems: Problem[] = [
    ...(hasProfile ? [] : [{ field: "profile", message: "Avval profilingizni to‘ldiring" }]),
    ...articleProblems({ ...body, lang: values.lang || null, hasPdf: pdfBytes !== null }),
  ];
  const shown = serverProblems ?? problems;

  function touch(keys: string[]) {
    setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !keys.includes(k))));
    setDirty(true);
    setNotice(null);
    setServerProblems(null);
  }

  function update<K extends keyof EditorValues>(key: K, value: EditorValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    touch([key]);
  }

  function updateRow(i: number, patch: Partial<AuthorInput>) {
    setRows((list) => list.map((r, j) => (j === i ? { ...r, ...patch } : r)));
    touch(Object.keys(patch).map((k) => `authors.${i}.${k}`));
  }

  /** Qator qo‘shilsa, o‘chsa yoki ko‘chsa — indeksga bog‘langan eski xatolar noto‘g‘ri qatorga tushmasin */
  function reorder(next: Row[]) {
    setRows(next);
    setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !k.startsWith("authors"))));
    setDirty(true);
    setNotice(null);
  }

  /** Qator ko‘chgach/o‘chgach fokus yo‘qolmasin: o‘sha tugma (chekkada o‘chsa — qarama-qarshisi) yoki birinchi maydon */
  function focusRow(uid: number, action: "up" | "down" | "field") {
    requestAnimationFrame(() => {
      const row = document.querySelector(`[data-row="${uid}"]`);
      const other = action === "up" ? "down" : "up";
      const target =
        (action !== "field" && row?.querySelector<HTMLElement>(`[data-action="${action}"]:not([disabled])`)) ||
        (action !== "field" && row?.querySelector<HTMLElement>(`[data-action="${other}"]:not([disabled])`)) ||
        row?.querySelector<HTMLElement>("input");
      target?.focus();
    });
  }

  function move(i: number, delta: -1 | 1) {
    const next = [...rows];
    [next[i], next[i + delta]] = [next[i + delta], next[i]];
    reorder(next);
    focusRow(rows[i].uid, delta < 0 ? "up" : "down");
  }

  function removeRow(i: number) {
    const neighbor = rows[i - 1] ?? rows[i + 1];
    reorder(rows.filter((_, j) => j !== i));
    if (neighbor) focusRow(neighbor.uid, "field");
  }

  function addRow() {
    const row = withUid({ givenName: "", familyName: "", institution: "", orcid: "", isMe: false });
    reorder([...rows, row]);
    focusRow(row.uid, "field");
  }

  function focusField(field: string) {
    const lang = langOf(field);
    if (lang) setTab(lang);
    setAiOpen(false);
    setPreviewOpen(false);
    const name = field === "authors" ? "authors.0.familyName" : field;
    // Panel ko‘ringach fokuslanadi (yashirin elementga fokus tushmaydi)
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`[name="${name}"]`)?.focus());
  }

  /**
   * AI taklifini formaga qo‘llaydi. Bitta javob ichida taklif to‘ldirib boriladi: avvalgi qo‘llash
   * shu yerda bekor qilinib, butun taklif qayta qo‘llanadi — "Bekor qilish" doim AI’dan oldingi holatga qaytaradi.
   */
  function applyAi(messageId: number, p: AiProposal): boolean {
    if (blocked) return false; // saqlash paytida forma qulf: taklif tugma bilan keyin qo‘llanadi
    const { authors, ...fields } = p;
    const next: Partial<EditorValues> = Object.fromEntries(
      Object.entries(fields).map(([k, v]) => [k, Array.isArray(v) ? v.join(", ") : v]),
    );
    const before = aiSnapshots.current.get(messageId);
    const base = { ...values, ...before?.values };
    const baseRows = before?.rows ?? rows;
    aiSnapshots.current.set(messageId, {
      values: Object.fromEntries(Object.keys(next).map((k) => [k, base[k as keyof EditorValues]])),
      rows: authors ? baseRows : null,
    });
    setValues({ ...base, ...next });
    touch(Object.keys(next));
    // Mualliflar ro‘yxati butunlay almashadi (reorder qatorlarga bog‘langan eski xatolarni ham tozalaydi)
    if (authors) reorder(authors.map(withUid));
    else if (before?.rows) reorder(before.rows);
    return true;
  }

  function undoAi(messageId: number) {
    const before = aiSnapshots.current.get(messageId);
    if (!before) return;
    aiSnapshots.current.delete(messageId);
    setValues((v) => ({ ...v, ...before.values }));
    touch(Object.keys(before.values));
    if (before.rows) reorder(before.rows);
  }

  function showError(error: ApiError & { problems?: Problem[] }) {
    setNotice({ ok: false, text: error.message });
    if (error.problems) {
      setServerProblems(error.problems);
      // Ko‘rinish oynasi yopilgach (ochiq modal tashqarisiga fokus tushmaydi)
      requestAnimationFrame(() => document.getElementById("checklist")?.focus());
    }
    // "keywordsRu.2" → keywordsRu; mualliflar maydoni esa qator bilan qoladi
    const raw = error.fieldErrors ?? (error.field ? { [error.field]: error.message } : {});
    const next: Errors = {};
    for (const [k, msg] of Object.entries(raw)) next[k.startsWith("authors.") ? k : k.split(".")[0]] ??= msg;
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) focusField(first);
  }

  async function persist() {
    const res = await sendJson("PATCH", `/api/articles/${id}`, body);
    if (res.ok) {
      setDirty(false);
      setErrors({});
      return true;
    }
    showError(res.error);
    return false;
  }

  async function save() {
    if (blocked) return;
    setBusy("save");
    if (await persist()) setNotice({ ok: true, text: "Saqlandi." });
    setBusy(null);
  }

  /** Yuborishdan oldin o‘qituvchi sahifaning yakuniy ko‘rinishini ko‘radi va tasdiqlaydi */
  function openPreview() {
    if (blocked) return;
    setNotice(null);
    setAiOpen(false);
    setPreviewOpen(true);
  }

  async function submit() {
    if (blocked) return;
    setNotice(null);
    setServerProblems(null);
    if (problems.length) {
      setPreviewOpen(false);
      setNotice({ ok: false, text: "Yuborishdan oldin ro‘yxatdagi kamchiliklarni tuzating." });
      requestAnimationFrame(() => document.getElementById("checklist")?.focus());
      return;
    }
    setBusy("submit");
    if (dirty && !(await persist())) {
      setPreviewOpen(false);
      setBusy(null);
      return;
    }
    const res = await sendJson("POST", `/api/articles/${id}/submit`);
    if (res.ok) {
      router.refresh(); // sahifa "Ko‘rib chiqilmoqda" ko‘rinishiga o‘tadi
      return;
    }
    setPreviewOpen(false);
    setBusy(null);
    showError(res.error);
  }

  const previewView = (): View => ({
    id,
    ownerId: "",
    status: "draft",
    lang: values.lang || "uz",
    titles: { uz: values.titleUz.trim(), ru: values.titleRu.trim(), en: values.titleEn.trim() },
    abstracts: { uz: values.abstractUz.trim(), ru: values.abstractRu.trim(), en: values.abstractEn.trim() },
    keywords: { uz: body.keywordsUz, ru: body.keywordsRu, en: body.keywordsEn },
    license: values.license,
    pdfBytes,
    submittedAt: null,
    publishedAt: null,
    updatedAt: new Date(preview.updatedAt),
    reviewNote: null,
    authors: rows.map((r) => ({
      givenName: r.givenName.trim(),
      familyName: r.familyName.trim(),
      institution: r.institution.trim() || null,
      orcid: r.orcid.trim() || null,
      isOwner: r.isMe,
    })),
    owner: preview.owner,
    others: preview.others,
  });

  async function remove() {
    if (blocked || !window.confirm("Maqola o‘chirilsinmi? Buni qaytarib bo‘lmaydi.")) return;
    setBusy("delete");
    const res = await sendJson("DELETE", `/api/articles/${id}`);
    if (res.ok) {
      setDirty(false);
      router.push("/dashboard");
      return;
    }
    setBusy(null);
    showError(res.error);
  }

  const text = (key: TextKey) => ({
    name: key,
    value: values[key],
    error: errors[key],
    onChange: (e: { target: { value: string } }) => update(key, e.target.value),
  });

  return (
    <div className="mt-8 xl:grid xl:grid-cols-[minmax(0,1fr)_26rem] xl:items-start xl:gap-8 2xl:grid-cols-[minmax(0,1fr)_30rem]">
    <div className="min-w-0 max-w-3xl space-y-6 xl:max-w-none">
      {ai && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-lapis/30 bg-paper p-4 xl:hidden">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-lapis text-on-lapis">
            <SparkIcon className="size-5" />
          </span>
          <p className="min-w-0 flex-1 text-sm">
            <span className="font-medium">AI yordamchi</span> maqolangizni PDF yoki matndan uch tilda to‘ldirib beradi.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => setAiOpen(true)}>
            Ochish
          </button>
        </div>
      )}

      {reviewNote && (
        <div className="rounded-xl border border-danger/40 bg-danger-soft p-5">
          <p className="font-medium text-danger">Universitet izohi</p>
          <p className="mt-1 whitespace-pre-line">{reviewNote}</p>
          <p className="mt-2 text-sm text-muted">Tuzatib, maqolani qayta yuboring.</p>
        </div>
      )}

      {/* Saqlash/yuborish paytida forma qulflanadi: shu orada yozilgan matn "saqlandi" deb belgilanmasin */}
      <fieldset disabled={busy !== null} className="m-0 min-w-0 space-y-6 border-0 p-0">
      <Section title="Til va mualliflar" description="Mualliflar maqola PDF faylidagi tartibda bo‘lsin.">
        <fieldset className="sm:col-span-2">
          <legend className="text-sm font-medium">Maqola (PDF) qaysi tilda yozilgan? *</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {LANGS.map((l) => (
              <label
                key={l}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-line px-3 py-2 has-[:checked]:border-lapis"
              >
                <input
                  type="radio"
                  name="lang"
                  value={l}
                  checked={values.lang === l}
                  onChange={() => update("lang", l)}
                  aria-describedby="lang-message"
                  className="accent-[var(--lapis)]"
                />
                {LANG_LABELS[l]}
              </label>
            ))}
          </div>
          <p id="lang-message" className={`mt-1.5 text-sm ${errors.lang ? "text-danger" : "text-muted"}`}>
            {errors.lang ?? "Shu tildagi sarlavha sahifaning asosiy sarlavhasi bo‘ladi."}
          </p>
        </fieldset>

        <div className="space-y-4 sm:col-span-2">
          {rows.map((a, i) => (
            <fieldset key={a.uid} data-row={a.uid} className="rounded-lg border border-line p-4">
              <legend className="px-1 text-sm font-medium">
                {i + 1}-muallif{a.isMe ? " (siz)" : ""}
              </legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Familiya *"
                  name={`authors.${i}.familyName`}
                  value={a.familyName}
                  error={errors[`authors.${i}.familyName`]}
                  onChange={(e) => updateRow(i, { familyName: e.target.value })}
                />
                <Field
                  label="Ism *"
                  name={`authors.${i}.givenName`}
                  value={a.givenName}
                  error={errors[`authors.${i}.givenName`]}
                  onChange={(e) => updateRow(i, { givenName: e.target.value })}
                />
                <Field
                  label="Muassasa"
                  name={`authors.${i}.institution`}
                  value={a.institution}
                  error={errors[`authors.${i}.institution`]}
                  onChange={(e) => updateRow(i, { institution: e.target.value })}
                />
                <Field
                  label="ORCID iD"
                  name={`authors.${i}.orcid`}
                  placeholder="0000-0000-0000-0000"
                  spellCheck={false}
                  value={a.orcid}
                  error={errors[`authors.${i}.orcid`]}
                  onChange={(e) => updateRow(i, { orcid: e.target.value })}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-1 text-sm">
                <button type="button" data-action="up" className="btn btn-ghost" disabled={i === 0} onClick={() => move(i, -1)}>
                  ↑ Yuqoriga
                </button>
                <button
                  type="button"
                  data-action="down"
                  className="btn btn-ghost"
                  disabled={i === rows.length - 1}
                  onClick={() => move(i, 1)}
                >
                  ↓ Pastga
                </button>
                {!a.isMe && (
                  <button type="button" className="btn btn-ghost text-danger" onClick={() => removeRow(i)}>
                    Olib tashlash
                  </button>
                )}
              </div>
            </fieldset>
          ))}
          {errors.authors && <p className="text-sm text-danger">{errors.authors}</p>}
          {rows.length < L.authorsMax && (
            <button type="button" className="btn btn-secondary" onClick={addRow}>
              + Hammuallif qo‘shish
            </button>
          )}
        </div>
      </Section>

      <section aria-labelledby="texts-title" className="rounded-xl border border-line bg-paper p-5 sm:p-6">
        <h2 id="texts-title" className="font-serif text-lg font-semibold">
          Sarlavha, annotatsiya va kalit so‘zlar
        </h2>
        <p className="mt-1 text-sm text-muted">
          Uch tilda to‘ldiriladi. Maqolaning o‘zi bitta PDF — tarjima faqat shu uch qism uchun kerak.
        </p>
        <LangTabs tab={tab} onChange={setTab} main={values.lang} problems={problems} />
        {LANGS.map((l) => {
          const s = LANG_SUFFIX[l];
          const main = values.lang && values.lang !== l ? values.lang : null;
          return (
            <div key={l} role="tabpanel" id={`panel-${l}`} aria-labelledby={`tab-${l}`} hidden={tab !== l} className="mt-5 space-y-5">
              {main && (
                <details open className="rounded-lg bg-mist p-4 text-sm">
                  <summary className="cursor-pointer font-medium">Asosiy tildagi matn ({LANG_LABELS[main]})</summary>
                  <p lang={main} className="mt-2 font-medium">
                    {values[`title${LANG_SUFFIX[main]}`] || "—"}
                  </p>
                  <p lang={main} className="mt-2 whitespace-pre-line text-muted">
                    {values[`abstract${LANG_SUFFIX[main]}`] || "—"}
                  </p>
                </details>
              )}
              <TextAreaField
                label={`Sarlavha (${LANG_LABELS[l]}) *`}
                lang={l}
                rows={2}
                maxLength={L.titleMax}
                className="input mt-1.5 min-h-0"
                {...text(`title${s}`)}
              />
              <TextAreaField
                label={`Annotatsiya (${LANG_LABELS[l]}) *`}
                lang={l}
                rows={9}
                maxLength={L.abstractMax}
                hint={`${values[`abstract${s}`].trim().length}/${L.abstractMax} belgi, kamida ${L.abstractMin}.`}
                {...text(`abstract${s}`)}
              />
              <Field
                label={`Kalit so‘zlar (${LANG_LABELS[l]}) *`}
                lang={l}
                hint={`Vergul bilan ajrating: ${L.keywordsMin}–${L.keywordsMax} ta. Hozir: ${splitKeywords(values[`keywords${s}`]).length}.`}
                {...text(`keywords${s}`)}
              />
            </div>
          );
        })}
      </section>

      <PdfField
        id={id}
        bytes={pdfBytes}
        error={errors.pdf}
        uploading={uploading}
        onUploading={setUploading}
        onUploaded={setPdfBytes}
      />

      <Section title="Litsenziya va huquq">
        <fieldset className="sm:col-span-2">
          <legend className="text-sm font-medium">Litsenziya</legend>
          {LICENSES.map((lic) => (
            <label key={lic} className="mt-2 flex cursor-pointer items-start gap-3">
              <input
                type="radio"
                name="license"
                checked={values.license === lic}
                onChange={() => update("license", lic)}
                className="mt-1 accent-[var(--lapis)]"
              />
              <span>
                <span className="font-medium">{LICENSE_INFO[lic].label}</span>
                <span className="block text-sm text-muted">{LICENSE_INFO[lic].hint}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <label className="flex items-start gap-3 sm:col-span-2">
          <input
            type="checkbox"
            name="rightsConfirmed"
            checked={values.rightsConfirmed}
            onChange={(e) => update("rightsConfirmed", e.target.checked)}
            aria-invalid={errors.rightsConfirmed ? true : undefined}
            className="mt-1 size-4 accent-[var(--lapis)]"
          />
          <span>
            <span className="font-medium">Maqolani bu yerda ochiq joylashga huquqim bor</span>
            <span className="block text-sm text-muted">
              Men maqola mualliflaridan biriman, hammualliflar rozi. Maqola jurnalda chiqqan bo‘lsa, jurnal qoidasi
              ochiq nusxa joylashga ruxsat beradi.
            </span>
          </span>
        </label>
      </Section>
      </fieldset>

      <section
        id="checklist"
        tabIndex={-1}
        aria-labelledby="checklist-title"
        className="rounded-xl border border-line bg-paper p-5 outline-none sm:p-6"
      >
        <h2 id="checklist-title" className="font-serif text-lg font-semibold">
          Yuborishdan oldin
        </h2>
        {shown.length === 0 ? (
          <p className="mt-2 text-sm text-tile">Hammasi tayyor: maqolani ko‘rib chiqishga yuborishingiz mumkin.</p>
        ) : (
          <ul className="mt-3 space-y-1.5 text-sm">
            {shown.map((p) => (
              <li key={`${p.field}:${p.message}`} className="flex gap-2">
                <span aria-hidden="true" className="text-danger">
                  •
                </span>
                {p.field === "profile" ? (
                  <Link href="/dashboard/profile" className="link">
                    {p.message}
                  </Link>
                ) : (
                  <button type="button" className="link text-left" onClick={() => focusField(p.field)}>
                    {p.message}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-mist/95 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:bg-paper/95">
        {/* disabled emas, aria-disabled: bosilgan tugma o‘chib qolsa klaviatura fokusi yo‘qoladi */}
        <button type="button" className="btn btn-secondary" aria-disabled={blocked} onClick={save}>
          {busy === "save" ? "Saqlanmoqda…" : "Saqlash"}
        </button>
        <button type="button" className="btn btn-primary" aria-disabled={blocked} onClick={openPreview}>
          {busy === "submit" ? "Yuborilmoqda…" : uploading ? "PDF yuklanmoqda…" : "Ko‘rish va yuborish"}
        </button>
        {ai && (
          <button type="button" className="btn btn-ghost xl:hidden" onClick={() => setAiOpen(true)}>
            <SparkIcon /> AI yordamchi
          </button>
        )}
        {canDelete && (
          <button type="button" className="btn btn-ghost text-danger" aria-disabled={blocked} onClick={remove}>
            O‘chirish
          </button>
        )}
        <p role="status" className={`text-sm ${notice?.ok ? "font-medium text-tile" : "text-danger"}`}>
          {notice?.text}
        </p>
        {dirty && !notice && <p className="text-sm text-muted">Saqlanmagan o‘zgarishlar bor.</p>}
      </div>
    </div>

    {ai && (
      <aside
        aria-label="AI yordamchi"
        className="hidden overflow-hidden rounded-xl border border-line bg-paper xl:sticky xl:top-4 xl:flex xl:h-[calc(100svh-2rem)] xl:flex-col"
      >
        <AiPanel assistant={assistant} hasPdf={pdfBytes !== null} onPreview={openPreview} onFocusField={focusField} />
      </aside>
    )}
    {ai && (
      <dialog
        ref={aiDialog}
        onClose={() => setAiOpen(false)}
        aria-label="AI yordamchi"
        className="m-0 ml-auto h-dvh max-h-none w-full max-w-md bg-paper p-0 text-ink backdrop:bg-ink/50 sm:border-l sm:border-line"
      >
        {aiOpen && (
          <AiPanel
            assistant={assistant}
            hasPdf={pdfBytes !== null}
            onPreview={openPreview}
            onFocusField={focusField}
            onClose={() => setAiOpen(false)}
          />
        )}
      </dialog>
    )}
    <ArticlePreview
      open={previewOpen}
      view={previewView}
      absoluteUrl={preview.absoluteUrl}
      problems={problems}
      submitting={busy === "submit"}
      onClose={() => setPreviewOpen(false)}
      onSubmit={submit}
      onFix={focusField}
    />
    </div>
  );
}

/** Til tablari: har birida holat matn bilan (rangga tayanmaydi), strelkalar bilan boshqariladi */
function LangTabs({ tab, onChange, main, problems }: { tab: Lang; onChange: (l: Lang) => void; main: Lang | ""; problems: Problem[] }) {
  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    const i = LANGS.indexOf(tab);
    const keys: Partial<Record<string, Lang>> = {
      ArrowRight: LANGS[(i + 1) % 3],
      ArrowLeft: LANGS[(i + 2) % 3],
      Home: LANGS[0],
      End: LANGS[2],
    };
    const next = keys[e.key];
    if (!next) return;
    e.preventDefault();
    onChange(next);
    document.getElementById(`tab-${next}`)?.focus();
  }

  return (
    <div role="tablist" aria-label="Til" className="mt-5 flex gap-1 overflow-x-auto border-b border-line">
      {LANGS.map((l) => {
        const left = problems.filter((p) => langOf(p.field) === l).length;
        return (
          <button
            key={l}
            id={`tab-${l}`}
            type="button"
            role="tab"
            aria-selected={tab === l}
            aria-controls={`panel-${l}`}
            tabIndex={tab === l ? 0 : -1}
            onClick={() => onChange(l)}
            onKeyDown={onKeyDown}
            className={`-mb-px shrink-0 border-b-2 px-4 py-2.5 text-left ${tab === l ? "border-lapis" : "border-transparent hover:border-line"}`}
          >
            <span className="block font-medium">
              {LANG_LABELS[l]}
              {main === l && <span className="ml-1.5 text-xs font-normal text-muted">asosiy</span>}
            </span>
            <span className={`block text-xs ${left ? "text-muted" : "text-tile"}`}>{left ? `${left} ta kamchilik` : "tayyor"}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Yuklash holati muharrirda saqlanadi: yuklash tugamaguncha saqlash/yuborish/o‘chirish bloklanadi */
function PdfField({
  id,
  bytes,
  error,
  uploading,
  onUploading,
  onUploaded,
}: {
  id: number;
  bytes: number | null;
  error?: string;
  uploading: boolean;
  onUploading: (value: boolean) => void;
  onUploaded: (bytes: number) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const message = uploadError ?? error;

  async function upload(file: File) {
    if (file.size > L.pdfMaxBytes) {
      setUploadError("PDF hajmi 10 MB dan oshmasligi kerak.");
      return;
    }
    onUploading(true);
    setUploadError(null);
    const form = new FormData();
    form.append("file", file);
    const res = await sendForm<{ pdfBytes: number }>(`/api/articles/${id}/pdf`, form, "PUT");
    onUploading(false);
    if (res.ok) onUploaded(res.pdfBytes);
    else setUploadError(res.error.message);
  }

  return (
    <Section title="PDF fayl" description="Maqolaning to‘liq matni, 10 MB gacha. Fayl darhol saqlanadi.">
      <div className="space-y-3 sm:col-span-2">
        {bytes ? (
          <p className="text-sm">
            Yuklangan: {formatBytes(bytes)} ·{" "}
            <a href={`/maqola/${id}/pdf`} className="link" target="_blank" rel="noopener">
              Ko‘rish
            </a>
          </p>
        ) : (
          <p className="text-sm text-muted">Hali yuklanmagan.</p>
        )}
        {bytes !== null && bytes > L.pdfScholarBytes && (
          <p className="text-sm text-muted">
            Fayl 5 MB dan katta: Google Scholar katta PDF’larni o‘qimasligi mumkin. Imkon bo‘lsa, siqilgan nusxasini
            yuklang.
          </p>
        )}
        <button type="button" name="pdf" className="btn btn-secondary" disabled={uploading} onClick={() => input.current?.click()}>
          {uploading ? "Yuklanmoqda…" : bytes ? "PDF’ni almashtirish" : "PDF yuklash"}
        </button>
        <input
          ref={input}
          type="file"
          accept="application/pdf,.pdf"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
            e.target.value = "";
          }}
        />
        {message && (
          <p role="alert" className="text-sm text-danger">
            {message}
          </p>
        )}
      </div>
    </Section>
  );
}
