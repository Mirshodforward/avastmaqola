"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { AI_FIELD_LABELS, type AiField } from "@/lib/ai";
import { fieldsOf, type ChatMessage, type useAssistant } from "./use-assistant";

const MESSAGE_MAX = 100_000;
const NUMBER = new Intl.NumberFormat("uz-UZ");

export const ACTIONS = {
  fill: { label: "PDF asosida hammasini to‘ldirish", text: "Yuklangan PDF asosida barcha maydonlarni uch tilda to‘ldiring." },
  check: {
    label: "Tarjimalarni tekshirish",
    text: "Uch tildagi sarlavha, annotatsiya va kalit so‘zlarni solishtirib tekshiring, tarjimadagi xatolarni tuzating.",
  },
  keywords: { label: "Kalit so‘zlarni tanlash", text: "Maqola mazmuniga mos aniq kalit so‘zlarni uch tilda tanlang." },
};

const STATUS: Record<string, string> = {
  waiting: "So‘rov yuborildi…",
  thinking: "Maqola tahlil qilinmoqda…",
  writing: "Javob yozilmoqda…",
  filling: "Forma to‘ldirilmoqda…",
};

export function SparkIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M12 2.5c.4 4.6 2.9 7.1 7.5 7.5-4.6.4-7.1 2.9-7.5 7.5-.4-4.6-2.9-7.1-7.5-7.5 4.6-.4 7.1-2.9 7.5-7.5Z" />
      <path d="M19 15.5c.2 1.9 1.1 2.8 3 3-1.9.2-2.8 1.1-3 3-.2-1.9-1.1-2.8-3-3 1.9-.2 2.8-1.1 3-3Z" opacity=".6" />
    </svg>
  );
}

