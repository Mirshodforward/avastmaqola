import type { Metadata } from "next";
import { Literata, Onest } from "next/font/google";
import { SERVICE_NAME, SITE_NAME, siteUrl } from "@/server/site";
import "./globals.css";

// subsets — faqat OLDINDAN yuklanadigan qism. Kirill va lotin-ext (Ўў Ққ Ғғ Ҳҳ) fayllari ham
// self-host qilinadi, lekin sahifada shu harflar uchragandagina yuklanadi (unicode-range): 8 emas, 2 ta preload
const literata = Literata({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-literata",
  display: "swap",
});

const onest = Onest({
  subsets: ["latin"],
  variable: "--font-onest",
  display: "swap",
});

const description =
  "Asman Universiteti o‘qituvchilarining ilmiy maqolalari va profillari: uch tilda annotatsiyalar, ochiq PDF, Google Scholar uchun moslangan sahifalar.";

// canonical bu yerda YO‘Q: root layout’dagi canonical barcha sahifalarga meros bo‘lib o‘tardi
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  applicationName: SERVICE_NAME,
  title: {
    default: `${SITE_NAME} — ilmiy maqolalar portali`,
    template: `%s — ${SITE_NAME}`,
  },
  description,
  openGraph: { type: "website", siteName: SITE_NAME, locale: "uz_UZ", description },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uz" className={`${literata.variable} ${onest.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-mist font-sans text-ink">{children}</body>
    </html>
  );
}
