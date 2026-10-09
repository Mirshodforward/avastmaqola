// Manba: src/app/(auth)/layout.tsx, src/app/(auth)/login/page.tsx, src/app/(auth)/register/page.tsx, src/components/auth/login-form.tsx, src/components/auth/register-form.tsx, src/components/auth/telegram-verify.tsx, src/components/auth/logout-button.tsx
import type { Lang } from "@/lib/langs";
import { enPlural, ruPlural } from "./plural";

const uz = {
  authLayout: {
    // (auth)/layout.tsx
    home: "Bosh sahifa",
  },
  loginPage: {
    // (auth)/login/page.tsx
    metaTitle: "Kirish",
  },
  registerPage: {
    // (auth)/register/page.tsx
    metaTitle: "Ro‘yxatdan o‘tish",
  },
  loginForm: {
    // login-form.tsx
    phoneInvalid: "Raqamni +998901234567 ko‘rinishida kiriting",
    title: "Kirish",
    lead: "Tasdiqlash kodi Telegram botimizdan keladi.",
    phoneLabel: "Telefon raqam",
    sending: "Yuborilmoqda…",
    getCode: "Kodni olish",
    noAccount: "Hali ro‘yxatdan o‘tmaganmisiz?",
    registerLink: "Ro‘yxatdan o‘ting",
  },
  registerForm: {
    // register-form.tsx
    // checkName() natijalari: ruschada rod va kelishik farq qiladi, shuning uchun har maydonga to‘liq jumla
    firstNameRequired: "Ismni kiriting",
    lastNameRequired: "Familiyani kiriting",
    firstNameLettersOnly: "Ismda faqat harflar bo‘lishi kerak",
    lastNameLettersOnly: "Familiyada faqat harflar bo‘lishi kerak",
    phoneInvalid: "Raqamni +998901234567 ko‘rinishida kiriting",
    title: "Ro‘yxatdan o‘tish",
    lead: "Parol kerak emas. Kod telefon raqamingiz ulangan Telegram akkauntga keladi.",
    firstNameLabel: "Ism",
    lastNameLabel: "Familiya",
    phoneLabel: "Telefon raqam",
    checking: "Tekshirilmoqda…",
    submit: "Ro‘yxatdan o‘tish",
    hasAccount: "Akkauntingiz bormi?",
    loginLink: "Kirish",
  },
  telegramVerify: {
    // telegram-verify.tsx
    // STATUS_TEXT: kalitlar FlowStatus qiymatlari
    status: {
      pending: "Bot ochilishini kutyapmiz…",
      awaiting_contact: "Bot ochildi. Endi Telegram’da kontaktingizni yuboring.",
      code_sent: "Raqam tasdiqlandi, kod Telegram’ga yuborildi.",
      verified: "Tasdiqlandi.",
      failed: "Urinishlar tugadi.",
      expired: "Tasdiqlash muddati tugadi.",
    },
    wrongCodeAttempts: (message: string, attemptsLeft: number) => `${message} Yana ${attemptsLeft} ta urinish qoldi.`,
    checking: "Tekshirilmoqda…",
    codeExpired: "Kod eskirdi.",
    title: "Raqamni tasdiqlang",
    restart: "Qaytadan boshlash",
    codeLabel: "Tasdiqlash kodi",
    waitingForCode: "Kod kelishini kutyapmiz…",
    // #otp-status qatori: oxiridagi bo‘sh joy manbadagidek
    codeExpiredLine: "Kod eskirdi. ",
    codeNotReceived: "Kod kelmadimi? ",
    // time — "1:59" ko‘rinishida
    codeValidFor: (time: string) => `Kod ${time} amal qiladi`,
    resend: "Kodni qayta yuborish",
    getCode: "Kodni olish",
    changeNumber: "Raqamni o‘zgartirish",
  },
  logoutButton: {
    // logout-button.tsx
    signingOut: "Chiqilmoqda…",
    signOut: "Chiqish",
  },
};

