/**
 * schema.org JSON-LD. "<" ekranlanadi: foydalanuvchi matnidagi "</script>" sahifani buzmasin (XSS).
 * Next.js hujjati tavsiyasi: next/script emas, oddiy <script> teg.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
