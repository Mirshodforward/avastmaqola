// Manba: src/app/dashboard/page.tsx
import type { Lang } from "@/lib/langs";

const uz = {
  dashboardPage: {
    // dashboard/page.tsx
    metaTitle: "Kabinet",
    welcome: (firstName: string) => `Xush kelibsiz, ${firstName}!`,
    nextStep: "Keyingi qadam:",
  },
  roadmap: {
    // dashboard/page.tsx — bosqichlar
    title: "Maqolani joylash bosqichlari",
    done: "— bajarildi",
    profile: {
      title: "Profilni to‘ldiring",
      text: "Rasm, lavozim, ilmiy yo‘nalish va muassasa — maqola sahifasining tepasida ko‘rinadi.",
      action: "Profilni to‘ldirish",
    },
    article: {
      title: "Maqola qo‘shing",
      text: "PDF hamda o‘zbek, rus va ingliz tilida sarlavha, annotatsiya va kalit so‘zlar.",
    },
    review: {
      title: "Ko‘rib chiqishga yuboring",
      text: "Universitet xodimi tekshiradi, natija Telegram’ga keladi.",
    },
    publish: {
      title: "Maqola chop etiladi",
      text: "Alohida ommaviy sahifa, Google Scholar uchun moslangan.",
    },
  },
  myArticles: {
    // dashboard/page.tsx — maqolalar bloki
    title: "Maqolalarim",
    emptyTitle: "Hali maqola yo‘q",
    emptyText: "Universitet tasdiqlagach, maqola alohida sahifada hammaga ochiq bo‘ladi.",
    checklist: {
      pdf: "Maqolaning PDF fayli (10 MB gacha)",
      titles: "O‘zbek, rus va ingliz tilida sarlavha",
      abstracts: "Uch tilda annotatsiya (kamida 300 belgi)",
      keywords: "Uch tilda 3–10 ta kalit so‘z",
    },
    meta: (id: number, date: string) => `№${id} · o‘zgartirilgan: ${date}`,
    reviewNote: (note: string) => `Izoh: ${note}`,
  },
  profileCard: {
    // dashboard/page.tsx — profil kartasi
    empty: "Profil hali to‘ldirilmagan",
    phone: "Telefon",
    orcidUnverified: "egalik hali tasdiqlanmagan",
    orcidMissing: "Qo‘shilmagan, profil tahririda kiritiladi",
    edit: "Profilni tahrirlash",
    fill: "Profilni to‘ldirish",
    publicPage: "Ommaviy sahifa",
    required:
      "Maqolani yuborish uchun profil kerak: rasmingiz, ilmiy yo‘nalishingiz va muassasangiz maqola sahifasining tepasida ko‘rinadi.",
  },
};

export const dashboardText: Record<Lang, typeof uz> = {
  uz,
  ru: {
    dashboardPage: {
      metaTitle: "Кабинет",
      welcome: (firstName) => `Добро пожаловать, ${firstName}!`,
      nextStep: "Следующий шаг:",
    },
    roadmap: {
      title: "Этапы размещения статьи",
      done: "— выполнено",
      profile: {
        title: "Заполните профиль",
        text: "Фото, должность, научное направление и учреждение — видны в начале страницы статьи.",
        action: "Заполнить профиль",
      },
      article: {
        title: "Добавьте статью",
        text: "PDF, а также название, аннотация и ключевые слова на узбекском, русском и английском.",
      },
      review: {
        title: "Отправьте на рассмотрение",
        text: "Проверяет сотрудник университета, результат придёт в Telegram.",
      },
      publish: {
        title: "Публикация статьи",
        text: "Отдельная публичная страница, адаптированная для Google Scholar.",
      },
    },
    myArticles: {
      title: "Мои статьи",
      emptyTitle: "Статей пока нет",
      emptyText: "После одобрения университетом статья станет доступна всем на отдельной странице.",
      checklist: {
        pdf: "PDF-файл статьи (до 10 МБ)",
        titles: "Название на узбекском, русском и английском",
        abstracts: "Аннотация на трёх языках (от 300 символов)",
        keywords: "3–10 ключевых слов на трёх языках",
      },
      meta: (id, date) => `№${id} · изменено: ${date}`,
      reviewNote: (note) => `Комментарий: ${note}`,
    },
    profileCard: {
      empty: "Профиль ещё не заполнен",
      phone: "Телефон",
      orcidUnverified: "принадлежность ещё не подтверждена",
      orcidMissing: "Не добавлен, указывается в редакторе профиля",
      edit: "Редактировать профиль",
      fill: "Заполнить профиль",
      publicPage: "Публичная страница",
      required:
        "Чтобы отправить статью, нужен профиль: ваше фото, научное направление и учреждение видны в начале страницы статьи.",
    },
  },
  en: {
    dashboardPage: {
      metaTitle: "Dashboard",
      welcome: (firstName) => `Welcome, ${firstName}!`,
      nextStep: "Next step:",
    },
    roadmap: {
      title: "Steps to post an article",
      done: "— done",
      profile: {
        title: "Complete your profile",
        text: "Photo, position, research field and institution — shown at the top of the article page.",
        action: "Complete profile",
      },
      article: {
        title: "Add an article",
        text: "PDF plus title, abstract and keywords in Uzbek, Russian and English.",
      },
      review: {
        title: "Submit for review",
        text: "A university staff member reviews it; the result is sent to Telegram.",
      },
      publish: {
        title: "Article is published",
        text: "Its own public page, optimized for Google Scholar.",
      },
    },
    myArticles: {
      title: "My articles",
      emptyTitle: "No articles yet",
      emptyText: "Once the university approves it, the article becomes publicly available on its own page.",
      checklist: {
        pdf: "Article PDF (up to 10 MB)",
        titles: "Title in Uzbek, Russian and English",
        abstracts: "Abstract in three languages (at least 300 characters)",
        keywords: "3–10 keywords in three languages",
      },
      meta: (id, date) => `#${id} · updated: ${date}`,
      reviewNote: (note) => `Comment: ${note}`,
    },
    profileCard: {
      empty: "Profile not completed yet",
      phone: "Phone",
      orcidUnverified: "ownership not verified yet",
      orcidMissing: "Not added; enter it in the profile editor",
      edit: "Edit profile",
      fill: "Complete profile",
      publicPage: "Public page",
      required:
        "You need a profile to submit an article: your photo, research field and institution appear at the top of the article page.",
    },
  },
};
