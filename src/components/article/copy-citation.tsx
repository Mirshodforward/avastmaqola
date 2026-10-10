"use client";

import { useEffect, useRef, useState } from "react";

const TEXT = { copy: "Nusxa olish", done: "Nusxa olindi", failed: "Nusxa olinmadi" };

/**
 * Iqtibosni nusxalash tugmasi. Iqtibos matnining o‘zi serverda chiziladi (Scholar va JS’siz o‘quvchi ko‘radi) —
 * tugma faqat shu matnni almashish buferiga yozadi, shuning uchun text sahifadagi matn bilan aynan bir xil satr bo‘lsin.
 * label — format nomi ("APA", "BibTeX"): ekran o‘quvchi ikki tugmani farqlashi uchun nomga qo‘shiladi.
 */
export function CopyCitation({ text, label }: { text: string; label: string }) {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");
  const [attempt, setAttempt] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    let ok: boolean;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      ok = legacyCopy(text);
    }
    setState(ok ? "done" : "failed");
    setAttempt((n) => n + 1);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2500);
  }

  return (
    <>
      <button type="button" className="btn btn-secondary" onClick={copy}>
        <span className="sr-only">{label}: </span>
        {TEXT[state === "idle" ? "copy" : state]}
      </button>
      {/* Jonli hudud doim DOM’da. Takroriy bosishda matn bir xil qolsa e’lon qilinmaydi — oxiriga navbatma-navbat
          bo‘linmas bo‘shliq qo‘shiladi (o‘qilmaydi), shunda har bir natija qayta e’lon qilinadi */}
      <span role="status" className="sr-only">
        {state === "idle" ? "" : `${label}: ${TEXT[state]}${attempt % 2 ? " " : ""}`}
      </span>
    </>
  );
}

/** Clipboard API yo‘q yoki rad etilgan (eski WebView, http sahifa): vaqtinchalik textarea orqali, fokus tugmaga qaytadi */
function legacyCopy(text: string): boolean {
  const active = document.activeElement as HTMLElement | null;
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.cssText = "position:fixed;top:0;left:0;opacity:0";
  document.body.append(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {}
  area.remove();
  active?.focus();
  return ok;
}
