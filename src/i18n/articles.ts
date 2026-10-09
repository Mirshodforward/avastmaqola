// Manba: src/lib/article-rules.ts, src/server/articles/service.ts, src/server/articles/view.ts, src/server/articles/seo.ts
import type { ArticleStatus, VenueType } from "@/lib/article-rules";
import type { Lang } from "@/lib/langs";
import { enPlural, ruPlural } from "./plural";

const uz = {
  // article-rules.ts
  status: {
    draft: "Qoralama",
    submitted: "Ko‘rib chiqilmoqda",
    published: "Chop etilgan",
    rejected: "Tuzatish kerak",
  } satisfies Record<ArticleStatus, string>,
  allRightsReserved: "Barcha huquqlar himoyalangan",
  venue: { journal: "Jurnal", conference: "Konferensiya to‘plami" } satisfies Record<VenueType, string>,
  untitled: "Sarlavhasiz maqola",
  // article-rules.ts — articleProblems(); language = LANG_LABELS[lang]
  problems: {
    langRequired: "Maqola tilini tanlang",
    authorsRequired: "Kamida bitta muallif kerak",
    titleTooShort: (language: string, min: number) => `${language}: sarlavha kamida ${min} belgi`,
    abstractTooShort: (language: string, min: number) => `${language}: annotatsiya kamida ${min} belgi`,
    keywordsTooFew: (language: string, min: number) => `${language}: kamida ${min} ta kalit so‘z`,
    titleNotRussian: (language: string) => `${language}: sarlavha rus tilida (kirill yozuvida) bo‘lishi kerak`,
    abstractNotRussian: (language: string) => `${language}: annotatsiya rus tilida (kirill yozuvida) bo‘lishi kerak`,
    titleNotEnglish: (language: string) => `${language}: sarlavha ingliz tilida bo‘lishi kerak`,
    abstractNotEnglish: (language: string) => `${language}: annotatsiya ingliz tilida bo‘lishi kerak`,
    titlesNotDistinct: "Sarlavhalar har xil tilda bo‘lishi kerak, nusxa emas",
    abstractsNotDistinct: "Annotatsiyalar har xil tilda bo‘lishi kerak, nusxa emas",
    pdfRequired: "Maqolaning PDF faylini yuklang",
    // articles/service.ts
    profileRequired: "Avval profilingizni to‘ldiring",
  },
  // articles/view.ts
  authorFallback: "Muallif",
  // articles/seo.ts
  breadcrumb: { home: "Bosh sahifa", articles: "Maqolalar" },
};

export const articleText: Record<Lang, typeof uz> = {
  uz,
  ru: {
    status: {
      draft: "Черновик",
      submitted: "На рассмотрении",
      published: "Опубликовано",
      rejected: "Требует доработки",
    },
    allRightsReserved: "Все права защищены",
    venue: { journal: "Журнал", conference: "Сборник конференции" },
    untitled: "Статья без названия",
    problems: {
      langRequired: "Выберите язык статьи",
      authorsRequired: "Нужен хотя бы один автор",
      titleTooShort: (language, min) =>
        `${language}: название — не менее ${min} ${ruPlural(min, ["символа", "символов", "символов"])}`,
      abstractTooShort: (language, min) =>
        `${language}: аннотация — не менее ${min} ${ruPlural(min, ["символа", "символов", "символов"])}`,
      keywordsTooFew: (language, min) =>
        `${language}: не менее ${min} ${ruPlural(min, ["ключевого слова", "ключевых слов", "ключевых слов"])}`,
      titleNotRussian: (language) => `${language}: название должно быть на русском языке (кириллицей)`,
      abstractNotRussian: (language) => `${language}: аннотация должна быть на русском языке (кириллицей)`,
      titleNotEnglish: (language) => `${language}: название должно быть на английском языке`,
      abstractNotEnglish: (language) => `${language}: аннотация должна быть на английском языке`,
      titlesNotDistinct: "Названия должны быть на разных языках, а не копиями",
      abstractsNotDistinct: "Аннотации должны быть на разных языках, а не копиями",
      pdfRequired: "Загрузите PDF-файл статьи",
      profileRequired: "Сначала заполните профиль",
    },
    authorFallback: "Автор",
    breadcrumb: { home: "Главная", articles: "Статьи" },
  },
  en: {
    status: {
      draft: "Draft",
      submitted: "Under review",
      published: "Published",
      rejected: "Needs revision",
    },
    allRightsReserved: "All rights reserved",
    venue: { journal: "Journal", conference: "Conference proceedings" },
    untitled: "Untitled article",
    problems: {
      langRequired: "Select the article language",
      authorsRequired: "At least one author is required",
      titleTooShort: (language, min) =>
        `${language}: title must be at least ${min} ${enPlural(min, "character", "characters")}`,
      abstractTooShort: (language, min) =>
        `${language}: abstract must be at least ${min} ${enPlural(min, "character", "characters")}`,
      keywordsTooFew: (language, min) => `${language}: at least ${min} ${enPlural(min, "keyword", "keywords")}`,
      titleNotRussian: (language) => `${language}: title must be in Russian (Cyrillic script)`,
      abstractNotRussian: (language) => `${language}: abstract must be in Russian (Cyrillic script)`,
      titleNotEnglish: (language) => `${language}: title must be in English`,
      abstractNotEnglish: (language) => `${language}: abstract must be in English`,
      titlesNotDistinct: "Titles must be in different languages, not copies",
      abstractsNotDistinct: "Abstracts must be in different languages, not copies",
      pdfRequired: "Upload the article PDF",
      profileRequired: "Complete your profile first",
    },
    authorFallback: "Author",
    breadcrumb: { home: "Home", articles: "Articles" },
  },
};
