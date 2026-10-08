"use client";

import { useEffect, useRef, useState } from "react";
import type { AiDraft, AiEvent, AiField, AiProposal, AiTurn } from "@/lib/ai";

export type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  text: string;
  /** Javob holati: o‘ylayapti → yozyapti → formani to‘ldiryapti → tugadi */
  state?: "waiting" | "thinking" | "writing" | "filling" | "done" | "stopped" | "error";
  /** Hozir yozilayotgan maydon (taklif kelguncha) */
  field?: string;
  error?: string;
  proposal?: { value: AiProposal; dropped: string[]; applied: boolean };
};

export type AssistantHandlers = {
  draft: () => AiDraft;
  /** Taklifni formaga qo‘llaydi; forma band bo‘lsa (saqlanmoqda) false */
  apply: (messageId: number, proposal: AiProposal) => boolean;
  undo: (messageId: number) => void;
};

/** Tarix: tugagan juftliklar. Birinchisi doim qoladi (unda maqola matni bo‘lishi mumkin va u keshlanadi) */
const MAX_PAIRS = 6;

function historyOf(messages: ChatMessage[]): AiTurn[] {
  const pairs: AiTurn[][] = [];
  for (let i = 0; i + 1 < messages.length; i++) {
    const [user, reply] = [messages[i], messages[i + 1]];
    if (user.role !== "user" || reply.role !== "assistant" || reply.state !== "done") continue;
    // Server javob matnini 8000 belgigacha qabul qiladi (haqiqiy javoblar ancha qisqa)
    const text = reply.text.trim().slice(0, 8000) || (reply.proposal ? "Formaga o‘zgarishlar kiritildi." : "");
    if (text) pairs.push([{ role: "user", text: user.text }, { role: "assistant", text }]);
  }
  const kept = pairs.length > MAX_PAIRS ? [pairs[0], ...pairs.slice(-(MAX_PAIRS - 1))] : pairs;
  return kept.flat();
}

const NETWORK_ERROR = "Server bilan aloqa yo‘q. Internetni tekshirib, qayta urinib ko‘ring.";

async function errorMessage(res: Response) {
  try {
    const body = (await res.json()) as { error?: { message?: string; fieldErrors?: Record<string, string> } };
    // Tekshiruv xatosida aniq sabab (masalan, "Suhbat juda uzun") maydon xatosida keladi
    const reason = Object.values(body.error?.fieldErrors ?? {})[0] ?? body.error?.message;
    if (reason) return reason;
  } catch {
    // JSON emas
  }
  return NETWORK_ERROR;
}

export function useAssistant(articleId: number, handlers: AssistantHandlers) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [remaining, setRemaining] = useState<number | null>(null);
  const controller = useRef<AbortController | null>(null);
  const seq = useRef(0);
  // O‘qituvchi bekor qilgan javobning keyingi (to‘ldirilgan) takliflari formaga o‘zi qaytib tushmasin
  const undone = useRef(new Set<number>());
  // Oqim davomida formaning eng so‘nggi holati kerak — handler’lar har renderdan keyin yangilanadi
  const latest = useRef(handlers);
  useEffect(() => {
    latest.current = handlers;
  });

  const last = messages.at(-1);
  const busy = last?.role === "assistant" && ["waiting", "thinking", "writing", "filling"].includes(last.state ?? "");

  const patch = (id: number, change: Partial<ChatMessage> | ((m: ChatMessage) => Partial<ChatMessage>)) =>
    setMessages((list) => list.map((m) => (m.id === id ? { ...m, ...(typeof change === "function" ? change(m) : change) } : m)));

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    const history = historyOf(messages);
    const userId = ++seq.current;
    const id = ++seq.current;
    setMessages((list) => [
      ...list,
      { id: userId, role: "user", text: message },
      { id, role: "assistant", text: "", state: "waiting" },
    ]);

    const abort = new AbortController();
    controller.current = abort;
    let res: Response;
    try {
      res = await fetch(`/api/articles/${articleId}/ai`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message, history, draft: latest.current.draft() }),
        signal: abort.signal,
        cache: "no-store",
      });
    } catch {
      patch(id, abort.signal.aborted ? { state: "stopped" } : { state: "error", error: NETWORK_ERROR });
      return;
    }
    if (!res.ok || !res.body) {
      patch(id, { state: "error", error: await errorMessage(res) });
      return;
    }

    const handle = (event: AiEvent) => {
      switch (event.t) {
        case "status":
          patch(id, { state: event.v });
          break;
        case "text":
          patch(id, (m) => ({ text: m.text + event.v, state: "writing" }));
          break;
        case "field":
          patch(id, { field: event.v, state: "filling" });
          break;
        case "proposal": {
          // Har taklif shu paytgacha yig‘ilgan butun taklif: avvalgisi formada almashtiriladi
          const applied = !undone.current.has(id) && latest.current.apply(id, event.v);
          patch(id, { proposal: { value: event.v, dropped: event.dropped, applied } });
          break;
        }
        case "error":
          patch(id, { error: event.message });
          break;
        case "done":
          setRemaining(event.remaining);
          patch(id, (m) => ({ state: m.error ? "error" : "done", field: undefined }));
          break;
      }
    };

    try {
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        let nl: number;
        while ((nl = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (line) handle(JSON.parse(line) as AiEvent); // bo‘sh qator — ulanishni tirik saqlovchi signal
        }
      }
      // Oqim "done"siz tugasa (ulanish uzildi), holat osilib qolmasin
      patch(id, (m) =>
        m.state === "done" || m.state === "error"
          ? {}
          : { state: "error", error: "Javob oxirigacha kelmadi. Qayta urinib ko‘ring.", field: undefined },
      );
    } catch {
      patch(id, abort.signal.aborted ? { state: "stopped", field: undefined } : { state: "error", error: "Javob uzilib qoldi. Qayta urinib ko‘ring.", field: undefined });
    } finally {
      if (controller.current === abort) controller.current = null;
    }
  }

  function stop() {
    controller.current?.abort();
  }

  function toggle(id: number) {
    const m = messages.find((x) => x.id === id);
    if (!m?.proposal) return;
    if (m.proposal.applied) {
      latest.current.undo(id);
      undone.current.add(id);
    } else undone.current.delete(id);
    const applied = m.proposal.applied ? false : latest.current.apply(id, m.proposal.value);
    patch(id, { proposal: { ...m.proposal, applied } });
  }

  function reset() {
    stop();
    setMessages([]);
  }

  return { messages, busy, remaining, send, stop, toggle, reset };
}

export const fieldsOf = (p: AiProposal) => Object.keys(p) as AiField[];
