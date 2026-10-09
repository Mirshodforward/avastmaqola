// Manba: src/app/maqolalar/page.tsx, src/app/oqituvchi/[slug]/page.tsx, src/app/maqola/[id]/page.tsx,
// src/app/mualliflar/page.tsx, src/app/yonalishlar/page.tsx, src/app/haqida/page.tsx, src/app/yangiliklar/**
import type { Lang } from "@/lib/langs";
import { enPlural, ruPlural } from "./plural";

const uz = {
  listPage: {
    // maqolalar/page.tsx
    title: "Maqolalar",
    description: (university: string) =>
      `${university} o‘qituvchilarining universitet tasdiqlagan ilmiy maqolalari: yillar bo‘yicha to‘liq ro‘yxat.`,
    intro: (university: string) =>
      `${university} o‘qituvchilarining universitet tasdiqlagan ilmiy maqolalari. Yangilari birinchi.`,
    empty: "Hali chop etilgan maqolalar yo‘q.",
    loading: "Yuklanmoqda",
  },
  teacherPage: {
    // oqituvchi/[slug]/page.tsx
    notFound: "Profil topilmadi",
    description: (credentials: string, institution: string, direction: string) =>
      `${credentials}, ${institution}. Ilmiy yo‘nalish: ${direction}.`,
    direction: "Ilmiy yo‘nalish:",
    interests: "Ilmiy qiziqishlar",
    bio: "Biografiya",
    works: "Maqolalar",
    noWorks: "Hali chop etilgan maqolalar yo‘q.",
    updated: "Profil yangilangan:",
    orcidUnverified: "(tasdiqlanmagan)",
  },
  articlePage: {
    // maqola/[id]/page.tsx
    notFound: "Maqola topilmadi",
  },
  authorsPage: {
    // mualliflar/page.tsx
    title: "Mualliflar",
    description: (university: string) => `${university} mualliflari: lavozimi, ilmiy yo‘nalishi va portaldagi maqolalari.`,
    intro: "Portal mualliflarining ochiq profillari. Familiya bo‘yicha tartibda.",
    empty: "Hali ochiq profillar yo‘q.",
    direction: "Ilmiy yo‘nalish:",
    articles: (n: number) => `${n} ta maqola`,
    loading: "Yuklanmoqda",
  },
  directionsPage: {
    // yonalishlar/page.tsx
    title: "Ilmiy yo‘nalishlar",
    description: (university: string) => `${university} ilmiy yo‘nalishlari va har bir yo‘nalishdagi mualliflar.`,
    intro: "Portal mualliflari ilmiy yo‘nalishi bo‘yicha. Maqolasi ko‘p yo‘nalishlar birinchi.",
    empty: "Hali ochiq profillar yo‘q.",
    authors: (n: number) => `${n} ta muallif`,
    articles: (n: number) => `${n} ta maqola`,
    loading: "Yuklanmoqda",
  },
  newsPage: {
    // yangiliklar/page.tsx, yangiliklar/[id]/page.tsx (yangilik matni — kontent, tarjima qilinmaydi)
    title: "Yangiliklar",
    description: (university: string) => `${university} ilmiy maqolalar portali yangiliklari va e’lonlari.`,
    empty: "Hali yangiliklar yo‘q.",
    loading: "Yuklanmoqda",
    back: "← Yangiliklar",
    notFound: "Yangilik topilmadi",
  },
  aboutPage: {
    // haqida/page.tsx
    title: "Portal haqida",
    description: (university: string) =>
      `${university} ilmiy maqolalar portali: maqola qanday joylanadi, ochiq kirish va iqtibos.`,
    intro: (university: string) =>
      `${university} o‘qituvchilari ilmiy maqolalarini shu portalga joylaydi. Universitet tasdiqlagan har bir maqola o‘zbek, rus va ingliz tilidagi annotatsiyasi va PDF fayli bilan alohida sahifada hammaga ochiq.`,
    stepsTitle: "Maqola qanday joylanadi",
    steps: [
      { title: "Profilni to‘ldiring", text: "Rasm, lavozim, ilmiy yo‘nalish va muassasa maqola sahifasining tepasida ko‘rinadi." },
      {
        title: "Maqolani qo‘shing",
        text: "PDF hamda o‘zbek, rus va ingliz tilida sarlavha, annotatsiya va kalit so‘zlar. AI yordamchi ularni PDF asosida to‘ldirib beradi.",
      },
      { title: "Ko‘rib chiqishga yuboring", text: "Universitet xodimi tekshiradi, natija Telegram’ga keladi." },
      { title: "Maqola chop etiladi", text: "Alohida ommaviy sahifa, Google Scholar uchun moslangan." },
    ],
    openTitle: "Ochiq kirish va iqtibos",
    openText:
      "Maqolalar ochiq kirishda (CC BY 4.0): muallifni ko‘rsatgan holda o‘qish va tarqatish mumkin. Har bir sahifada Google Scholar uchun meta teglar va tayyor iqtibos (APA, BibTeX) bor. O‘qituvchi profiliga ORCID iD va Google Scholar profili bog‘lanadi.",
    authorsTitle: "Mualliflarga",
    authorsText: (university: string) =>
      `Portalga ${university} mualliflari maqola joylaydi. Parol kerak emas: tasdiqlash kodi Telegram orqali keladi.`,
    register: "Ro‘yxatdan o‘tish",
    login: "Kirish",
  },
};

