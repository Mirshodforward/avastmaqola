"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Chip } from "@/components/article/status-chip";
import { Field } from "@/components/auth/field";
import { TextAreaField } from "@/components/profile/controls";
import { sendForm, sendJson } from "@/lib/api-client";

type Values = { title: string; body: string };
type ErrorKey = keyof Values | "photo";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** Admin: yangilikni yozish, muqova yuklash, chop etish yoki saytdan olish */
export function NewsForm({
  id,
  initial,
  initialPublished,
  initialImageUrl,
}: {
  id: number;
  initial: Values;
  initialPublished: boolean;
  /** Manzilni server beradi (sahifa va yuklash javobi) — forma URL shaklini bilmaydi */
  initialImageUrl: string | null;
}) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [published, setPublished] = useState(initialPublished);
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [errors, setErrors] = useState<Partial<Record<ErrorKey, string>>>({});
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState<"save" | "image" | "delete" | null>(null);
  const locked = busy === "save" || busy === "delete";
  const fileInput = useRef<HTMLInputElement>(null);

  function update(key: keyof Values, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    setNotice(null);
  }

  async function save(nextPublished: boolean) {
    if (busy) return; // tugmalar aria-disabled: fokus yo‘qolmasin, lekin ikki marta yuborilmasin
    setBusy("save");
    setNotice(null);
    setErrors({});
    const res = await sendJson("PATCH", `/api/admin/news/${id}`, { ...values, published: nextPublished });
    setBusy(null);
    if (res.ok) {
      setNotice({
        ok: true,
        text: nextPublished === published ? "Saqlandi." : nextPublished ? "Chop etildi." : "Saytdan olindi.",
      });
      setPublished(nextPublished);
      router.refresh();
      return;
    }
    const { fieldErrors, field, message } = res.error;
    // flushSync: xato belgisi DOM’ga tushgach fokus o‘sha maydonga o‘tadi (keyingi kadrni kutish ishonchsiz)
    flushSync(() => {
      if (fieldErrors) setErrors(fieldErrors);
      else if (field) setErrors({ [field]: message });
      setNotice({ ok: false, text: message });
    });
    document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }

  async function upload(file: File) {
    if (busy) return;
    if (file.size > MAX_IMAGE_BYTES) {
      setErrors({ photo: "Rasm hajmi 10 MB dan oshmasligi kerak." });
      return;
    }
    setBusy("image");
    setErrors({});
    const form = new FormData();
    form.append("photo", file);
    const res = await sendForm<{ imageUrl: string }>(`/api/admin/news/${id}/image`, form);
    setBusy(null);
    if (res.ok) setImageUrl(res.imageUrl);
    else setErrors({ photo: res.error.message });
  }

  async function removeImage() {
    if (busy) return;
    setBusy("image");
    setErrors({});
    const res = await sendJson("DELETE", `/api/admin/news/${id}/image`);
    setBusy(null);
    if (res.ok) setImageUrl(null);
    else setErrors({ photo: res.error.message });
  }

  async function remove() {
    if (busy || !window.confirm("Yangilik o‘chirilsinmi? Buni qaytarib bo‘lmaydi.")) return;
    setBusy("delete");
    const res = await sendJson("DELETE", `/api/admin/news/${id}`);
    if (res.ok) {
      router.push("/admin/yangiliklar");
      return;
    }
    setBusy(null);
    setNotice({ ok: false, text: res.error.message });
  }

  return (
    <div className="mt-6 max-w-3xl space-y-6">
      <p className="flex flex-wrap items-center gap-3 text-sm">
        <Chip tone={published ? "tile" : "neutral"}>{published ? "Chop etilgan" : "Qoralama"}</Chip>
        {/* Oddiy <a>: router keshidagi eski nusxa emas, yangi sahifa ochilsin */}
        {published && (
          <a href={`/yangiliklar/${id}`} className="link">
            Saytda ko‘rish
          </a>
        )}
      </p>

      {/* Saqlash paytida matn qulflanadi: shu orada yozilgani "Saqlandi" deb ko‘rsatilmasin. Rasm alohida so‘rov —
          yuklash paytida matnni yozishda davom etish mumkin, rasm tugmalari esa fokusni yo‘qotmasligi uchun aria-disabled */}
      <fieldset disabled={locked} className="min-w-0 border-0 p-0">
        <Field
          label="Sarlavha"
          name="title"
          value={values.title}
          error={errors.title}
          maxLength={200}
          onChange={(e) => update("title", e.target.value)}
        />
      </fieldset>

      <div>
        <p className="text-sm font-medium">Rasm</p>
        {/* Rasm bo‘lmasa bo‘sh quti chizilmaydi (u matn maydoni va yuklash tugmasini ekrandan pastga surardi);
            rasm bo‘lsa — o‘rtacha kattalikdagi ko‘rinish */}
        {imageUrl && (
          <Image
            src={imageUrl}
            alt=""
            width={1200}
            height={675}
            unoptimized // 1200×675 WebP yuklashda tayyorlangan
            className="mt-1.5 aspect-video w-full max-w-sm rounded-xl border border-line object-cover"
          />
        )}
        <div className={`${imageUrl ? "mt-3" : "mt-1.5"} flex flex-wrap gap-2`}>
          <button
            type="button"
            className="btn btn-secondary"
            aria-disabled={busy !== null}
            onClick={() => !busy && fileInput.current?.click()}
          >
            {busy === "image" ? "Yuklanmoqda…" : imageUrl ? "Rasmni almashtirish" : "Rasm yuklash"}
          </button>
          {imageUrl && (
            <button type="button" className="btn btn-ghost" aria-disabled={busy !== null} onClick={removeImage}>
              Rasmni o‘chirish
            </button>
          )}
          <input
            ref={fileInput}
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
        {errors.photo && (
          <p role="alert" className="mt-1.5 text-sm text-danger">
            {errors.photo}
          </p>
        )}
      </div>

      <fieldset disabled={locked} className="min-w-0 border-0 p-0">
        <TextAreaField
          label="Matn"
          name="body"
          value={values.body}
          error={errors.body}
          rows={14}
          onChange={(e) => update("body", e.target.value)}
        />
      </fieldset>

      {/* Xabar sticky panelda: uzun matn o‘rtasida turgan admin ham ko‘radi */}
      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-mist/95 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:bg-paper/95">
        <button type="button" className="btn btn-secondary" aria-disabled={busy !== null} onClick={() => save(published)}>
          {busy === "save" ? "Saqlanmoqda…" : "Saqlash"}
        </button>
        {published ? (
          <button type="button" className="btn btn-ghost" aria-disabled={busy !== null} onClick={() => save(false)}>
            Saytdan olish
          </button>
        ) : (
          <button type="button" className="btn btn-primary" aria-disabled={busy !== null} onClick={() => save(true)}>
            Chop etish
          </button>
        )}
        {notice && (
          <p role={notice.ok ? "status" : "alert"} className={`text-sm ${notice.ok ? "font-medium text-tile" : "text-danger"}`}>
            {notice.text}
          </p>
        )}
        {/* O‘chirish — qaytarib bo‘lmaydigan amal: «Chop etish»dan uzoqda, o‘ng chetda */}
        <button type="button" className="btn btn-ghost ml-auto text-danger" aria-disabled={busy !== null} onClick={remove}>
          O‘chirish
        </button>
      </div>
    </div>
  );
}
