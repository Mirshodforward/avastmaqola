import "server-only";

export type SearchParams = Record<string, string | string[] | undefined>;

export const PAGE_SIZE = 30;

export function textParam(params: SearchParams, key: string, max = 100): string {
  const value = params[key];
  return ((Array.isArray(value) ? value[0] : value) ?? "").trim().slice(0, max);
}

export function pageParam(params: SearchParams): number {
  const page = Number.parseInt(textParam(params, "page", 6), 10);
  return page > 0 ? page : 1;
}

/** Ro‘yxat oxiridan uzoq sahifa so‘ralsa, oxirgi sahifa ko‘rsatiladi */
export function paginate(total: number, page: number) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(page, pages);
  return { pages, page: current, offset: (current - 1) * PAGE_SIZE };
}
