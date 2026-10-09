// Manba: src/server/telegram/messages.ts, src/app/api/articles/[id]/submit/route.ts, src/app/api/admin/articles/[id]/review/route.ts
import type { Lang } from "@/lib/langs";
import { enPlural, ruPlural } from "./plural";

const uz = {
  messages: {
    // messages.ts (bot.ts o‘z matnisiz, shulardan foydalanadi)
    contactButton: "📱 Kontaktni yuborish",
    welcome:
      "Assalomu alaykum! Bu Avtomaqola saytining boti.\n\n" +
      "Ro‘yxatdan o‘tish yoki kirish uchun saytdagi «Kodni olish» tugmasini bosing — " +
      "shunda bot telefon raqamingizni tasdiqlashni so‘raydi.",
    help:
      "Kod olish uchun saytdagi «Kodni olish» tugmasini bosing, " +
      "so‘ng shu yerda «📱 Kontaktni yuborish» tugmasini bosing.",
    linkInvalid: "Havola eskirgan yoki noto‘g‘ri. Saytga qaytib, jarayonni qaytadan boshlang.",
    codeWait: (seconds: number) =>
      `Kod yaqinda yuborildi. Yangisini ${seconds} soniyadan keyin olishingiz mumkin — ` +
      "oldingi kod hali amal qilsa, o‘shani saytda kiriting.",
    codesExhausted: "Bu urinish uchun kodlar limiti tugadi. Saytda jarayonni qaytadan boshlang.",
    notOwnContact: "Faqat o‘zingizning raqamingizni pastdagi «📱 Kontaktni yuborish» tugmasi orqali yuboring.",
    noFlow: "Faol so‘rov topilmadi. Saytda «Ro‘yxatdan o‘tish» yoki «Kirish» tugmasini qaytadan bosing.",
    phoneMismatch:
      "Bu Telegram akkaunt raqami saytda kiritilgan raqamga mos kelmadi. " +
      "Saytda kiritgan raqamingiz ulangan Telegram akkauntdan foydalaning.",
    telegramTaken: "Bu Telegram akkaunt boshqa foydalanuvchi profiliga bog‘langan.",
    accountRelinked:
      "Avtomaqola profilingiz boshqa Telegram akkauntga ko‘chirildi. " +
      "Agar buni siz qilmagan bo‘lsangiz, darhol administratorga murojaat qiling.",
    // askContact(): purpose bo‘yicha
    askContact: {
      register:
        "Avtomaqola saytida ro‘yxatdan o‘tish uchun telefon raqamingizni tasdiqlang.\n\n" +
        "Pastdagi «📱 Kontaktni yuborish» tugmasini bosing.",
      login:
        "Avtomaqola saytida kirish uchun telefon raqamingizni tasdiqlang.\n\n" +
        "Pastdagi «📱 Kontaktni yuborish» tugmasini bosing.",
    },
    contactPlaceholder: "Kontaktni yuboring",
    // sendCode(): parse_mode HTML; minutes = AUTH.codeTtlSeconds / 60
    codeMessage: (code: string, minutes: number) =>
      `Tasdiqlash kodi: <code>${code}</code>\n\n` +
      `Kod ${minutes} daqiqa amal qiladi. Uni saytdagi maydonga kiriting.\n` +
      "Kodni hech kimga bermang — Avtomaqola xodimlari uni hech qachon so‘ramaydi.\n" +
      "Saytga kirishni siz boshlamagan bo‘lsangiz, bu xabarga e’tibor bermang.",
  },
  submitRoute: {
    // api/articles/[id]/submit/route.ts — adminlarga; author = "Ism Familiya"
    newArticle: (id: number, title: string, author: string, url: string) =>
      `Yangi maqola ko‘rib chiqishni kutmoqda: №${id} «${title}» — ${author}.\n${url}`,
  },
  reviewRoute: {
    // api/admin/articles/[id]/review/route.ts — o‘qituvchiga; kalitlar ReviewAction
    approve: (title: string, note: string, url: string) =>
      `Maqolangiz chop etildi: «${title}».${note ? `\nIzoh: ${note}` : ""}\n${url}`,
    reject: (title: string, note: string, url: string) =>
      `Maqolangiz bekor qilindi, tuzatib qayta yuboring: «${title}».\nIzoh: ${note}\n${url}`,
    unpublish: (title: string, note: string, url: string) =>
      `Maqolangiz saytdan vaqtincha olib tashlandi: «${title}».\nSabab: ${note}\n${url}`,
  },
};

