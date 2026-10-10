"use client";

import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Field } from "@/components/auth/field";
import { TextAreaField } from "@/components/profile/controls";
import type { AiDraft, AiProposal } from "@/lib/ai";
import { sendForm, sendJson } from "@/lib/api-client";
import {
  ARTICLE_LIMITS as L,
  articleProblems,
  normalizeDoi,
  splitKeywords,
  type AuthorInput,
  type License,
  type Problem,
  type VenueType,
} from "@/lib/article-rules";
import type { ApiError, ApiResult } from "@/lib/auth-types";
import { formatBytes } from "@/lib/format";
import { LANGS, LANG_LABELS, LANG_SUFFIX, type Lang } from "@/lib/langs";
import type { ArticleView as View } from "@/server/articles/view";
import { ACTIONS, AiPanel, SparkIcon } from "./ai-panel";
import { ArticlePreview } from "./article-preview";
import type { IssueValues } from "./issue-fields";
import { fieldsOf, useAssistant } from "./use-assistant";

type TextKey = `${"title" | "abstract" | "keywords"}${"Uz" | "Ru" | "En"}`;

/** Nashr ma’lumotlari (formada ko‘rsatilmaydi, saqlangan qiymat o‘zgarmay qaytadi): matn ko‘rinishida, server turga o‘giradi */
export type PublicationValues = {
  venueType: VenueType | "";
  venue: string;
  volume: string;
  issue: string;
  pages: string;
  pubYear: string;
  doi: string;
};

/** Formadagi matnlar: kalit so‘zlar vergul bilan yoziladi, saqlashda ro‘yxatga aylanadi. Son va raqam — yuborish oynasida */
export type EditorValues = { lang: Lang | ""; license: License } & Record<TextKey, string> &
  PublicationValues & IssueValues;

type Errors = Partial<Record<string, string>>;
/** Muallif qatori barqaror kalit bilan: tartib o‘zgarganda fokus o‘sha muallif bilan birga ko‘chadi */
type Row = AuthorInput & { uid: number };

/** Oxirgi o‘zgarishdan shuncha vaqt o‘tgach qoralama o‘zi saqlanadi */
const AUTOSAVE_MS = 2500;
/** Havola bosilganda saqlash shuncha kutiladi; ulanish osilib qolsa — chiqish-chiqmaslikni o‘qituvchi hal qiladi */
const LEAVE_WAIT_MS = 8000;
const NETWORK_ERROR: ApiError = { code: "network", message: "Server bilan aloqa yo‘q." };

/** Avtosaqlash o‘tmadi: qaysi matn (json) saqlanmadi va o‘qituvchi nima qila oladi */
type SaveFailure = { json: string; message: string; field?: string; retry: boolean };

const langOf = (field: string) => LANGS.find((l) => field.split(".")[0].endsWith(LANG_SUFFIX[l]));

/** Kamchilik qaysi bosqichga tegishli (0 — profil): hisoblagich, holat va ro‘yxat tartibi uchun; qoidalar o‘zgarmaydi */
function stepOf(field: string) {
  if (field === "pdf") return 1;
  if (field === "lang" || field.startsWith("title")) return 2;
  if (field.startsWith("authors")) return 3;
  if (/^(abstract|keywords)/.test(field)) return 4;
  return 0;
}
const byStep = (a: Problem, b: Problem) => stepOf(a.field) - stepOf(b.field);

/** Til tanlovi: 44px balandlik, tanlangani chegara va fon bilan (qalinlik o‘zgarmaydi — matn sakramaydi) */
const CHOICE =
  "flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border border-line px-4 py-2 has-[:checked]:border-lapis has-[:checked]:bg-lapis/5";

type StepState = "done" | "current" | "todo";
type AiStep = "offer" | "working" | "pending" | "done";

/** Oldindan ko‘rish uchun serverdan: maqoladagi muallif bloki va sahifa manzili */
export type PreviewContext = {
  owner: View["owner"];
  others: View["others"];
  updatedAt: string;
  absoluteUrl: string;
};

/**
 * AI taklifi: qo‘llashdan oldingi va qo‘llangan qiymatlar. "Bekor qilish" faqat hali AI qiymati turgan maydonlarni
 * qaytaradi — keyin o‘qituvchi yoki boshqa javob o‘zgartirgan maydonga tegilmaydi.
 */
type AiSnapshot = {
  before: Partial<EditorValues>;
  applied: Partial<EditorValues>;
  rows: { before: Row[]; applied: Row[] } | null;
};

/** Hali hech narsa yozilmagan hammuallif qatori */
const blank = (r: AuthorInput) => !r.isMe && ![r.givenName, r.familyName, r.institution, r.orcid].some((v) => v.trim());

/**
 * Saqlanadigan (va ko‘rinishga chiqadigan) mualliflar: oxiridagi bo‘sh hammuallif qatorlari tashlab ketiladi — ularda
 * yo‘qoladigan narsa yo‘q, avtosaqlash esa endigina qo‘shilgan qatorga «Familiyani kiriting» deb chiqmaydi. Qolganlarining
 * tartib raqami o‘zgarmaydi: server xatosi ("authors.1.givenName") aynan o‘sha qatorga tushadi
 */
function keptRows(rows: Row[]) {
  let end = rows.length;
  while (end > 0 && blank(rows[end - 1])) end--;
  return rows.slice(0, end);
}

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

/** Server maydon xatolari forma nomlari bilan: "keywordsRu.2" → keywordsRu; mualliflar maydoni qator bilan qoladi */
function fieldErrorsOf(error: ApiError): Errors {
  const raw = error.fieldErrors ?? (error.field ? { [error.field]: error.message } : {});
  const next: Errors = {};
  for (const [k, msg] of Object.entries(raw)) next[k.startsWith("authors.") ? k : k.split(".")[0]] ??= msg;
  return next;
}