export const authText: Record<Lang, typeof uz> = {
  uz,
  ru: {
    authLayout: {
      home: "Главная",
    },
    loginPage: {
      metaTitle: "Вход",
    },
    registerPage: {
      metaTitle: "Регистрация",
    },
    loginForm: {
      phoneInvalid: "Введите номер в формате +998901234567",
      title: "Вход",
      lead: "Код подтверждения придёт от нашего Telegram-бота.",
      phoneLabel: "Номер телефона",
      sending: "Отправка…",
      getCode: "Получить код",
      noAccount: "Ещё не зарегистрированы?",
      registerLink: "Зарегистрируйтесь",
    },
    registerForm: {
      firstNameRequired: "Введите имя",
      lastNameRequired: "Введите фамилию",
      firstNameLettersOnly: "Имя должно содержать только буквы",
      lastNameLettersOnly: "Фамилия должна содержать только буквы",
      phoneInvalid: "Введите номер в формате +998901234567",
      title: "Регистрация",
      lead: "Пароль не нужен. Код придёт в Telegram-аккаунт, привязанный к вашему номеру.",
      firstNameLabel: "Имя",
      lastNameLabel: "Фамилия",
      phoneLabel: "Номер телефона",
      checking: "Проверка…",
      submit: "Зарегистрироваться",
      hasAccount: "Уже есть аккаунт?",
      loginLink: "Войти",
    },
    telegramVerify: {
      status: {
        pending: "Ждём открытия бота…",
        awaiting_contact: "Бот открыт. Теперь отправьте контакт в Telegram.",
        code_sent: "Номер подтверждён, код отправлен в Telegram.",
        verified: "Подтверждено.",
        failed: "Попытки закончились.",
        expired: "Время на подтверждение истекло.",
      },
      wrongCodeAttempts: (message, attemptsLeft) =>
        `${message} ${ruPlural(attemptsLeft, ["Осталась", "Осталось", "Осталось"])} ${attemptsLeft} ` +
        `${ruPlural(attemptsLeft, ["попытка", "попытки", "попыток"])}.`,
      checking: "Проверка…",
      codeExpired: "Код устарел.",
      title: "Подтвердите номер",
      restart: "Начать заново",
      codeLabel: "Код подтверждения",
      waitingForCode: "Ждём код…",
      codeExpiredLine: "Код устарел. ",
      codeNotReceived: "Код не пришёл? ",
      codeValidFor: (time) => `Код действует ещё ${time}`,
      resend: "Отправить код ещё раз",
      getCode: "Получить код",
      changeNumber: "Изменить номер",
    },
    logoutButton: {
      signingOut: "Выход…",
      signOut: "Выйти",
    },
  },
  en: {
    authLayout: {
      home: "Home",
    },
    loginPage: {
      metaTitle: "Sign in",
    },
    registerPage: {
      metaTitle: "Sign up",
    },
    loginForm: {
      phoneInvalid: "Enter the number in the format +998901234567",
      title: "Sign in",
      lead: "The verification code is sent by our Telegram bot.",
      phoneLabel: "Phone number",
      sending: "Sending…",
      getCode: "Get code",
      noAccount: "Not registered yet?",
      registerLink: "Sign up",
    },
    registerForm: {
      firstNameRequired: "Enter your first name",
      lastNameRequired: "Enter your last name",
      firstNameLettersOnly: "First name must contain only letters",
      lastNameLettersOnly: "Last name must contain only letters",
      phoneInvalid: "Enter the number in the format +998901234567",
      title: "Sign up",
      lead: "No password needed. The code is sent to the Telegram account linked to your phone number.",
      firstNameLabel: "First name",
      lastNameLabel: "Last name",
      phoneLabel: "Phone number",
      checking: "Checking…",
      submit: "Sign up",
      hasAccount: "Already have an account?",
      loginLink: "Sign in",
    },
    telegramVerify: {
      status: {
        pending: "Waiting for the bot to open…",
        awaiting_contact: "Bot opened. Now share your contact in Telegram.",
        code_sent: "Number verified, code sent to Telegram.",
        verified: "Verified.",
        failed: "No attempts left.",
        expired: "Verification time has expired.",
      },
      wrongCodeAttempts: (message, attemptsLeft) =>
        `${message} ${attemptsLeft} ${enPlural(attemptsLeft, "attempt", "attempts")} left.`,
      checking: "Checking…",
      codeExpired: "Code expired.",
      title: "Verify your number",
      restart: "Start over",
      codeLabel: "Verification code",
      waitingForCode: "Waiting for the code…",
      codeExpiredLine: "Code expired. ",
      codeNotReceived: "Didn’t get the code? ",
      codeValidFor: (time) => `Code expires in ${time}`,
      resend: "Resend code",
      getCode: "Get code",
      changeNumber: "Change number",
    },
    logoutButton: {
      signingOut: "Signing out…",
      signOut: "Sign out",
    },
  },
};
