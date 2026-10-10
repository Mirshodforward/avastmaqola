// Manba: src/app/not-found.tsx, src/components/not-found-body.tsx
import type { Lang } from "@/lib/langs";

const uz = {
  title: "Sahifa topilmadi",
  home: "Bosh sahifa",
  articles: "Maqolalar",
};

export const notFoundText: Record<Lang, typeof uz> = {
  uz,
  ru: { title: "Страница не найдена", home: "На главную", articles: "Статьи" },
  en: { title: "Page not found", home: "Go to home page", articles: "Articles" },
};
