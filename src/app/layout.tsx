import type { Metadata } from "next";
import { Literata, Onest } from "next/font/google";
import "./globals.css";

// Ikkala shrift ham lotin-ext va kirill-ext (Ўў Ққ Ғғ Ҳҳ) belgilarini qo‘llaydi
const literata = Literata({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  axes: ["opsz"],
  variable: "--font-literata",
  display: "swap",
});

const onest = Onest({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  variable: "--font-onest",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Avtomaqola — maqola yozing, biz joylab beramiz",
    template: "%s — Avtomaqola",
  },
  description:
    "Universitet o‘qituvchilari uchun: maqolani bir marta yuklang, biz uni ilmiy platformalarga joylaymiz va barcha maqolalaringizni ORCID iD orqali bir ro‘yxatga yig‘amiz.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uz" className={`${literata.variable} ${onest.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-mist font-sans text-ink">{children}</body>
    </html>
  );
}