export function AiPanel({
  assistant,
  hasPdf,
  hasContent,
  onPreview,
  onFocusField,
  onPickPdf,
  onClose,
}: {
  assistant: ReturnType<typeof useAssistant>;
  hasPdf: boolean;
  /** Formada sarlavha yoki annotatsiya bor: tarjima va kalit so‘zlar uchun yetarli */
  hasContent: boolean;
  onPreview: () => void;
  onFocusField: (field: string) => void;
  onPickPdf: () => void;
  /** Mobil oynada: panelni yopish */
  onClose?: () => void;
}) {
  const { messages, busy, remaining, text, setText, send, stop, toggle, reset } = assistant;
  const inputId = useId();
  const input = useRef<HTMLTextAreaElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  // Foydalanuvchi yuqoriga o‘qish uchun aylantirgan bo‘lsa, yangi matn uni pastga sudrab ketmasin
  const stick = useRef(true);
  const tooLong = text.length > MESSAGE_MAX;
  const noneLeft = remaining === 0;

  useEffect(() => {
    const el = scroller.current;
    if (messages.at(-1)?.state === "waiting") stick.current = true; // yangi so‘rov (PDF kartasidan ham) — chat oxirgi javobga tushsin
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function submit(value = text) {
    if (busy || noneLeft || !value.trim() || value.length > MESSAGE_MAX) return;
    stick.current = true;
    void send(value);
    if (value === text) setText("");
    // Tezkor tugma bosilgach u yo‘qoladi — fokus sahifa boshiga tushib qolmasin
    input.current?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Telefonda Enter yangi qator (yuborish — tugma bilan), kompyuterda Enter yuboradi
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && matchMedia("(pointer: fine)").matches) {
      e.preventDefault();
      submit();
    }
  }

  function clear() {
    if (messages.length && !window.confirm("Suhbat tozalansinmi? Formadagi o‘zgarishlar o‘z joyida qoladi.")) return;
    reset();
    input.current?.focus();
  }

  const last = messages.at(-1);
  const fields = last?.proposal ? fieldsOf(last.proposal.value).length : 0;
  // Holat o‘zgarishlari e’lon qilinadi, oqib kelayotgan matn emas (ekran o‘quvchi har bo‘lakni o‘qimasin).
  // Qo‘llash va qaytarish ham — kompyuterda PDF kartasidagi «Formaga qo‘llash»ni shu yer e’lon qiladi
  const announcement =
    last?.role !== "assistant"
      ? ""
      : last.state === "done"
        ? last.proposal?.applied
          ? `${fields} ta maydon formaga qo‘llandi.`
          : last.proposal?.undone
            ? "AI o‘zgarishlari qaytarildi."
            : last.proposal
              ? `Javob tayyor: ${fields} ta maydon taklif qilindi.`
              : "Javob tayyor."
        : last.state === "stopped"
          ? "To‘xtatildi."
          : last.state === "error"
            ? (last.error ?? "Xatolik")
            : busy
              ? "AI javob tayyorlamoqda."
              : "";

  const hint = tooLong
    ? `Matn juda uzun: ${NUMBER.format(text.length)} belgi (ko‘pi bilan ${NUMBER.format(MESSAGE_MAX)}).`
    : text.length > 2000
      ? `${NUMBER.format(text.length)} belgi`
      : noneLeft
        ? "Bugungi so‘rovlar tugadi — ertaga davom eting."
        : remaining !== null
          ? `Bugun yana ${remaining} ta so‘rov yuborishingiz mumkin.`
          : null;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-lapis text-on-lapis">
          <SparkIcon className="size-5" />
        </span>
        <h2 className="min-w-0 flex-1 font-serif text-base font-semibold leading-tight">AI yordamchi</h2>
        {messages.length > 0 && (
          <button type="button" className="btn btn-ghost px-2.5 py-1.5 text-sm" onClick={clear}>
            Yangi suhbat
          </button>
        )}
        {onClose && (
          <button type="button" className="btn btn-ghost px-2.5 py-1.5" onClick={onClose} aria-label="AI yordamchini yopish">
            <span aria-hidden="true">✕</span>
          </button>
        )}
      </div>

      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-5"
      >
        {messages.length === 0 ? (
          <div className="text-sm leading-relaxed">
            <p>
              Sarlavha, annotatsiya va kalit so‘zlarni o‘zbek, rus va ingliz tillarida yozib, mualliflar ro‘yxatini
              tuzib beraman.
            </p>
            {/* Kompyuterda asosiy (ko‘k) tugma o‘ngdagi PDF kartasida; bu yerda — ikkinchi darajali */}
            {hasPdf || hasContent ? (
              <>
                <p className="mt-2 text-muted">
                  {hasPdf
                    ? "PDF yuklangan — tugmani bosing yoki savolingizni yozing."
                    : "Formadagi matn bilan ishlay olaman. Butun maqolani to‘ldirish uchun PDF yuklang yoki matnini pastga joylashtiring."}
                </p>
                <ul className="mt-4 space-y-2">
                  {[hasPdf && ACTIONS.fill, hasContent && ACTIONS.check, ACTIONS.keywords]
                    .filter((a) => a !== false)
                    .map((a) => (
                      <li key={a.label}>
                        <QuickButton
                          primary={a === ACTIONS.fill && Boolean(onClose)}
                          disabled={noneLeft}
                          onClick={() => submit(a.text)}
                        >
                          {a.label}
                        </QuickButton>
                      </li>
                    ))}
                </ul>
              </>
            ) : (
              <>
                <p className="mt-2 text-muted">Boshlash uchun maqolani bering:</p>
                <ul className="mt-4 space-y-2">
                  <li>
                    <QuickButton primary={Boolean(onClose)} onClick={onPickPdf}>
                      PDF faylni yuklash
                    </QuickButton>
                  </li>
                  <li>
                    <QuickButton onClick={() => input.current?.focus()}>Maqola matnini chatga joylashtirish</QuickButton>
                  </li>
                </ul>
              </>
            )}
          </div>
        ) : (
          messages.map((m) =>
            m.role === "user" ? (
              <UserMessage key={m.id} text={m.text} />
            ) : (
              <AssistantMessage
                key={m.id}
                m={m}
                last={m === last}
                onStop={stop}
                retry={() => {
                  const prompt = messages[messages.findIndex((x) => x.id === m.id) - 1];
                  if (prompt) submit(prompt.text);
                }}
                onToggle={() => toggle(m.id)}
                onPreview={onPreview}
                onFocusField={onFocusField}
              />
            ),
          )
        )}
      </div>

      <form
        className="border-t border-line p-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label htmlFor={inputId} className="sr-only">
          AI yordamchiga xabar
        </label>
        {/* 16px shrift: kichikroq bo‘lsa, iPhone maydon bosilganda sahifani kattalashtiradi */}
        <textarea
          ref={input}
          id={inputId}
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Savol yoki maqola matni…"
          aria-invalid={tooLong || undefined}
          aria-describedby={`${inputId}-hint`}
          className="input max-h-48 min-h-0 resize-y leading-relaxed"
        />
        <div className="mt-2 flex items-center gap-3">
          <p id={`${inputId}-hint`} className={`min-w-0 flex-1 text-xs ${tooLong ? "text-danger" : "text-muted"}`}>
            {hint ?? <span className="hidden pointer-fine:inline">Enter — yuborish, Shift+Enter — yangi qator</span>}
          </p>
          {/* Javob kutilayotganda ham tugma o‘z joyida: ikki marta bosish «To‘xtatish»ga tushib qolmasin */}
          <button type="submit" className="btn btn-primary" aria-disabled={busy || noneLeft || !text.trim() || tooLong}>
            Yuborish
          </button>
        </div>
        <p className="mt-2 text-xs text-muted">Matn va PDF tahlil uchun Claude (Anthropic) xizmatiga yuboriladi.</p>
      </form>
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}

function QuickButton({
  children,
  primary = false,
  disabled = false,
  onClick,
}: {
  children: string;
  /** Birinchi qilinadigan ish — ajralib tursin */
  primary?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-disabled={disabled || undefined}
      onClick={() => !disabled && onClick()}
      className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left aria-disabled:cursor-not-allowed aria-disabled:opacity-55 ${
        primary ? "border-lapis bg-lapis font-medium text-on-lapis hover:bg-lapis-deep" : "border-line hover:border-lapis"
      }`}
    >
      <SparkIcon className={`size-4 shrink-0 ${primary ? "" : "text-lapis"}`} />
      {children}
    </button>
  );
}

/** Joylashtirilgan maqola matni chatni to‘ldirib yubormasin: uzun xabar yig‘ilgan holda */
function UserMessage({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 600;
  return (
    <div className="ml-8 rounded-2xl rounded-br-md bg-lapis px-3.5 py-2.5 text-sm leading-relaxed text-on-lapis">
      <p className="whitespace-pre-wrap break-words">{long && !open ? `${text.slice(0, 400).trimEnd()}…` : text}</p>
      {long && (
        <button type="button" className="mt-1.5 text-xs underline underline-offset-2" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? "Yig‘ish" : `To‘liq matn (${NUMBER.format(text.length)} belgi)`}
        </button>
      )}
    </div>
  );
}

function AssistantMessage({
  m,
  last,
  onStop,
  retry,
  onToggle,
  onPreview,
  onFocusField,
}: {
  m: ChatMessage;
  last: boolean;
  onStop: () => void;
  retry: () => void;
  onToggle: () => void;
  onPreview: () => void;
  onFocusField: (field: string) => void;
}) {
  const working = m.state && m.state in STATUS;
  const fields = m.proposal ? fieldsOf(m.proposal.value) : [];
  const fieldLabel = m.field && m.field in AI_FIELD_LABELS ? AI_FIELD_LABELS[m.field as AiField] : null;
  return (
    <div className="flex gap-2.5">
      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-tile-soft text-tile">
        <SparkIcon className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1 text-sm leading-relaxed">
        {m.text && <p className="whitespace-pre-wrap break-words">{m.text}</p>}
        {working && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted">
            <span className="flex items-center gap-2">
              <span className="flex gap-1" aria-hidden="true">
                {[0, 150, 300].map((d) => (
                  <span
                    key={d}
                    className="size-1.5 animate-bounce rounded-full bg-tile motion-reduce:animate-none"
                    style={{ animationDelay: `${d}ms` }}
                  />
                ))}
              </span>
              {m.state === "filling" && fieldLabel ? `Yozilmoqda: ${fieldLabel}` : STATUS[m.state!]}
            </span>
            <button type="button" className="text-xs underline underline-offset-2 hover:text-ink" onClick={onStop}>
              To‘xtatish
            </button>
          </div>
        )}
        {m.state === "stopped" && <p className="text-muted">To‘xtatildi.</p>}
        {m.state === "done" && !m.text && !m.proposal && !m.error && (
          <p className="text-muted">Javob bo‘sh qaytdi. Savolni boshqacha yozib ko‘ring.</p>
        )}

        {m.proposal && (
          <div className="mt-3 rounded-xl border border-line bg-mist p-3">
            <p className="font-medium">
              {m.proposal.applied
                ? `Formaga qo‘llandi: ${fields.length} ta maydon`
                : m.proposal.undone
                  ? "O‘zgarishlar qaytarildi"
                  : "Taklif hali formaga qo‘llanmagan"}
            </p>
            <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="O‘zgargan maydonlar: bosilsa, maydonga o‘tadi">
              {fields.map((f) => (
                <li key={f}>
                  <button
                    type="button"
                    title="Maydonga o‘tish"
                    onClick={() => onFocusField(f)}
                    className="rounded-full border border-line bg-paper px-2.5 py-1 text-xs hover:border-lapis"
                  >
                    {AI_FIELD_LABELS[f]}
                  </button>
                </li>
              ))}
            </ul>
            {m.proposal.dropped.length > 0 && (
              <p className="mt-2 text-xs text-muted">
                Qoidaga mos kelmagani uchun qo‘llanmadi:{" "}
                {m.proposal.dropped.map((f) => AI_FIELD_LABELS[f as AiField] ?? f).join(", ")} — formada o‘zingiz
                tekshiring.
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {m.proposal.applied && (
                <button type="button" className="btn btn-secondary px-3 py-2 text-sm" onClick={onPreview}>
                  Ko‘rish va yuborish
                </button>
              )}
              <button type="button" className="btn btn-secondary px-3 py-2 text-sm" onClick={onToggle}>
                {m.proposal.applied ? "O‘zgarishlarni qaytarish" : m.proposal.undone ? "Qayta qo‘llash" : "Formaga qo‘llash"}
              </button>
            </div>
          </div>
        )}

        {m.error && (
          <div className="mt-2 rounded-lg border border-danger/40 bg-danger-soft px-3 py-2 text-danger">
            <p>{m.error}</p>
            {last && m.state === "error" && (
              <button type="button" className="mt-1 text-xs font-medium underline underline-offset-2" onClick={retry}>
                Qayta yuborish
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
