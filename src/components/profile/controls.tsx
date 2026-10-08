import { useId, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

/** ORCID’dagidek alohida bo‘lim: sarlavha, izoh va ikki ustunli maydonlar */
export function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="rounded-xl border border-line bg-paper p-5 sm:p-6">
      <h2 id={id} className="font-serif text-lg font-semibold">
        {title}
      </h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className="mt-5 grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

type Extra = { label: string; error?: string; hint?: ReactNode };

function Message({ id, error, hint }: { id: string; error?: string; hint?: ReactNode }) {
  if (error) return <p id={id} className="mt-1.5 text-sm text-danger">{error}</p>;
  if (hint) return <p id={id} className="mt-1.5 text-sm text-muted">{hint}</p>;
  return null;
}

export function SelectField({ label, error, hint, children, ...select }: SelectHTMLAttributes<HTMLSelectElement> & Extra) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${id}-m` : undefined}
        className="input mt-1.5"
        {...select}
      >
        {children}
      </select>
      <Message id={`${id}-m`} error={error} hint={hint} />
    </div>
  );
}

export function TextAreaField({ label, error, hint, ...textarea }: TextareaHTMLAttributes<HTMLTextAreaElement> & Extra) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${id}-m` : undefined}
        className="input mt-1.5 min-h-36 leading-relaxed"
        {...textarea}
      />
      <Message id={`${id}-m`} error={error} hint={hint} />
    </div>
  );
}