export const publicText: Record<Lang, typeof uz> = {
  uz,
  ru: {
    listPage: {
      title: "Статьи",
      description: (university) =>
        `Одобренные университетом научные статьи преподавателей ${university}: полный список по годам.`,
      intro: (university) => `Одобренные университетом научные статьи преподавателей ${university}. Сначала новые.`,
      empty: "Опубликованных статей пока нет.",
      loading: "Загрузка",
    },
    teacherPage: {
      notFound: "Профиль не найден",
      description: (credentials, institution, direction) =>
        `${credentials}, ${institution}. Научное направление: ${direction}.`,
      direction: "Научное направление:",
      interests: "Научные интересы",
      bio: "Биография",
      works: "Статьи",
      noWorks: "Опубликованных статей пока нет.",
      updated: "Профиль обновлён:",
      orcidUnverified: "(не подтверждён)",
    },
    articlePage: { notFound: "Статья не найдена" },
    authorsPage: {
      title: "Авторы",
      description: (university) => `Авторы ${university}: должность, научное направление и статьи на портале.`,
      intro: "Открытые профили авторов портала. По фамилии.",
      empty: "Открытых профилей пока нет.",
      direction: "Научное направление:",
      articles: (n) => `${n} ${ruPlural(n, ["статья", "статьи", "статей"])}`,
      loading: "Загрузка",
    },
    directionsPage: {
      title: "Научные направления",
      description: (university) => `Научные направления ${university} и авторы по каждому направлению.`,
      intro: "Авторы портала по научным направлениям. Сначала направления с наибольшим числом статей.",
      empty: "Открытых профилей пока нет.",
      authors: (n) => `${n} ${ruPlural(n, ["автор", "автора", "авторов"])}`,
      articles: (n) => `${n} ${ruPlural(n, ["статья", "статьи", "статей"])}`,
      loading: "Загрузка",
    },
    newsPage: {
      title: "Новости",
      description: (university) => `Новости и объявления портала научных статей ${university}.`,
      empty: "Новостей пока нет.",
      loading: "Загрузка",
      back: "← Новости",
      notFound: "Новость не найдена",
    },
    aboutPage: {
      title: "О портале",
      description: (university) =>
        `Портал научных статей ${university}: как размещается статья, открытый доступ и цитирование.`,
      intro: (university) =>
        `Преподаватели ${university} размещают свои научные статьи на этом портале. Каждая одобренная университетом статья открыта для всех на отдельной странице с аннотацией на узбекском, русском и английском языках и PDF-файлом.`,
      stepsTitle: "Как размещается статья",
      steps: [
        { title: "Заполните профиль", text: "Фото, должность, научное направление и учреждение показываются вверху страницы статьи." },
        {
          title: "Добавьте статью",
          text: "PDF, а также название, аннотация и ключевые слова на узбекском, русском и английском. ИИ-помощник заполнит их по PDF.",
        },
        { title: "Отправьте на рассмотрение", text: "Сотрудник университета проверит, результат придёт в Telegram." },
        { title: "Статья публикуется", text: "Отдельная открытая страница, адаптированная для Google Scholar." },
      ],
      openTitle: "Открытый доступ и цитирование",
      openText:
        "Статьи в открытом доступе (CC BY 4.0): их можно читать и распространять с указанием автора. На каждой странице есть метатеги для Google Scholar и готовая ссылка для цитирования (APA, BibTeX). К профилю преподавателя привязываются ORCID iD и профиль Google Scholar.",
      authorsTitle: "Авторам",
      authorsText: (university) =>
        `Статьи на портал размещают авторы ${university}. Пароль не нужен: код подтверждения приходит в Telegram.`,
      register: "Регистрация",
      login: "Войти",
    },
  },
  en: {
    listPage: {
      title: "Articles",
      description: (university) => `University-approved research articles by ${university} teachers: full list by year.`,
      intro: (university) => `University-approved research articles by ${university} teachers. Newest first.`,
      empty: "No published articles yet.",
      loading: "Loading",
    },
    teacherPage: {
      notFound: "Profile not found",
      description: (credentials, institution, direction) =>
        `${credentials}, ${institution}. Research field: ${direction}.`,
      direction: "Research field:",
      interests: "Research interests",
      bio: "Biography",
      works: "Articles",
      noWorks: "No published articles yet.",
      updated: "Profile updated:",
      orcidUnverified: "(unverified)",
    },
    articlePage: { notFound: "Article not found" },
    authorsPage: {
      title: "Authors",
      description: (university) => `${university} authors: position, research field and articles on the portal.`,
      intro: "Public profiles of the portal’s authors, sorted by last name.",
      empty: "No public profiles yet.",
      direction: "Research field:",
      articles: (n) => `${n} ${enPlural(n, "article", "articles")}`,
      loading: "Loading",
    },
    directionsPage: {
      title: "Research fields",
      description: (university) => `${university} research fields and the authors in each field.`,
      intro: "Portal authors by research field. Fields with the most articles first.",
      empty: "No public profiles yet.",
      authors: (n) => `${n} ${enPlural(n, "author", "authors")}`,
      articles: (n) => `${n} ${enPlural(n, "article", "articles")}`,
      loading: "Loading",
    },
    newsPage: {
      title: "News",
      description: (university) => `News and announcements from the ${university} research articles portal.`,
      empty: "No news yet.",
      loading: "Loading",
      back: "← News",
      notFound: "News item not found",
    },
    aboutPage: {
      title: "About the portal",
      description: (university) => `${university} research articles portal: how an article is posted, open access and citation.`,
      intro: (university) =>
        `${university} teachers post their research articles on this portal. Every university-approved article is open to everyone on its own page, with abstracts in Uzbek, Russian and English and a PDF file.`,
      stepsTitle: "How an article is posted",
      steps: [
        { title: "Complete your profile", text: "Photo, position, research field and institution appear at the top of the article page." },
        {
          title: "Add the article",
          text: "The PDF plus the title, abstract and keywords in Uzbek, Russian and English. The AI assistant fills them in from the PDF.",
        },
        { title: "Submit for review", text: "A university staff member checks it; the result arrives in Telegram." },
        { title: "The article is published", text: "A separate public page, optimized for Google Scholar." },
      ],
      openTitle: "Open access and citation",
      openText:
        "Articles are open access (CC BY 4.0): they can be read and shared with attribution. Every page has Google Scholar meta tags and a ready citation (APA, BibTeX). A teacher’s profile links to their ORCID iD and Google Scholar profile.",
      authorsTitle: "For authors",
      authorsText: (university) =>
        `Articles are posted by ${university} authors. No password needed: the verification code arrives in Telegram.`,
      register: "Sign up",
      login: "Sign in",
    },
  },
};
