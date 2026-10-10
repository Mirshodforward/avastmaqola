// Manba: src/components/article/article-view.tsx, src/app/[lang]/maqola/[id]/page.tsx
// (sarlavha va annotatsiya sarlavhalari — src/lib/langs.ts ABSTRACT_HEADINGS / KEYWORDS_HEADINGS)
import type { License, VenueType } from "@/lib/article-rules";
import type { Lang } from "@/lib/langs";

const uz = {
  preview: "Oldindan ko‘rish. Sahifa ommaga faqat universitet tasdiqlagach ochiladi.",
  kind: "Ilmiy maqola.",
  // Boshqa joyda chiqqan maqola: bu sana faqat saytga joylangan kun
  postedOnSite: "Saytga joylangan",
  published: "Chop etilgan",
  notPublished: "Hali chop etilmagan.",
  /** "3-son, 12-maqola"; raqam yo‘q bo‘lsa — "3-son" (lib/issue.ts bilan bir xil) */
  place: (issueNo: number, issueSeq: number | null) => (issueSeq ? `${issueNo}-son, ${issueSeq}-maqola` : `${issueNo}-son`),
  license: "Litsenziya",
  licenses: { "all-rights-reserved": "Barcha huquqlar himoyalangan" } as Partial<Record<License, string>>,
  venues: { journal: "Jurnal", conference: "Konferensiya to‘plami" } as Record<VenueType, string>,
  openPdf: (size: string) => `PDF ochish (${size})`,
  shareTelegram: "Ulashish",
  close: "Yopish",
  aboutAuthor: "Muallif haqida",
  profilePage: "Profil sahifasi",
  otherArticles: "Muallifning boshqa maqolalari",
  notFound: "Maqola topilmadi",
};

export const articleViewText: Record<Lang, typeof uz> = {
  uz,
  ru: {
    preview: "Предварительный просмотр. Страница станет общедоступной только после одобрения университетом.",
    kind: "Научная статья.",
    postedOnSite: "Размещено на сайте",
    published: "Опубликовано",
    notPublished: "Ещё не опубликовано.",
    place: (issueNo, issueSeq) => (issueSeq ? `Выпуск ${issueNo}, статья ${issueSeq}` : `Выпуск ${issueNo}`),
    license: "Лицензия",
    licenses: { "all-rights-reserved": "Все права защищены" },
    venues: { journal: "Журнал", conference: "Сборник конференции" },
    openPdf: (size) => `Открыть PDF (${size})`,
    shareTelegram: "Поделиться",
    close: "Закрыть",
    aboutAuthor: "Об авторе",
    profilePage: "Страница автора",
    otherArticles: "Другие статьи автора",
    notFound: "Статья не найдена",
  },
  en: {
    preview: "Preview. The page goes public only after the university approves it.",
    kind: "Research article.",
    postedOnSite: "Posted on the site",
    published: "Published",
    notPublished: "Not yet published.",
    place: (issueNo, issueSeq) => (issueSeq ? `Issue ${issueNo}, article ${issueSeq}` : `Issue ${issueNo}`),
    license: "License",
    licenses: { "all-rights-reserved": "All rights reserved" },
    venues: { journal: "Journal", conference: "Conference proceedings" },
    openPdf: (size) => `Open PDF (${size})`,
    shareTelegram: "Share",
    close: "Close",
    aboutAuthor: "About the author",
    profilePage: "Author page",
    otherArticles: "More by this author",
    notFound: "Article not found",
  },
};
