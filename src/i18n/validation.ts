// Manba: src/server/auth/schemas.ts, src/server/profiles/schemas.ts, src/server/articles/schemas.ts
import type { Lang } from "@/lib/langs";
import { enPlural, ruPlural } from "./plural";

const uz = {
  // profiles/schemas.ts, articles/schemas.ts
  maxChars: (max: number) => `Ko‘pi bilan ${max} ta belgi`,
  maxKeywords: (max: number) => `Ko‘pi bilan ${max} ta kalit so‘z`,
  // auth/schemas.ts
  auth: {
    firstNameRequired: "Ismni kiriting",
    firstNameTooLong: "Ism juda uzun",
    firstNameLettersOnly: "Ismda faqat harflar bo‘lishi kerak",
    lastNameRequired: "Familiyani kiriting",
    lastNameTooLong: "Familiya juda uzun",
    lastNameLettersOnly: "Familiyada faqat harflar bo‘lishi kerak",
    phoneFormat: "Raqamni +998901234567 ko‘rinishida kiriting",
    codeFormat: "6 xonali kodni kiriting",
  },
  // profiles/schemas.ts
  profile: {
    patronymicLettersOnly: "Faqat harflar bo‘lishi kerak",
    positionRequired: "Lavozimni kiriting",
    institutionRequired: "Muassasani kiriting",
    directionRequired: "Yo‘nalishni kiriting",
    keywordMaxChars: (max: number) => `Har bir kalit so‘z ko‘pi bilan ${max} belgi`,
    orcidInvalid: "ORCID iD noto‘g‘ri. U 0000-0000-0000-0000 ko‘rinishida bo‘ladi",
    scholarUrlInvalid: "Google Scholar profil havolasini kiriting (scholar.google.com/citations?user=…)",
    scopusIdInvalid: "Scopus Author ID 10–11 xonali raqam",
  },
  // articles/schemas.ts
  article: {
    keywordMaxChars: (max: number) => `Kalit so‘z ko‘pi bilan ${max} belgi`,
    givenNameRequired: "Ismni kiriting",
    familyNameRequired: "Familiyani kiriting",
    nameLettersOnly: "Faqat harflar",
    tooLong: "Juda uzun",
    orcidInvalid: "ORCID iD noto‘g‘ri",
    yearFormat: "Yilni to‘rt raqam bilan yozing",
    yearInvalid: "Yil noto‘g‘ri",
    doiInvalid: "DOI noto‘g‘ri. Masalan: 10.1117/12.3110012",
    authorsRequired: "Kamida bitta muallif kerak",
    maxAuthors: (max: number) => `Ko‘pi bilan ${max} ta muallif`,
    selfAuthorRequired: "Mualliflardan biri siz bo‘lishingiz kerak",
  },
};

export const validationText: Record<Lang, typeof uz> = {
  uz,
  ru: {
    maxChars: (max) => `Не более ${max} ${ruPlural(max, ["символа", "символов", "символов"])}`,
    maxKeywords: (max) => `Не более ${max} ${ruPlural(max, ["ключевого слова", "ключевых слов", "ключевых слов"])}`,
    auth: {
      firstNameRequired: "Введите имя",
      firstNameTooLong: "Имя слишком длинное",
      firstNameLettersOnly: "Имя должно содержать только буквы",
      lastNameRequired: "Введите фамилию",
      lastNameTooLong: "Фамилия слишком длинная",
      lastNameLettersOnly: "Фамилия должна содержать только буквы",
      phoneFormat: "Введите номер в формате +998901234567",
      codeFormat: "Введите 6-значный код",
    },
    profile: {
      patronymicLettersOnly: "Допускаются только буквы",
      positionRequired: "Укажите должность",
      institutionRequired: "Укажите учреждение",
      directionRequired: "Укажите научное направление",
      keywordMaxChars: (max) =>
        `Каждое ключевое слово — не более ${max} ${ruPlural(max, ["символа", "символов", "символов"])}`,
      orcidInvalid: "Неверный ORCID iD. Формат: 0000-0000-0000-0000",
      scholarUrlInvalid: "Введите ссылку на профиль Google Scholar (scholar.google.com/citations?user=…)",
      scopusIdInvalid: "Scopus Author ID — число из 10–11 цифр",
    },
    article: {
      keywordMaxChars: (max) => `Ключевое слово — не более ${max} ${ruPlural(max, ["символа", "символов", "символов"])}`,
      givenNameRequired: "Введите имя",
      familyNameRequired: "Введите фамилию",
      nameLettersOnly: "Только буквы",
      tooLong: "Слишком длинно",
      orcidInvalid: "Неверный ORCID iD",
      yearFormat: "Укажите год четырьмя цифрами",
      yearInvalid: "Неверный год",
      doiInvalid: "Неверный DOI. Пример: 10.1117/12.3110012",
      authorsRequired: "Нужен хотя бы один автор",
      maxAuthors: (max) => `Не более ${max} ${ruPlural(max, ["автора", "авторов", "авторов"])}`,
      selfAuthorRequired: "Вы должны быть одним из авторов",
    },
  },
  en: {
    maxChars: (max) => `At most ${max} ${enPlural(max, "character", "characters")}`,
    maxKeywords: (max) => `At most ${max} ${enPlural(max, "keyword", "keywords")}`,
    auth: {
      firstNameRequired: "Enter your first name",
      firstNameTooLong: "First name is too long",
      firstNameLettersOnly: "First name must contain only letters",
      lastNameRequired: "Enter your last name",
      lastNameTooLong: "Last name is too long",
      lastNameLettersOnly: "Last name must contain only letters",
      phoneFormat: "Enter the number in the format +998901234567",
      codeFormat: "Enter the 6-digit code",
    },
    profile: {
      patronymicLettersOnly: "Only letters are allowed",
      positionRequired: "Enter your position",
      institutionRequired: "Enter your institution",
      directionRequired: "Enter your research field",
      keywordMaxChars: (max) => `Each keyword must be at most ${max} ${enPlural(max, "character", "characters")}`,
      orcidInvalid: "Invalid ORCID iD. Format: 0000-0000-0000-0000",
      scholarUrlInvalid: "Enter your Google Scholar profile link (scholar.google.com/citations?user=…)",
      scopusIdInvalid: "Scopus Author ID is a 10–11 digit number",
    },
    article: {
      keywordMaxChars: (max) => `Keyword must be at most ${max} ${enPlural(max, "character", "characters")}`,
      givenNameRequired: "Enter the first name",
      familyNameRequired: "Enter the last name",
      nameLettersOnly: "Letters only",
      tooLong: "Too long",
      orcidInvalid: "Invalid ORCID iD",
      yearFormat: "Enter the year as four digits",
      yearInvalid: "Invalid year",
      doiInvalid: "Invalid DOI. Example: 10.1117/12.3110012",
      authorsRequired: "At least one author is required",
      maxAuthors: (max) => `At most ${max} ${enPlural(max, "author", "authors")}`,
      selfAuthorRequired: "You must be one of the authors",
    },
  },
};
