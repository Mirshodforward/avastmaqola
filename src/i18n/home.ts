// Manba: src/app/page.tsx, src/components/home/* (header — commonText.publicHeader, footer — commonText.publicFooter,
// bosqichlar — publicText.aboutPage.steps)
import type { Lang } from "@/lib/langs";
import { enPlural, ruPlural } from "./plural";

const uz = {
  homePage: {
    // page.tsx
    login: "Kirish",
    register: "Ro‘yxatdan o‘tish",
    title: (university: string) => `${university} ilmiy maqolalari`,
    lead: (university: string) =>
      `${university} o‘qituvchilari ilmiy maqolalarini shu portalga joylaydi. Universitet tasdiqlagan har bir maqola o‘zbek, rus va ingliz tilidagi annotatsiyasi va PDF fayli bilan alohida sahifada hammaga ochiq bo‘ladi.`,
    noPassword: "Parol kerak emas: tasdiqlash kodi Telegram orqali keladi.",
  },
  stats: {
    // home/stats.tsx
    label: "Portal raqamlarda",
    articles: "Maqolalar",
    authors: "Mualliflar",
    directions: "Ilmiy yo‘nalishlar",
    languages: "Til: o‘zbek, rus, ingliz",
  },
  steps: {
    // home/steps.tsx
    title: "Maqola qanday joylanadi",
    about: "Portal haqida",
  },
  features: {
    // home/anatomy.tsx (tartib sxemadagi 1–6 belgilar bilan bir xil)
    title: "Imkoniyatlar",
    items: [
      { title: "Uch tilda", text: "Sarlavha, annotatsiya va kalit so‘zlar o‘zbek, rus va ingliz tilida." },
      { title: "Muallif profili", text: "Rasm, lavozim, ORCID iD va barcha maqolalar bitta sahifada." },
      { title: "AI yordamchi", text: "PDF asosida sarlavha, annotatsiya va kalit so‘zlarni uch tilda to‘ldiradi." },
      { title: "Ochiq kirish", text: "PDF va annotatsiya hammaga ochiq, CC BY 4.0 litsenziyasi bilan." },
      { title: "Tayyor iqtibos", text: "APA va BibTeX formatida bir bosishda nusxa olinadi." },
      { title: "Google Scholar", text: "Har bir maqola sahifasi Scholar indeksi uchun moslangan." },
    ],
  },
  articles: {
    // home/latest-articles.tsx
    title: "So‘nggi maqolalar",
    all: "Barcha maqolalar",
    issue: (n: number) => `${n}-son`,
    seq: (n: number) => `${n}-maqola`,
  },
  news: {
    // home/latest-news.tsx
    title: "Yangiliklar",
    all: "Barcha yangiliklar",
  },
  authors: {
    // home/authors.tsx
    title: "Mualliflar",
    all: "Barcha mualliflar",
    directions: "Ilmiy yo‘nalishlar",
    articleCount: (n: number) => `${n} ta maqola`,
  },
  cta: {
    // home/cta.tsx
    title: "Maqolangizni portalga joylang",
  },
};

export const homeText: Record<Lang, typeof uz> = {
  uz,
  ru: {
    homePage: {
      login: "Войти",
      register: "Регистрация",
      title: (university) => `Научные статьи ${university}`,
      lead: (university) =>
        `Преподаватели ${university} размещают научные статьи на этом портале. Каждая одобренная университетом статья доступна всем на отдельной странице — с аннотацией на узбекском, русском и английском языках и PDF-файлом.`,
      noPassword: "Пароль не нужен: код подтверждения придёт в Telegram.",
    },
    stats: {
      label: "Портал в цифрах",
      articles: "Статьи",
      authors: "Авторы",
      directions: "Научные направления",
      languages: "Языки: узбекский, русский, английский",
    },
    steps: { title: "Как разместить статью", about: "О портале" },
    features: {
      title: "Возможности",
      items: [
        { title: "На трёх языках", text: "Название, аннотация и ключевые слова на узбекском, русском и английском." },
        { title: "Профиль автора", text: "Фото, должность, ORCID iD и все статьи на одной странице." },
        { title: "ИИ-помощник", text: "Заполняет название, аннотацию и ключевые слова на трёх языках по PDF." },
        { title: "Открытый доступ", text: "PDF и аннотация открыты для всех по лицензии CC BY 4.0." },
        { title: "Готовая ссылка", text: "Ссылка в форматах APA и BibTeX копируется одним нажатием." },
        { title: "Google Scholar", text: "Страница каждой статьи адаптирована для индекса Scholar." },
      ],
    },
    articles: {
      title: "Последние статьи",
      all: "Все статьи",
      issue: (n) => `Выпуск ${n}`,
      seq: (n) => `Статья ${n}`,
    },
    news: { title: "Новости", all: "Все новости" },
    authors: {
      title: "Авторы",
      all: "Все авторы",
      directions: "Научные направления",
      articleCount: (n) => `${n} ${ruPlural(n, ["статья", "статьи", "статей"])}`,
    },
    cta: { title: "Разместите свою статью на портале" },
  },
  en: {
    homePage: {
      login: "Sign in",
      register: "Sign up",
      title: (university) => `Research articles from ${university}`,
      lead: (university) =>
        `${university} teachers post their research articles on this portal. Every article approved by the university becomes openly available on its own page, with abstracts in Uzbek, Russian and English and a PDF file.`,
      noPassword: "No password needed: the verification code is sent via Telegram.",
    },
    stats: {
      label: "The portal in numbers",
      articles: "Articles",
      authors: "Authors",
      directions: "Research fields",
      languages: "Languages: Uzbek, Russian, English",
    },
    steps: { title: "How to post an article", about: "About the portal" },
    features: {
      title: "Features",
      items: [
        { title: "Three languages", text: "Title, abstract and keywords in Uzbek, Russian and English." },
        { title: "Author profile", text: "Photo, position, ORCID iD and all articles on one page." },
        { title: "AI assistant", text: "Fills in the title, abstract and keywords in three languages from the PDF." },
        { title: "Open access", text: "The PDF and abstract are open to everyone under CC BY 4.0." },
        { title: "Ready citation", text: "Copy an APA or BibTeX citation with one click." },
        { title: "Google Scholar", text: "Every article page is optimized for the Scholar index." },
      ],
    },
    articles: {
      title: "Latest articles",
      all: "All articles",
      issue: (n) => `Issue ${n}`,
      seq: (n) => `Article ${n}`,
    },
    news: { title: "News", all: "All news" },
    authors: {
      title: "Authors",
      all: "All authors",
      directions: "Research fields",
      articleCount: (n) => `${n} ${enPlural(n, "article", "articles")}`,
    },
    cta: { title: "Post your article on the portal" },
  },
};
