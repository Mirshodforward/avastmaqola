"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { AI_FIELD_LABELS, type AiField } from "@/lib/ai";
import { fieldsOf, type ChatMessage, type useAssistant } from "./use-assistant";

const MESSAGE_MAX = 100_000;
const NUMBER = new Intl.NumberFormat("uz-UZ");

const QUICK = [
  { label: "PDF asosida hammasini to‘ldirish", text: "Yuklangan PDF asosida barcha maydonlarni uch tilda to‘ldiring.", needsPdf: true },
  { label: "Tarjimalarni tekshirish", text: "Uch tildagi sarlavha, annotatsiya va kalit so‘zlarni solishtirib tekshiring, xatolarni tuzating." },
  { label: "Annotatsiyani yaxshilash", text: "Annotatsiyalarni ilmiy uslubda aniqroq va ravonroq qiling, mazmunini o‘zgartirmang." },
  { label: "Kalit so‘zlarni tanlash", text: "Maqola mazmuniga mos aniq kalit so‘zlarni uch tilda tanlang." },
];

const STATUS: Record<string, string> = {
  waiting: "So‘rov yuborildi…",
  thinking: "Maqolani tahlil qilyapti…",
  writing: "Javob yozyapti…",
  filling: "Formani to‘ldiryapti…",
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
  onPreview,
  onFocusField,
  onClose,
}: {
  assistant: ReturnType<typeof useAssistant>;
  hasPdf: boolean;
  onPreview: () => void;
  onFocusField: (field: AiField) => void;
  /** Mobil oynada: panelni yopish */
  onClose?: () => void;
}) {
  const { messages, busy, remaining, send, stop, toggle, reset } = assistant;
  const [text, setText] = useState("");
  const inputId = useId();
  const scroller = useRef<HTMLDivElement>(null);
  // Foydalanuvchi yuqoriga o‘qish uchun aylantirgan bo‘lsa, yangi matn uni pastga sudrab ketmasin
  const stick = useRef(true);
  const tooLong = text.length > MESSAGE_MAX;

  useEffect(() => {
    const el = scroller.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function submit(value = text) {
    if (busy || !value.trim() || value.length > MESSAGE_MAX) return;
    stick.current = true;
    void send(value);
    if (value === text) setText("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  }

  const last = messages.at(-1);
  const announcement =
    last?.role !== "assistant"
      ? ""
      : last.state === "done"
        ? last.proposal?.applied
          ? `Javob tayyor. Formaga ${fieldsOf(last.proposal.value).length} ta maydon qo‘llandi.`
          : "Javob tayyor."
        : last.state === "error"
          ? (last.error ?? "Xatolik")
          : busy
            ? "AI javob tayyorlamoqda."
            : "";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-lapis text-on-lapis">
          <SparkIcon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-base font-semibold leading-tight">AI yordamchi</h2>
          <p className="truncate text-xs text-muted">Maqolani o‘zbek, rus va ingliz tillarida to‘ldiradi</p>
        </div>
        {messages.length > 0 && (
          <button type="button" className="btn btn-ghost px-2.5 py-1.5 text-sm" onClick={reset}>
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
        className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5"
      >
        {messages.length === 0 ? (
          <div className="text-sm leading-relaxed">
            <p>
              Maqolangiz qaysi tilda bo‘lishidan qat’i nazar, sarlavha, annotatsiya, kalit so‘zlar va mualliflarni uch
              tilda to‘ldirib beraman.
            </p>
            <p className="mt-2 text-muted">
              {hasPdf
                ? "PDF yuklangan — pastdagi tugma bilan boshlang yoki savol yozing."
                : "Formada PDF’ni yuklang yoki maqola matnini shu yerga joylashtiring."}
            </p>
            <ul className="mt-4 space-y-2">
              {QUICK.filter((q) => !q.needsPdf || hasPdf).map((q) => (
                <li key={q.label}>
                  <button
                    type="button"
                    onClick={() => submit(q.text)}
                    className="flex w-full items-center gap-2 rounded-lg border border-line px-3 py-2.5 text-left hover:border-lapis"
                  >
                    <SparkIcon className="size-4 shrink-0 text-lapis" />
                    {q.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          messages.map((m) =>
            m.role === "user" ? (
              <UserMessage key={m.id} text={m.text} />
            ) : (
              <AssistantMessage
                key={m.id}
                m={m}
                retry={() => {
                  const prompt = messages[messages.findIndex((x) => x.id === m.id) - 1];
                  if (prompt) submit(prompt.text);
                }}
                last={m === last}
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
        <textarea
          id={inputId}
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Savol yoki maqola matni… (Enter — yuborish)"
          aria-invalid={tooLong || undefined}
          aria-describedby={`${inputId}-hint`}
          className="input max-h-48 min-h-0 resize-y text-sm leading-relaxed"
        />
        <div className="mt-2 flex items-center gap-3">
          <p id={`${inputId}-hint`} className={`min-w-0 flex-1 text-xs ${tooLong ? "text-danger" : "text-muted"}`}>
            {tooLong
              ? `Matn juda uzun: ${NUMBER.format(text.length)} belgi (ko‘pi bilan ${NUMBER.format(MESSAGE_MAX)}).`
              : text.length > 2000
                ? `${NUMBER.format(text.length)} belgi`
                : remaining !== null
                  ? `Bugun yana ${remaining} ta so‘rov mumkin`
                  : "Matn va PDF tahlil uchun Claude (Anthropic) xizmatiga yuboriladi."}
          </p>
          {busy ? (
            <button type="button" className="btn btn-secondary" onClick={stop}>
              To‘xtatish
            </button>
          ) : (
            <button type="submit" className="btn btn-primary" aria-disabled={!text.trim() || tooLong}>
              Yuborish
            </button>
          )}
        </div>
      </form>
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </div>
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
  retry,
  onToggle,
  onPreview,
  onFocusField,
}: {
  m: ChatMessage;
  last: boolean;
  retry: () => void;
  onToggle: () => void;
  onPreview: () => void;
  onFocusField: (field: AiField) => void;
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
          <p className="flex items-center gap-2 text-muted">
            <span className="flex gap-1" aria-hidden="true">
              {[0, 150, 300].map((d) => (
                <span key={d} className="size-1.5 animate-bounce rounded-full bg-tile motion-reduce:animate-none" style={{ animationDelay: `${d}ms` }} />
              ))}
            </span>
            {m.state === "filling" && fieldLabel ? `Yozilmoqda: ${fieldLabel}` : STATUS[m.state!]}
          </p>
        )}
        {m.state === "stopped" && <p className="text-muted">To‘xtatildi.</p>}
        {m.state === "done" && !m.text && !m.proposal && !m.error && <p className="text-muted">Javob bo‘sh qaytdi. Savolni boshqacha yozib ko‘ring.</p>}

        {m.proposal && (
          <div className="mt-3 rounded-xl border border-line bg-mist p-3">
            <p className="font-medium">
              {m.proposal.applied ? `Formaga qo‘llandi: ${fields.length} ta maydon` : "Taklif formaga qo‘llanmagan"}
            </p>
            <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="O‘zgargan maydonlar">
              {fields.map((f) => (
                <li key={f}>
                  <button
                    type="button"
                    onClick={() => onFocusField(f)}
                    className="rounded-full border border-line bg-paper px-2.5 py-0.5 text-xs hover:border-lapis"
                  >
                    {AI_FIELD_LABELS[f]}
                  </button>
                </li>
              ))}
            </ul>
            {m.proposal.dropped.length > 0 && (
              <p className="mt-2 text-xs text-muted">
                Qoidaga mos kelmagani uchun qo‘llanmadi:{" "}
                {m.proposal.dropped.map((f) => AI_FIELD_LABELS[f as AiField] ?? f).join(", ")}.
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {m.proposal.applied && (
                <button type="button" className="btn btn-primary px-3 py-2 text-sm" onClick={onPreview}>
                  Ko‘rinishini ko‘rish
                </button>
              )}
              <button type="button" className="btn btn-secondary px-3 py-2 text-sm" onClick={onToggle}>
                {m.proposal.applied ? "Bekor qilish" : "Formaga qo‘llash"}
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
