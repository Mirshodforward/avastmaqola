"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Field } from "@/components/auth/field";
import { sendJson } from "@/lib/api-client";
import {
  ACADEMIC_DEGREES,
  ACADEMIC_DEGREE_LABELS,
  ACADEMIC_TITLES,
  ACADEMIC_TITLE_LABELS,
  POSITION_SUGGESTIONS,
} from "@/lib/profile-labels";
import { Section, SelectField, TextAreaField } from "./controls";
import { PhotoField } from "./photo-field";

export type ProfileFormValues = {
  firstName: string;
  lastName: string;
  patronymic: string;
  publishedName: string;
  position: string;
  academicDegree: string;
  academicTitle: string;
  institution: string;
  department: string;
  direction: string;
  bio: string;
  keywords: string;
  orcid: string;
  googleScholarUrl: string;
  scopusAuthorId: string;
  researcherId: string;
  researchgateUrl: string;
  websiteUrl: string;
  publicEmail: string;
  isPublic: boolean;
};

type TextKey = Exclude<keyof ProfileFormValues, "isPublic">;

export function ProfileForm({
  initial,
  initialSlug,
  photoUrl,
}: {
  initial: ProfileFormValues;
  initialSlug: string | null;
  photoUrl: string | null;
}) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileFormValues, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [slug, setSlug] = useState(initialSlug);
  // Havola saqlangan holatga ergashadi: belgilangan, lekin hali saqlanmagan "ommaviy" 404 ga olib bormasin
  const [savedPublic, setSavedPublic] = useState(initial.isPublic);

  function update<K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    setStatus("idle");
  }

  const bind = (key: TextKey) => ({
    name: key,
    value: values[key],
    error: errors[key],
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => update(key, e.target.value),
  });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "saving") return; // tugma aria-disabled: fokus yo‘qolmasin, lekin ikki marta yuborilmasin
    setStatus("saving");
    setFormError(null);
    const res = await sendJson<{ slug: string }>("PUT", "/api/profile", values);
    if (res.ok) {
      setSlug(res.slug);
      setSavedPublic(values.isPublic);
      setStatus("saved");
      return;
    }
    setStatus("idle");
    const { fieldErrors, field, message } = res.error;
    // "keywords.2" (ro‘yxat elementi) → keywords: aks holda xato hech qaysi maydonda ko‘rinmasdi
    if (fieldErrors) setErrors(Object.fromEntries(Object.entries(fieldErrors).map(([k, v]) => [k.split(".")[0], v])));
    else if (field) setErrors({ [field]: message });
    // Umumiy xabar har doim saqlash tugmasi yonida ko‘rinadi
    setFormError(message);
    // Birinchi xato maydonga o‘tamiz: uzun formada xato ko‘rinmay qolmasin
    requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
  }

  return (
    // Keng ekranda: rasm chap ustunda (yopishqoq), bo‘limlar o‘ngda butun kenglikda
    <div className="mt-8 grid items-start gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
      <div className="xl:sticky xl:top-6">
        <PhotoField initialUrl={photoUrl} enabled={slug !== null} name={`${values.firstName} ${values.lastName}`} />
      </div>

      <form noValidate onSubmit={onSubmit} className="min-w-0 space-y-6">
        {/* Saqlash (ORCID tekshiruvi bir necha soniya) davomida maydonlar qulflanadi: shu orada yozilgani "Saqlandi" deb ko‘rsatilmasin */}
        <fieldset disabled={status === "saving"} className="m-0 min-w-0 space-y-6 border-0 p-0">
        <Section title="Ism" description="Ism va familiya maqola sahifalarida muallif sifatida ko‘rinadi.">
          <Field label="Ism *" autoComplete="given-name" {...bind("firstName")} />
          <Field label="Familiya *" autoComplete="family-name" {...bind("lastName")} />
          <Field label="Otasining ismi" {...bind("patronymic")} />
          <Field
            label="Ilmiy nashrlardagi ismi"
            placeholder="M. A. Qahramonov"
            hint="Maqolalaringizda qanday yozilsa, shunday."
            {...bind("publishedName")}
          />
        </Section>

        <Section title="Ish joyi">
          <div className="sm:col-span-2">
            <Field label="Muassasa *" {...bind("institution")} />
          </div>
          <Field label="Fakultet yoki kafedra" {...bind("department")} />
          <Field label="Lavozim *" list="position-options" {...bind("position")} />
          <datalist id="position-options">
            {POSITION_SUGGESTIONS.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </Section>

        <Section title="Ilmiy daraja va unvon">
          <SelectField label="Ilmiy daraja" {...bind("academicDegree")}>
            <option value="">Yo‘q</option>
            {ACADEMIC_DEGREES.map((d) => (
              <option key={d} value={d}>
                {ACADEMIC_DEGREE_LABELS[d]}
              </option>
            ))}
          </SelectField>
          <SelectField label="Ilmiy unvon" {...bind("academicTitle")}>
            <option value="">Yo‘q</option>
            {ACADEMIC_TITLES.map((t) => (
              <option key={t} value={t}>
                {ACADEMIC_TITLE_LABELS[t]}
              </option>
            ))}
          </SelectField>
        </Section>

        <Section title="Ilmiy faoliyat">
          <div className="sm:col-span-2">
            <Field label="Ilmiy yo‘nalish *" placeholder="Masalan: Kompyuter fanlari" {...bind("direction")} />
          </div>
          <div className="sm:col-span-2">
            <Field
              label="Kalit so‘zlar"
              placeholder="sun’iy intellekt, ta’lim texnologiyalari"
              hint="Vergul bilan ajrating, ko‘pi bilan 10 ta."
              {...bind("keywords")}
            />
          </div>
          <div className="sm:col-span-2">
            <TextAreaField
              label="Biografiya"
              maxLength={1500}
              hint={`${values.bio.length}/1500. Qisqa va aniq: tajriba, asosiy ilmiy natijalar.`}
              {...bind("bio")}
            />
          </div>
        </Section>

        <Section
          title="Identifikatorlar va havolalar"
          description="Qidiruv tizimlari va AI shu havolalar orqali boshqa platformalardagi profillaringizni sizga bog‘laydi."
        >
          <Field label="ORCID iD" placeholder="0000-0000-0000-0000" spellCheck={false} {...bind("orcid")} />
          <Field label="Scopus Author ID" inputMode="numeric" {...bind("scopusAuthorId")} />
          <div className="sm:col-span-2">
            <Field
              label="Google Scholar profili"
              type="url"
              placeholder="https://scholar.google.com/citations?user=…"
              {...bind("googleScholarUrl")}
            />
          </div>
          <Field label="Web of Science ResearcherID" placeholder="ABC-1234-2020" {...bind("researcherId")} />
          <Field label="ResearchGate profili" type="url" {...bind("researchgateUrl")} />
          <Field label="Shaxsiy sayt" type="url" {...bind("websiteUrl")} />
          <Field label="Ommaviy email" type="email" autoComplete="email" {...bind("publicEmail")} />
        </Section>

        <section className="rounded-xl border border-line bg-paper p-5 sm:p-6">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 size-4 accent-[var(--lapis)]"
              checked={values.isPublic}
              onChange={(e) => update("isPublic", e.target.checked)}
            />
            <span>
              <span className="font-medium">Profilim ommaviy sahifada ko‘rinsin</span>
              <span className="mt-0.5 block text-sm text-muted">
                Telefon raqamingiz hech qachon ko‘rsatilmaydi.
              </span>
            </span>
          </label>
        </section>
        </fieldset>

        {/* Xabar sticky panelda: forma o‘rtasida turgan foydalanuvchi ham ko‘radi */}
        <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-4 border-t border-line bg-mist/95 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:bg-paper/95">
          <button type="submit" className="btn btn-primary" aria-disabled={status === "saving"}>
            {status === "saving" ? "Saqlanmoqda…" : "Saqlash"}
          </button>
          {status === "saved" && (
            <p role="status" className="text-sm font-medium text-tile">
              Saqlandi.
            </p>
          )}
          {formError && (
            <p role="alert" className="text-sm text-danger">
              {formError}
            </p>
          )}
          {/* Oddiy <a>: saqlangandan keyin router keshidagi eski nusxa emas, yangi sahifa ochilsin */}
          {slug && savedPublic && (
            <a href={`/oqituvchi/${slug}`} className="link text-sm">
              Ommaviy sahifani ko‘rish
            </a>
          )}
        </div>
      </form>
    </div>
  );
}
