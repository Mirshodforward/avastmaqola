// Maqola bahosi (1–5 yulduz) va iqtibos qoidalari: forma va API shu yerdan oladi, DB CHECK — holatlar ro‘yxatini
export const RATING_STATUSES = ["pending", "approved", "rejected"] as const;
export type RatingStatus = (typeof RATING_STATUSES)[number];

export const STAR_VALUES = [1, 2, 3, 4, 5] as const;

export const RATING_LIMITS = {
  bodyMin: 10,
  bodyMax: 600,
} as const;