export const telegramText: Record<Lang, typeof uz> = {
  uz,
  ru: {
    messages: {
      contactButton: "📱 Отправить контакт",
      welcome:
        "Здравствуйте! Это бот сайта Avtomaqola.\n\n" +
        "Чтобы зарегистрироваться или войти, нажмите на сайте кнопку «Получить код» — " +
        "бот попросит подтвердить номер телефона.",
      help:
        "Чтобы получить код, нажмите на сайте кнопку «Получить код», " +
        "затем здесь — кнопку «📱 Отправить контакт».",
      linkInvalid: "Ссылка устарела или неверна. Вернитесь на сайт и начните заново.",
      codeWait: (seconds) =>
        `Код недавно отправлен. Новый можно получить через ${seconds} ${ruPlural(seconds, ["секунду", "секунды", "секунд"])} — ` +
        "если прежний код ещё действует, введите его на сайте.",
      codesExhausted: "Лимит кодов для этой попытки исчерпан. Начните заново на сайте.",
      notOwnContact: "Отправьте только свой номер через кнопку «📱 Отправить контакт» внизу.",
      noFlow: "Активный запрос не найден. Снова нажмите на сайте «Регистрация» или «Войти».",
      phoneMismatch:
        "Номер этого Telegram-аккаунта не совпадает с номером, введённым на сайте. " +
        "Используйте Telegram-аккаунт, привязанный к введённому номеру.",
      telegramTaken: "Этот Telegram-аккаунт привязан к профилю другого пользователя.",
      accountRelinked:
        "Ваш профиль Avtomaqola перенесён на другой Telegram-аккаунт. " +
        "Если это сделали не вы, срочно обратитесь к администратору.",
      askContact: {
        register:
          "Подтвердите номер телефона для регистрации на сайте Avtomaqola.\n\n" +
          "Нажмите кнопку «📱 Отправить контакт» внизу.",
        login:
          "Подтвердите номер телефона для входа на сайт Avtomaqola.\n\n" +
          "Нажмите кнопку «📱 Отправить контакт» внизу.",
      },
      contactPlaceholder: "Отправьте контакт",
      codeMessage: (code, minutes) =>
        `Код подтверждения: <code>${code}</code>\n\n` +
        `Код действует ${minutes} ${ruPlural(minutes, ["минуту", "минуты", "минут"])}. Введите его в поле на сайте.\n` +
        "Никому не сообщайте код — сотрудники Avtomaqola никогда его не спрашивают.\n" +
        "Если вы не пытались войти на сайт, проигнорируйте это сообщение.",
    },
    submitRoute: {
      newArticle: (id, title, author, url) => `Новая статья ждёт рассмотрения: №${id} «${title}» — ${author}.\n${url}`,
    },
    reviewRoute: {
      approve: (title, note, url) =>
        `Ваша статья опубликована: «${title}».${note ? `\nКомментарий: ${note}` : ""}\n${url}`,
      reject: (title, note, url) =>
        `Ваша статья отклонена — исправьте и отправьте повторно: «${title}».\nКомментарий: ${note}\n${url}`,
      unpublish: (title, note, url) =>
        `Ваша статья временно снята с сайта: «${title}».\nПричина: ${note}\n${url}`,
    },
  },
  en: {
    messages: {
      contactButton: "📱 Share contact",
      welcome:
        "Hello! This is the Avtomaqola website bot.\n\n" +
        "To sign up or sign in, press “Get code” on the website — " +
        "the bot will then ask you to verify your phone number.",
      help:
        "To get a code, press “Get code” on the website, " +
        "then press “📱 Share contact” here.",
      linkInvalid: "The link is expired or invalid. Go back to the website and start over.",
      codeWait: (seconds) =>
        `A code was sent recently. You can get a new one in ${seconds} ${enPlural(seconds, "second", "seconds")} — ` +
        "if the previous code is still valid, enter it on the website.",
      codesExhausted: "The code limit for this attempt has been reached. Start over on the website.",
      notOwnContact: "Send only your own number, using the “📱 Share contact” button below.",
      noFlow: "No active request found. Press “Sign up” or “Sign in” on the website again.",
      phoneMismatch:
        "This Telegram account’s number doesn’t match the one entered on the website. " +
        "Use the Telegram account linked to the number you entered.",
      telegramTaken: "This Telegram account is linked to another user’s profile.",
      accountRelinked:
        "Your Avtomaqola profile has been moved to another Telegram account. " +
        "If this wasn’t you, contact the administrator right away.",
      askContact: {
        register:
          "Verify your phone number to sign up on the Avtomaqola website.\n\n" +
          "Press the “📱 Share contact” button below.",
        login:
          "Verify your phone number to sign in to the Avtomaqola website.\n\n" +
          "Press the “📱 Share contact” button below.",
      },
      contactPlaceholder: "Share your contact",
      codeMessage: (code, minutes) =>
        `Verification code: <code>${code}</code>\n\n` +
        `The code is valid for ${minutes} ${enPlural(minutes, "minute", "minutes")}. Enter it in the field on the website.\n` +
        "Don’t share the code with anyone — Avtomaqola staff will never ask for it.\n" +
        "If you didn’t try to sign in to the website, ignore this message.",
    },
    submitRoute: {
      newArticle: (id, title, author, url) => `New article awaiting review: #${id} “${title}” — ${author}.\n${url}`,
    },
    reviewRoute: {
      approve: (title, note, url) =>
        `Your article was published: “${title}”.${note ? `\nComment: ${note}` : ""}\n${url}`,
      reject: (title, note, url) =>
        `Your article was rejected — revise and resubmit: “${title}”.\nComment: ${note}\n${url}`,
      unpublish: (title, note, url) =>
        `Your article was temporarily removed from the website: “${title}”.\nReason: ${note}\n${url}`,
    },
  },
};