/** Qoralamani saqlash. keepalive: sahifa yopilayotganda boshlangan so‘rov ham oxiriga yetadi */
async function patchDraft(id: number, json: string): Promise<ApiResult<object>> {
  try {
    const res = await fetch(`/api/articles/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: json,
      keepalive: true,
      cache: "no-store",
    });
    const body: unknown = await res.json();
    // Kutilmagan javob (proksi yoki WAF sahifasi) tarmoq xatosi kabi: aks holda avtosaqlash to‘xtamay takrorlanadi
    if (!body || typeof body !== "object" || !("ok" in body) || (!body.ok && !("error" in body))) {
      return { ok: false, error: NETWORK_ERROR };
    }
    return body as ApiResult<object>;
  } catch {
    return { ok: false, error: NETWORK_ERROR };
  }
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
  header,
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
  /** Sahifa sarlavhasi: forma ustunining tepasida (AI ustuni sahifa boshidan boshlanadi) */
  header: ReactNode;
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
  // Yuborish yoki o‘chirish o‘tmaganda (avtosaqlash holati alohida ko‘rsatiladi)
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<"submit" | "delete" | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  // Oxirgi PDF yuklangan paytdagi oxirgi xabar raqami: undan oldingi "to‘ldirish" so‘rovi eski PDF’niki
  const [uploadMark, setUploadMark] = useState<number | null>(null);
  const aiDialog = useRef<HTMLDialogElement>(null);
  const aiFocus = useRef<"input" | "close">("input");
  const aiButton = useRef<HTMLButtonElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const aiSnapshots = useRef(new Map<number, AiSnapshot>());
  // PDF almashtirilayotganda yuborilsa, admin eski PDF’ni ko‘rardi — yuklash ham umumiy qulfga kiradi
  const blocked = busy !== null || uploading;

  const kept = keptRows(rows);
  const body = payload(values, kept);

  // Avtosaqlash. json — serverga yuboriladigan matn; saqlangani bilan farq qilsa, saqlanmagan o‘zgarish bor.
  // Saqlash formani qulflamaydi (o‘qituvchi yozishda davom etadi, AI javobi ham formaga tushaveradi): so‘rov ketgan
  // paytdagi nusxa saqlangan deb belgilanadi, shu orada yozilgani navbatdagi saqlashga qoladi
  const json = JSON.stringify(body);
  const [saved, setSaved] = useState(json);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<SaveFailure | null>(null);
  const latest = useRef(json);
  const savedRef = useRef(json);
  const flight = useRef<Promise<SaveFailure | null> | null>(null);
  // Havola bosilgach saqlash kutilmoqda / o‘qituvchi chiqishni tanladi (himoya shu bosishni o‘tkazib yuboradi)
  const waiting = useRef(false);
  const leaving = useRef(false);
  // Maqola yuborildi yoki o‘chirildi: endi saqlanadigan narsa yo‘q
  const closed = useRef(false);
  useEffect(() => {
    latest.current = json;
  });
  const pending = json !== saved;
  // Maydon xatosi — o‘sha maydon tuzatilguncha (touch xatoni tozalaydi); boshqa xato (tarmoq…) — saqlanmagan
  // o‘zgarish bor ekan. O‘qituvchi o‘zgarishni qaytarib qo‘ysa, xato ham yo‘qoladi
  const failed = failure && (failure.field ? errors[failure.field] !== undefined : pending) ? failure : null;

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
      hasProfile,
    }),
    apply: applyAi,
    undo: undoAi,
  });
  // onUploaded yuklash boshlangan render’dan chaqiriladi: belgi yuklash tugagan paytdagi oxirgi xabardan olinadi —
  // shu orada yuborilgan so‘rov eski PDF’ni o‘qigan, yangi PDF’niki sanalmasin
  const lastMessageId = useRef(0);
  useEffect(() => {
    lastMessageId.current = assistant.messages.at(-1)?.id ?? 0;
  });

  // Mobil ekranda AI yordamchi alohida oynada
  useEffect(() => {
    const d = aiDialog.current;
    if (aiOpen && !d?.open) {
      d?.showModal();
      // Birinchi tugma («Yangi suhbat») emas: xabar maydoni, PDF kartasidan ochilganda esa yopish tugmasi fokuslansin
      d?.querySelector<HTMLElement>(aiFocus.current === "close" ? '[aria-label="AI yordamchini yopish"]' : "textarea")?.focus();
    }
    if (!aiOpen && d?.open) d.close();
  }, [aiOpen]);

  /** AI oynasi (telefon): bar tugmasidan — xabar maydoniga, PDF kartasidan — yopish tugmasiga (klaviatura jarayonni yopmasin) */
  function openAi(focus: "input" | "close" = "input") {
    aiFocus.current = focus;
    setAiOpen(true);
  }

  // Oxirgi o‘zgarishdan AUTOSAVE_MS o‘tgach saqlanadi. Yuborish, o‘chirish va PDF yuklash paytida kutadi; shu matn
  // saqlanmay qolgan bo‘lsa (xato) — yangi o‘zgarishni yoki «qayta urinish»ni kutadi
  const autosave = useEffectEvent(() => {
    if (!closed.current) void saveOnce();
  });
  useEffect(() => {
    if (!pending || saving || blocked || json === failure?.json) return;
    const timer = setTimeout(() => autosave(), AUTOSAVE_MS);
    return () => clearTimeout(timer);
  }, [json, pending, saving, blocked, failure]);

  // Boshqa oynaga o‘tganda yoki sahifa yopilayotganda kutmasdan saqlanadi. Next boshqa sahifaga o‘tganda muharrirni
  // yashiradi (Activity) — effekt tozalanishi o‘sha payt ham saqlaydi
  const flushNow = useEffectEvent(() => {
    if (!closed.current) void flush();
  });
  useEffect(() => {
    // Sahifaga qaytilganda (Activity) himoya yana ishlaydi
    leaving.current = false;
    waiting.current = false;
    const onVisibility = () => document.visibilityState === "hidden" && flushNow();
    const onPageHide = () => flushNow();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      flushNow();
    };
  }, []);

  // Himoya faqat saqlanmagan (yoki saqlanayotgan) matn bo‘lganda: sahifani yopish/yangilash (beforeunload) va sayt
  // ichidagi havolalar — Next Link sahifani almashtirganda beforeunload ishlamaydi. Havola bosilsa, avval saqlab olinadi
  const unsaved = () => flight.current !== null || latest.current !== savedRef.current;
  const onBeforeUnload = useEffectEvent((e: BeforeUnloadEvent) => {
    if (unsaved() && !leaving.current) e.preventDefault();
  });
  const onLinkClick = useEffectEvent((e: MouseEvent) => {
    const link = e.target instanceof Element ? e.target.closest("a[href]") : null;
    if (!(link instanceof HTMLAnchorElement) || link.target === "_blank" || link.origin !== location.origin) return;
    if (link.pathname === location.pathname && link.search === location.search && link.hash) return; // sahifa ichidagi bo‘lim
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // yangi oynada ochish
    if (leaving.current || !unsaved()) return;
    e.preventDefault();
    e.stopPropagation();
    if (!waiting.current) void leave(link); // saqlash kutilayotganda qayta bosish e’tiborsiz
  });
  const guard = pending || saving;
  useEffect(() => {
    if (!guard) return;
    const warn = (e: BeforeUnloadEvent) => onBeforeUnload(e);
    const click = (e: MouseEvent) => onLinkClick(e);
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", click, true);
    };
  }, [guard]);

  const problems: Problem[] = [
    ...(hasProfile ? [] : [{ field: "profile", message: "Avval profilingizni to‘ldiring" }]),
    ...articleProblems({
      ...body,
      lang: values.lang || null,
      hasPdf: pdfBytes !== null,
      venueType: values.venueType || null,
      pubYear: /^\d{4}$/.test(values.pubYear) ? Number(values.pubYear) : null,
    }),
  ].sort(byStep);
  const hasContent = LANGS.some((l) => values[`title${LANG_SUFFIX[l]}`].trim() || values[`abstract${LANG_SUFFIX[l]}`].trim());

  // PDF kartasidagi AI bosqichi: faqat "PDF asosida to‘ldirish" so‘rovi kuzatiladi (panel tugmasi ham aynan shu matnni
  // yuboradi); PDF almashtirilgan bo‘lsa, undan oldingi so‘rov hisobga olinmaydi. To‘xtatilgan yoki chiqmagan
  // to‘ldirish taklifda qoladi — blok (va undagi fokus) yo‘qolmaydi
  const fillAt = assistant.messages.findLastIndex(
    (m) => m.role === "user" && m.text === ACTIONS.fill.text && m.id > (uploadMark ?? -1),
  );
  const fill = fillAt < 0 ? undefined : assistant.messages[fillAt + 1];
  const proposal = fill?.proposal && fieldsOf(fill.proposal.value).length > 0 ? fill.proposal : undefined;
  const aiStep: AiStep | null =
    !ai || pdfBytes === null || uploading
      ? null
      : fill && assistant.busy && fill === assistant.messages.at(-1)
        ? "working"
        : proposal && !proposal.applied && !proposal.undone
          ? "pending"
          : proposal?.applied
            ? "done"
            : uploadMark !== null || (!proposal && (fill !== undefined || !hasContent))
              ? "offer"
              : null;
  const fillError =
    aiStep === "offer" && fill && !proposal
      ? (fill.error ??
        (fill.state === "stopped" ? "To‘xtatildi." : "AI maydonlarni to‘ldirmadi — sababini AI yordamchi javobida o‘qing."))
      : undefined;

  function touch(keys: string[]) {
    setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !keys.includes(k))));
    setNotice(null);
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

  /** Shu javob qo‘llagan va hali o‘zgarmagan maydonlar AI’dan oldingi holatda (holat o‘rnatilmaydi, faqat hisoblanadi) */
  function withoutAi(messageId: number) {
    const s = aiSnapshots.current.get(messageId);
    const restored: Record<string, unknown> = { ...values };
    for (const [k, v] of Object.entries(s?.before ?? {})) {
      if (values[k as keyof EditorValues] === s!.applied[k as keyof EditorValues]) restored[k] = v;
    }
    return { values: restored as EditorValues, rows: s?.rows && rows === s.rows.applied ? s.rows.before : rows };
  }

  /**
   * AI taklifini formaga qo‘llaydi. Bitta javob ichida taklif to‘ldirib boriladi: avvalgi qo‘llash bekor qilinib,
   * butun taklif qayta qo‘llanadi. Yuborish/o‘chirish paytida va yakuniy ko‘rinish ochiq turganda forma o‘zgarmaydi —
   * taklif keyin "Formaga qo‘llash" tugmasi bilan qo‘llanadi. Avtosaqlash bunga to‘sqinlik qilmaydi
   */
  function applyAi(messageId: number, p: AiProposal): boolean {
    if (blocked || previewOpen || Object.keys(p).length === 0) return false;
    const { authors, ...fields } = p;
    const next: Partial<EditorValues> = Object.fromEntries(
      // Kalit so‘zlar formada vergul bilan
      Object.entries(fields).map(([k, v]) => [k, Array.isArray(v) ? v.join(", ") : v]),
    );
    const base = withoutAi(messageId);
    const nextRows = authors ? authors.map(withUid) : base.rows;
    aiSnapshots.current.set(messageId, {
      before: Object.fromEntries(Object.keys(next).map((k) => [k, base.values[k as keyof EditorValues]])),
      applied: next,
      rows: authors ? { before: base.rows, applied: nextRows } : null,
    });
    setValues({ ...base.values, ...next });
    touch(Object.keys(next));
    // Mualliflar ro‘yxati butunlay almashadi (reorder qatorlarga bog‘langan eski xatolarni ham tozalaydi)
    if (nextRows !== rows) reorder(nextRows);
    // Belgi faqat karta kuzatayotgan to‘ldirish qo‘llanganda tushadi: boshqa javob eski PDF to‘ldirishini qaytarib ko‘rsatmasin
    if (messageId === fill?.id) setUploadMark(null);
    return true;
  }

  function undoAi(messageId: number): boolean {
    const s = aiSnapshots.current.get(messageId);
    if (blocked || !s) return false;
    const base = withoutAi(messageId);
    aiSnapshots.current.delete(messageId);
    setValues(base.values);
    touch(Object.keys(s.before));
    if (base.rows !== rows) reorder(base.rows);
    return true;
  }

  /** Yuborish yoki o‘chirish o‘tmadi: xabar pastki panelda, xato maydon ostida, fokus birinchi xato maydonga */
  function showError(error: ApiError & { problems?: Problem[] }) {
    // Yuborishda server topgan kamchiliklar (klient bilan farq qilsa) xabarning o‘zida ko‘rinadi
    setNotice(error.problems?.length ? error.problems.map((p) => p.message).join(" · ") : error.message);
    const next = fieldErrorsOf(error);
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) focusField(first);
  }

  /** Bitta saqlash so‘rovi. Bir vaqtda faqat bittasi: keyingisi oldingisini quvib o‘tib, eski matnni yozib qo‘ymasin */
  function saveOnce(): Promise<SaveFailure | null> {
    if (flight.current) return flight.current;
    const snapshot = latest.current;
    if (snapshot === savedRef.current) return Promise.resolve(null);
    setSaving(true);
    const request = patchDraft(id, snapshot).then((res): SaveFailure | null => {
      flight.current = null;
      setSaving(false);
      if (res.ok) {
        savedRef.current = snapshot;
        setSaved(snapshot);
        setFailure(null);
        setErrors({});
        return null;
      }
      const fields = fieldErrorsOf(res.error);
      const field = Object.keys(fields)[0];
      const next: SaveFailure = field
        ? { json: snapshot, field, message: fields[field]!, retry: false }
        : { json: snapshot, message: res.error.message, retry: true }; // maydonsiz xato (tarmoq, sessiya…) — qayta urinish mumkin
      setFailure(next);
      // Xato maydon ostida va holat qatorida ko‘rinadi; fokus joyida qoladi — o‘qituvchi yozishda davom etadi
      if (field) setErrors(fields);
      return next;
    });
    flight.current = request;
    return request;
  }

  /** Saqlanmagan o‘zgarishlarni hozir saqlaydi (ko‘rinish, yuborish, chiqish oldidan). null — hammasi saqlandi */
  async function flush(): Promise<SaveFailure | null> {
    for (;;) {
      if (flight.current) {
        const result = await flight.current;
        if (result && result.json === latest.current) return result; // aynan shu matn hozirgina saqlanmadi
        continue;
      }
      if (latest.current === savedRef.current) return null;
      const result = await saveOnce();
      if (result) return result;
    }
  }

  /** Holat qatoridagi «qayta urinish»: tugma yo‘qoladi — fokus holat qatorida qoladi */
  function retrySave() {
    statusRef.current?.focus();
    void flush();
  }

  /** Saqlanmagan matn bilan havola bosildi: avval saqlanadi; o‘tmasa yoki osilib qolsa — o‘qituvchidan so‘raladi */
  async function leave(link: HTMLAnchorElement) {
    waiting.current = true;
    const stalled = new Promise<"stalled">((resolve) => setTimeout(() => resolve("stalled"), LEAVE_WAIT_MS));
    let result: Awaited<ReturnType<typeof flush>> | "stalled";
    try {
      result = await Promise.race([flush(), stalled]);
    } finally {
      // Kutilmagan xatoda ham bayroq tushadi: aks holda keyingi har bir havola bosilishi bloklanib qoladi
      waiting.current = false;
    }
    if (result !== null && !window.confirm("Saqlanmagan o‘zgarishlar yo‘qoladi. Sahifadan chiqasizmi?")) return;
    // Himoya shu bosishni o‘tkazib yuboradi, Link o‘zi o‘tadi (click sinxron — bayroq darhol tushiriladi)
    leaving.current = true;
    if (link.isConnected) {
      link.click();
      leaving.current = false;
    } else location.assign(link.href);
  }

  /** PDF darhol serverda saqlanadi: eskirgan PDF kamchiliklari tozalanadi */
  function onUploaded(bytes: number) {
    setPdfBytes(bytes);
    setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => k !== "pdf")));
    setUploadMark(lastMessageId.current);
  }

  /** AI oynasidagi "PDF faylni yuklash" (telefon): fokus PDF tugmasida, fayl tanlash oynasi shu bosishning o‘zida ochiladi */
  function pickPdf() {
    aiDialog.current?.close(); // yopilish fokusni ochgan tugmaga qaytaradi — undan keyin PDF tugmasiga o‘tkazamiz
    const button = document.querySelector<HTMLButtonElement>('button[name="pdf"]');
    document.getElementById("step-1")?.scrollIntoView({ block: "nearest" });
    button?.focus({ preventScroll: true });
    button?.click();
  }

  /** PDF kartasidagi asosiy AI tugmasi. Pulli so‘rov faqat shu bosishda ketadi — yuklashdan keyin o‘zi boshlanmaydi */
  function onAiStep() {
    if (aiStep === "done") return startReview();
    if (aiStep === "pending") return assistant.toggle(fill!.id); // bepul: tayyor javob formaga qo‘llanadi
    void assistant.send(ACTIONS.fill.text);
    // Telefonda jarayon AI oynasida ko‘rinadi; fokus yopish tugmasida — ekran klaviaturasi oqimni yopmasin
    if (!matchMedia("(min-width: 64rem)").matches) openAi("close");
  }

  /** "Tekshirishni boshlash": 2-bosqich ekran tepasiga chiqadi, fokus o‘sha bo‘limga o‘tadi */
  function startReview() {
    const s = document.getElementById("step-2");
    s?.scrollIntoView({ block: "start" });
    s?.focus({ preventScroll: true });
  }

  /** Yuborishdan oldin o‘qituvchi sahifaning yakuniy ko‘rinishini ko‘radi va tasdiqlaydi. Shu payt qoralama ham saqlanadi */
  function openPreview() {
    if (blocked) return;
    setNotice(null);
    setAiOpen(false);
    setPreviewOpen(true);
    void flush();
  }

  async function submit() {
    if (blocked) return;
    setNotice(null);
    if (problems.length) {
      setNotice("Yuborishdan oldin kamchiliklarni tuzating.");
      focusField(problems[0].field);
      return;
    }
    setBusy("submit");
    // Server bazadagi nusxani tekshiradi: avval oxirgi o‘zgarishlar saqlanadi
    const failure = await flush();
    if (failure) {
      setPreviewOpen(false);
      setBusy(null);
      if (failure.field) focusField(failure.field);
      return;
    }
    const res = await sendJson("POST", `/api/articles/${id}/submit`);
    if (res.ok) {
      closed.current = true;
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
    publication:
      values.venue.trim() || values.doi.trim()
        ? {
            type: values.venueType || null,
            venue: values.venue.trim() || null,
            volume: values.volume.trim() || null,
            issue: values.issue.trim() || null,
            pages: values.pages.trim() || null,
            year: /^\d{4}$/.test(values.pubYear) ? Number(values.pubYear) : null,
            doi: normalizeDoi(values.doi) ?? (values.doi.trim() || null),
          }
        : null,
    issueNo: Number(values.issueNo) || 1,
    issueSeq: Number(values.issueSeq) || null,
    submittedAt: null,
    publishedAt: null,
    updatedAt: new Date(preview.updatedAt),
    reviewNote: null,
    authors: kept.map((r) => ({
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
    await flight.current; // yo‘ldagi saqlash o‘chirishdan keyin yetib kelmasin
    const res = await sendJson("DELETE", `/api/articles/${id}`);
    if (res.ok) {
      closed.current = true;
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

  // Har bosqichda nechta narsa qolgani (yuborish tekshiruvi bilan bir xil qoidalar). Hozirgi qadam — birinchi chala bosqich
  const left = (n: number) => problems.filter((p) => stepOf(p.field) === n).length;
  const current = [1, 2, 3, 4].find((n) => left(n) > 0);
  const step = (n: number, title: string) => {
    const l = left(n);
    // Rad etilgan maqolada «Tayyor» belgilari universitet izohiga zid chiqmasin — faqat qolgan ishlar ko‘rinadi
    const state: StepState = l > 0 ? (n === current ? "current" : "todo") : reviewNote ? "todo" : "done";
    return { n, title, left: l, state };
  };

  return (
    // Chapda AI yordamchi (40%), o‘ngda maqola formasi (60%); kichik ekranda AI alohida oynada
    <div className={ai ? "lg:grid lg:grid-cols-[minmax(22rem,2fr)_minmax(0,3fr)] lg:items-start lg:gap-8" : "max-w-4xl"}>
      {ai && (
        <aside
          aria-label="AI yordamchi"
          className="hidden overflow-hidden rounded-xl border border-line bg-paper lg:sticky lg:top-4 lg:flex lg:h-[calc(100svh-7.5rem)] lg:flex-col"
        >
          {/* PDF almashtirilayotganda server hali eski faylni o‘qiydi — "PDF asosida to‘ldirish" taklif qilinmaydi.
              PDF kartasida to‘ldirish taklifi turganda panel uni takrorlamaydi */}
          <AiPanel
            assistant={assistant}
            hasPdf={pdfBytes !== null && !uploading}
            hasContent={hasContent}
            fillOffered={aiStep !== null}
            onFocusField={focusField}
          />
        </aside>
      )}

      <div className="min-w-0 space-y-6">
        <div>{header}</div>

        {reviewNote && (
          <div className="rounded-xl border border-danger/40 bg-danger-soft p-5">
            <p className="font-medium text-danger">Universitet izohi — tuzatib, qayta yuboring</p>
            <p className="mt-1 whitespace-pre-line">{reviewNote}</p>
          </div>
        )}

        {/* Bitta forma yuzasi: bosqichlar chiziq bilan ajraladi (ichma-ich kartalar yo‘q) */}
        <div className="rounded-xl border border-line bg-paper px-5 sm:px-8">
          {/* Yuborish/o‘chirish paytida forma qulflanadi. PDF ham: admin eski faylni ko‘rmasin */}
          <fieldset disabled={busy !== null} className="min-w-0 divide-y divide-line">
            <Step {...step(1, "Maqola matni (PDF)")} description="Maqolaning to‘liq matni, 10 MB gacha.">
              <PdfField
                id={id}
                bytes={pdfBytes}
                error={errors.pdf}
                uploading={uploading}
                locked={assistant.busy && pdfBytes !== null}
                onUploading={setUploading}
                onUploaded={onUploaded}
              />
              {aiStep && (
                <AiFill
                  state={aiStep}
                  primary={problems.length > 0 && (aiStep !== "offer" || !hasContent)}
                  disabled={aiStep === "working" || (aiStep === "offer" && (assistant.busy || assistant.remaining === 0))}
                  replaces={hasContent}
                  fields={proposal ? fieldsOf(proposal.value).length : 0}
                  error={fillError}
                  noneLeft={assistant.remaining === 0}
                  onMain={onAiStep}
                  onStop={assistant.stop}
                />
              )}
            </Step>

            <Step {...step(2, "Sarlavha")} count focusable>
              <fieldset>
                <legend className="text-sm font-medium">Maqola (PDF) qaysi tilda yozilgan? *</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {LANGS.map((l) => (
                    <label key={l} className={CHOICE}>
                      <input
                        type="radio"
                        name="lang"
                        value={l}
                        checked={values.lang === l}
                        onChange={() => update("lang", l)}
                        aria-describedby="lang-message"
                        className="size-4 accent-[var(--lapis)]"
                      />
                      <span lang={l}>{LANG_LABELS[l]}</span>
                    </label>
                  ))}
                </div>
                <p id="lang-message" className={`mt-1.5 text-sm ${errors.lang ? "text-danger" : "text-muted"}`}>
                  {errors.lang ?? "Asosiy tildagi sarlavha PDF’dagi bilan bir xil bo‘lsin."}
                </p>
              </fieldset>

              {LANGS.map((l) => (
                <TextAreaField
                  key={l}
                  label={`Sarlavha (${LANG_LABELS[l]})${values.lang === l ? " · asosiy" : ""} *`}
                  lang={l}
                  rows={2}
                  maxLength={L.titleMax}
                  className="input mt-1.5 min-h-0"
                  {...text(`title${LANG_SUFFIX[l]}`)}
                />
              ))}
            </Step>

            <Step {...step(3, "Mualliflar va tashkilotlar")} count description="Maqoladagi tartibda.">
              <div className="divide-y divide-line">
                {rows.map((a, i) => (
                  <div key={a.uid} className="py-5 first:pt-0 last:pb-0">
                    <fieldset data-row={a.uid} className="min-w-0">
                      <legend className="text-sm font-medium">
                        {i + 1}-muallif{a.isMe ? " (siz)" : ""}
                      </legend>
                      <div className="mt-3 grid gap-4 sm:grid-cols-2">
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
                      {/* Yagona muallifda tartib tugmalari kerak emas (ikkalasi ham o‘chiq turardi) */}
                      {rows.length > 1 && (
                        <div className="mt-3 flex flex-wrap gap-1 text-sm">
                          <button type="button" data-action="up" className="btn btn-ghost" disabled={i === 0} onClick={() => move(i, -1)}>
                            Yuqoriga
                          </button>
                          <button
                            type="button"
                            data-action="down"
                            className="btn btn-ghost"
                            disabled={i === rows.length - 1}
                            onClick={() => move(i, 1)}
                          >
                            Pastga
                          </button>
                          {!a.isMe && (
                            <button type="button" className="btn btn-ghost text-danger" onClick={() => removeRow(i)}>
                              Olib tashlash
                            </button>
                          )}
                        </div>
                      )}
                    </fieldset>
                  </div>
                ))}
              </div>
              {errors.authors && <p className="text-sm text-danger">{errors.authors}</p>}
              {rows.length < L.authorsMax && (
                <button type="button" className="btn btn-secondary" onClick={addRow}>
                  Hammuallif qo‘shish
                </button>
              )}
            </Step>

            <Step {...step(4, "Annotatsiya va kalit so‘zlar")} count description="Maqolaning o‘zini tarjima qilish shart emas.">
              <LangTabs tab={tab} onChange={setTab} main={values.lang} problems={problems.filter((p) => /^(abstract|keywords)/.test(p.field))} />
              {LANGS.map((l) => {
                const s = LANG_SUFFIX[l];
                const main = values.lang && values.lang !== l ? values.lang : null;
                return (
                  <div key={l} role="tabpanel" id={`panel-${l}`} aria-labelledby={`tab-${l}`} hidden={tab !== l} className="space-y-5">
                    {main && (
                      <details open className="rounded-lg bg-mist px-4 py-3 text-sm">
                        <summary className="cursor-pointer font-medium">Asosiy tildagi annotatsiya ({LANG_LABELS[main]})</summary>
                        <p lang={main} className="mt-2 whitespace-pre-line text-muted">
                          {values[`abstract${LANG_SUFFIX[main]}`] || "—"}
                        </p>
                      </details>
                    )}
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
            </Step>
          </fieldset>

          {/* Qaytarib bo‘lmaydigan amal formaning oxirida, tasdiqlash bilan */}
          {canDelete && (
            <div className="border-t border-line py-4">
              <button type="button" className="btn btn-ghost -ml-4 text-danger" aria-disabled={blocked} onClick={remove}>
                Maqolani o‘chirish
              </button>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line bg-mist/95 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:bg-paper/95">
          {/* disabled emas, aria-disabled: bosilgan tugma o‘chib qolsa klaviatura fokusi yo‘qoladi.
              Ko‘k (asosiy) rang — maqola yuborishga tayyor bo‘lganda; ungacha 1-bosqichdagi yuklash asosiy harakat */}
          <button
            type="button"
            className={`btn ${problems.length ? "btn-secondary" : "btn-primary"}`}
            aria-disabled={blocked}
            aria-haspopup="dialog"
            onClick={openPreview}
          >
            {busy === "submit" ? "Yuborilmoqda…" : uploading ? "PDF yuklanmoqda…" : "Ko‘rish va yuborish"}
          </button>
          {ai && (
            <button
              ref={aiButton}
              type="button"
              className="btn btn-ghost lg:hidden"
              aria-haspopup="dialog"
              aria-label={assistant.busy ? "AI yordamchini ochish — yozmoqda" : "AI yordamchini ochish"}
              onClick={() => openAi()}
            >
              <SparkIcon />
              <span className="max-sm:hidden">AI yordamchi</span>
              <span className="sm:hidden">AI</span>
              {assistant.busy && <span className="text-xs text-muted">yozmoqda…</span>}
            </button>
          )}
          {/* Avtosaqlash holati (yoki yuborish/o‘chirish xatosi). tabIndex: «qayta urinish» yo‘qolganda fokus shu yerda qoladi */}
          <p ref={statusRef} tabIndex={-1} role="status" className="text-sm text-muted outline-none">
            {notice ? (
              <span className="text-danger">{notice}</span>
            ) : (
              <SaveState saving={saving} pending={pending} failed={failed} onRetry={retrySave} onFix={focusField} />
            )}
          </p>
        </div>
      </div>

      {ai && (
        <dialog
          ref={aiDialog}
          onClose={() => {
            setAiOpen(false);
            // Ochgan tugma yo‘qolgan bo‘lsa, fokus sahifa boshiga tushib qolmasin
            requestAnimationFrame(() => {
              if (!document.activeElement || document.activeElement === document.body) aiButton.current?.focus();
            });
          }}
          aria-label="AI yordamchi"
          className="m-0 ml-auto h-dvh max-h-none w-full max-w-md bg-paper p-0 text-ink backdrop:bg-ink/50 sm:border-l sm:border-line"
        >
          {aiOpen && (
            <AiPanel
              assistant={assistant}
              hasPdf={pdfBytes !== null && !uploading}
              hasContent={hasContent}
              onFocusField={focusField}
              onPickPdf={pickPdf}
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
        issue={{ issueNo: values.issueNo, issueSeq: values.issueSeq }}
        submitting={busy === "submit"}
        aiBusy={assistant.busy}
        onClose={() => setPreviewOpen(false)}
        onSubmit={submit}
        onFix={focusField}
        onIssueChange={(next) => {
          setValues((v) => ({ ...v, ...next }));
          touch(["issueNo", "issueSeq"]);
        }}
      />
    </div>
  );
}

/** Avtosaqlash holati: bir so‘z; o‘tmasa — sababi va bitta amal (qayta urinish yoki xato maydonga o‘tish) */
function SaveState({
  saving,
  pending,
  failed,
  onRetry,
  onFix,
}: {
  saving: boolean;
  pending: boolean;
  failed: SaveFailure | null;
  onRetry: () => void;
  onFix: (field: string) => void;
}) {
  if (saving || (pending && !failed)) return "Saqlanmoqda…";
  if (!failed) return "Saqlandi";
  const field = failed.field;
  const action = "py-1 font-medium underline underline-offset-2";
  return (
    <span className="text-danger">
      Saqlanmadi —{" "}
      {failed.retry ? (
        <button type="button" className={action} onClick={onRetry}>
          qayta urinish
        </button>
      ) : field ? (
        <button type="button" className={action} onClick={() => onFix(field)}>
          {failed.message}
        </button>
      ) : (
        failed.message
      )}
    </span>
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
    <div role="tablist" aria-label="Til" className="flex gap-1 overflow-x-auto border-b border-line">
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
            className={`-mb-px shrink-0 border-b-2 px-3 py-2.5 text-left sm:px-4 ${tab === l ? "border-lapis" : "border-transparent hover:border-line"}`}
          >
            <span className="block font-medium">
              {LANG_LABELS[l]}
              {main === l && <span className="ml-1.5 text-xs font-normal text-muted">asosiy</span>}
            </span>
            <span className={`block text-xs ${left ? "text-muted" : "text-tile"}`}>{left ? `${left} ta qoldi` : "tayyor"}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Yuklash holati muharrirda saqlanadi: yuklash tugamaguncha yuborish/o‘chirish va avtosaqlash kutadi */
function PdfField({
  id,
  bytes,
  error,
  uploading,
  locked,
  onUploading,
  onUploaded,
}: {
  id: number;
  bytes: number | null;
  error?: string;
  uploading: boolean;
  /** AI javob yozmoqda: server har so‘rovga saqlangan PDF’ni qo‘shadi — shu payt almashtirib bo‘lmaydi */
  locked: boolean;
  onUploading: (value: boolean) => void;
  onUploaded: (bytes: number) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const message = uploadError ?? error;
  const describedBy = [bytes === null && "pdf-hint", message && "pdf-error"].filter(Boolean).join(" ") || undefined;

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

  // Barcha holatda bitta tuzilma: o‘sha tugma (va klaviatura fokusi) yuklash davomida ham o‘z joyida qoladi
  return (
    <>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <span
          aria-hidden="true"
          className={`grid size-12 shrink-0 place-items-center rounded-lg text-xs font-bold ${bytes ? "bg-tile-soft text-tile" : "bg-mist text-muted"} ${uploading ? "animate-pulse motion-reduce:animate-none" : ""}`}
        >
          PDF
        </span>
        <div className="min-w-[10rem] flex-1">
          <p role="status" className="font-medium">
            {uploading ? "PDF yuklanmoqda…" : bytes ? "PDF yuklandi" : ""}
          </p>
          {uploading ? (
            <p className="text-sm text-muted">Sahifani yopmang.</p>
          ) : bytes ? (
            <p className="text-sm text-muted">
              {formatBytes(bytes)} ·{" "}
              <a href={`/maqola/${id}/pdf`} className="link" target="_blank" rel="noopener">
                Ko‘rish<span className="sr-only"> (yangi oynada)</span>
              </a>
            </p>
          ) : (
            <p id="pdf-hint" className="text-sm text-muted">
              Maqola Word’da bo‘lsa, avval uni PDF qilib saqlang.
            </p>
          )}
        </div>
        {/* disabled emas, aria-disabled: yuklash paytida fokus tushib qolmasin; pickPdf’ning .click()i ham shu shartdan o‘tadi */}
        <button
          type="button"
          name="pdf"
          aria-disabled={uploading || locked || undefined}
          aria-describedby={describedBy}
          className={`btn ${bytes ? "btn-secondary" : "btn-primary btn-lg w-full sm:w-auto"}`}
          onClick={() => {
            if (!uploading && !locked) input.current?.click();
          }}
        >
          {uploading ? "Yuklanmoqda…" : bytes ? "Almashtirish" : "PDF faylni yuklash"}
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
      </div>
      {bytes !== null && bytes > L.pdfScholarBytes && (
        <p className="text-sm text-muted">
          Fayl 5 MB dan katta: Google Scholar katta PDF’larni o‘qimasligi mumkin. Imkon bo‘lsa, siqilgan nusxasini yuklang.
        </p>
      )}
      {message && (
        <p id="pdf-error" role="alert" className="text-sm text-danger">
          {message}
        </p>
      )}
    </>
  );
}

/** PDF kartasidagi AI bloki: taklif → yozmoqda → (qo‘llanmagan) → tayyor. Asosiy tugma doim bitta element — fokus saqlanadi */
function AiFill({
  state,
  primary,
  disabled,
  replaces,
  fields,
  error,
  noneLeft,
  onMain,
  onStop,
}: {
  state: AiStep;
  /** Ko‘k faqat asosiy qadam bo‘lsa: pulli taklif — bo‘sh formada, «Tekshirishni boshlash» — kamchilik qolganda */
  primary: boolean;
  disabled: boolean;
  /** Formada matn bor: to‘ldirish uni almashtirishi mumkin */
  replaces: boolean;
  fields: number;
  error?: string;
  noneLeft: boolean;
  onMain: () => void;
  onStop: () => void;
}) {
  const main = useRef<HTMLButtonElement>(null);
  const title = {
    offer: "AI maydonlarni to‘ldirib bersinmi?",
    working: "AI maqolani o‘qib, maydonlarni to‘ldirmoqda…",
    pending: "AI javobi tayyor, lekin formaga hali qo‘llanmagan",
    done: `AI ${fields} ta maydonni to‘ldirdi`,
  }[state];
  const label = {
    offer: error ? "Qayta urinish" : ACTIONS.fill.label,
    working: "To‘ldirilmoqda…",
    pending: "Formaga qo‘llash",
    done: "Tekshirishni boshlash",
  }[state];
  const copy = {
    offer: `PDF’dan sarlavha, mualliflar, annotatsiya va kalit so‘zlar uch tilda yoziladi.${replaces ? " Formadagi hozirgi matnlar almashtirilishi mumkin." : ""}`,
    working: "Bir necha daqiqa olishi mumkin. Sahifadan chiqmang.",
    pending: null,
    done: "Endi har bir bo‘limni tekshirib chiqing — AI ham xato qilishi mumkin.",
  }[state];

  return (
    <div className="border-t border-line pt-5">
      <p className="font-medium">{title}</p>
      {copy && <p className="mt-1 text-sm text-muted">{copy}</p>}
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          ref={main}
          type="button"
          aria-disabled={disabled || undefined}
          aria-describedby={state === "offer" ? "ai-fill-note" : undefined}
          className={`btn btn-lg w-full sm:w-auto ${primary ? "btn-primary" : "btn-secondary"}`}
          onClick={() => !disabled && onMain()}
        >
          {(state === "offer" || state === "working") && (
            <SparkIcon className={`size-5 ${state === "working" ? "animate-pulse motion-reduce:animate-none" : ""}`} />
          )}
          {label}
        </button>
        {state === "working" && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              onStop();
              main.current?.focus();
            }}
          >
            To‘xtatish
          </button>
        )}
        {state === "offer" && (
          <a href="#step-2" className="link text-sm">
            yoki maydonlarni o‘zingiz to‘ldiring
          </a>
        )}
      </div>
      {/* Kompyuterda «Claude» eslatmasi yonidagi AI panelida doim ko‘rinadi — bu yerda faqat telefonda (ekran o‘quvchiga
          tugma tavsifi sifatida baribir o‘qiladi). Limit tugagani esa hamma ekranda */}
      {state === "offer" && (
        <p id="ai-fill-note" className={`mt-3 text-xs text-muted ${noneLeft ? "" : "lg:hidden"}`}>
          {noneLeft
            ? "Bugungi AI so‘rovlari tugadi — maydonlarni o‘zingiz to‘ldiring yoki ertaga urinib ko‘ring."
            : "PDF tahlil uchun Claude (Anthropic) xizmatiga yuboriladi."}
        </p>
      )}
      {/* Telefonda (AI oynasi yopiq bo‘lsa) holat e’lon qilinadi; kompyuterda yon tomondagi panel e’lon qiladi */}
      <p role="status" className="sr-only lg:hidden">
        {title}
      </p>
    </div>
  );
}

/** Bosqich belgisi: raqam; tayyor bo‘lsa — belgi (✓ shrift belgisi emas, chizilgan). Hozirgi qadam — ko‘k */
function StepBadge({ n, state }: { n: number; state: StepState }) {
  return (
    <span
      aria-hidden="true"
      className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold ${
        state === "done" ? "bg-tile text-paper" : state === "current" ? "bg-lapis text-on-lapis" : "border border-line text-muted"
      }`}
    >
      {state === "done" ? (
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        </svg>
      ) : (
        n
      )}
    </span>
  );
}

