import { SITE_NAME, UNIVERSITY_NAME, UNIVERSITY_NAME_EN, siteUrl } from "@/server/site";
import { JsonLd } from "./json-ld";

/** Bosh sahifa uchun: sayt (WebSite) va uni yurituvchi universitet. Faqat bosh sahifada bir marta. */
export function SiteJsonLd() {
  const url = siteUrl();
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebSite",
            "@id": `${url}/#website`,
            url: `${url}/`,
            name: SITE_NAME,
            inLanguage: "uz",
            publisher: { "@id": `${url}/#university` },
          },
          {
            "@type": "CollegeOrUniversity",
            "@id": `${url}/#university`,
            name: UNIVERSITY_NAME,
            alternateName: UNIVERSITY_NAME_EN,
          },
        ],
      }}
    />
  );
}
