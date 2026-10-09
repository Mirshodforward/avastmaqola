// Son bilan keladigan so‘z shakli. O‘zbekchada shakl o‘zgarmaydi ("5 ta maqola"), ruscha uchta, inglizcha ikkita.
const RU = new Intl.PluralRules("ru");

/** ruPlural(5, ["статья", "статьи", "статей"]) → "статей" */
export function ruPlural(n: number, [one, few, many]: [string, string, string]): string {
  const rule = RU.select(n);
  return rule === "one" ? one : rule === "few" ? few : many;
}

/** enPlural(1, "article", "articles") → "article" */
export const enPlural = (n: number, one: string, other: string): string => (n === 1 ? one : other);
