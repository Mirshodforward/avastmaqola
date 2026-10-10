// Manba: src/app/[lang]/yangiliklar/page.tsx, src/app/[lang]/yangiliklar/[id]/page.tsx (yangilik sarlavhasi va matni —
// admin o‘zbekcha yozadi, tarjima qilinmaydi)
import type { Lang } from "@/lib/langs";

const uz = {
  title: "Yangiliklar",
  description: (university: string) => `${university} ilmiy maqolalar portali yangiliklari va e’lonlari.`,
  empty: "Hali yangiliklar yo‘q.",
  loading: "Yuklanmoqda",
  breadcrumb: "Sahifa yo‘li",
  notFound: "Yangilik topilmadi",
};

export const newsPageText: Record<Lang, typeof uz> = {
  uz,
  ru: {
    title: "Новости",
    description: (university) => `Новости и объявления портала научных статей ${university}.`,
    empty: "Новостей пока нет.",
    loading: "Загрузка",
    breadcrumb: "Навигационная цепочка",
    notFound: "Новость не найдена",
  },
  en: {
    title: "News",
    description: (university) => `News and announcements from the ${university} research articles portal.`,
    empty: "No news yet.",
    loading: "Loading",
    breadcrumb: "Breadcrumb",
    notFound: "News item not found",
  },
};
