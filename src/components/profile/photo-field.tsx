"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { sendForm, sendJson } from "@/lib/api-client";
import { Avatar } from "./avatar";

const MAX_BYTES = 10 * 1024 * 1024;

export function PhotoField({ initialUrl, enabled, name }: { initialUrl: string | null; enabled: boolean; name: string }) {
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  // Kabinet header’idagi rasm ham yangilansin (eski fayllar serverda o‘chiriladi)
  const router = useRouter();

  async function upload(file: File) {
    if (file.size > MAX_BYTES) {
      setError("Rasm hajmi 10 MB dan oshmasligi kerak.");
      return;
    }
    setBusy(true);
    setError(null);
    const form = new FormData();
    form.append("photo", file);
    const res = await sendForm<{ photoUrl: string }>("/api/profile/photo", form);
    setBusy(false);
    if (res.ok) {
      setUrl(res.photoUrl);
      router.refresh();
    } else setError(res.error.message);
  }

  async function remove() {
    setBusy(true);
    setError(null);
    const res = await sendJson("DELETE", "/api/profile/photo");
    setBusy(false);
    if (res.ok) {
      setUrl(null);
      router.refresh();
    } else setError(res.error.message);
  }

  return (
    <section aria-labelledby="photo-title">
      <h2 id="photo-title" className="font-serif text-lg font-semibold">
        Rasm
      </h2>
      <div className="mt-5 flex flex-wrap items-center gap-5 lg:flex-col lg:items-start">
        <Avatar src={url} name={name} size={112} />
        <div className="space-y-3">
          <p className="text-sm text-muted">Rasmiy surat, kvadrat qilib kesiladi.</p>
          {enabled ? (
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => input.current?.click()}>
                {busy ? "Yuklanmoqda…" : url ? "Rasmni almashtirish" : "Rasm yuklash"}
              </button>
              {url && (
                <button type="button" className="btn btn-ghost" disabled={busy} onClick={remove}>
                  O‘chirish
                </button>
              )}
              <input
                ref={input}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void upload(file);
                  e.target.value = "";
                }}
              />
            </div>
          ) : (
            <p className="text-sm">Rasm yuklash uchun avval profilni saqlang.</p>
          )}
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