/** To‘ldirish bosqichi: belgi, sarlavha, (kerak bo‘lsa) nechta narsa qolgani va bitta qisqa izoh */
function Step({
  n,
  title,
  description,
  state,
  left = 0,
  count = false,
  focusable = false,
  children,
}: {
  n: number;
  title: string;
  description?: string;
  state: StepState;
  left?: number;
  /** Sarlavha yonida "N ta qoldi" (PDF bosqichida holatni o‘zi aytadi) */
  count?: boolean;
  /** Xato bo‘lganda fokus shu bo‘limga ko‘chadi */
  focusable?: boolean;
  children: ReactNode;
}) {
  const id = `step-${n}`;
  const status = count && left ? `${left} ta qoldi` : state === "done" ? "Tayyor" : null;
  return (
    <section id={id} tabIndex={focusable ? -1 : undefined} aria-labelledby={`${id}-title`} className="scroll-mt-4 py-6 outline-none sm:py-8">
      <div className="flex items-start gap-3 sm:gap-4">
        <StepBadge n={n} state={state} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 id={`${id}-title`} className="font-serif text-lg font-semibold leading-snug sm:text-xl">
              {title}
              {status && <span className="sr-only"> — {status}</span>}
            </h2>
            {count && left > 0 && (
              <span aria-hidden="true" className="text-sm text-muted">
                {left} ta qoldi
              </span>
            )}
          </div>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
      </div>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}
