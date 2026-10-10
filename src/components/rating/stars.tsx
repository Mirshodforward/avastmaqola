// Tekis yulduz, 24×24, bitta rang. Yonmagan yulduz — faqat chiziq (--input-border: fonda 3:1), yongani — lapis bilan to‘la:
// farq rangda emas, shaklda (to‘la yoki bo‘sh), shuning uchun yuqori kontrast rejimida ham ajraladi.
// Chiziq har qanday o‘lchamda 1,5px (non-scaling-stroke): 14px yulduzda ham ingichkalashib xiralashmaydi
const STAR = "M12 1.5L14.7 8.78L22.46 9.1L16.38 13.92L18.47 21.4L12 17.1L5.53 21.4L7.62 13.92L1.54 9.1L9.3 8.78Z";

/** Bitta yulduz. Rangi — currentColor; lit=false — bo‘sh (faqat chiziq) */
export function StarShape({ lit = true, className = "" }: { lit?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className}>
      <path
        d={STAR}
        fill={lit ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/**
 * 5 yulduz, kasr qismi qisman bo‘yaladi (4,3 → to‘rtta to‘liq va uchdan bir). O‘lcham — shrift o‘lchami (1em).
 * Raqamli qiymat yonida matn bilan yoziladi yoki label orqali o‘qiladi — yulduzlarning o‘zi qo‘shimcha belgi.
 */
export function Stars({
  value,
  label,
  className = "",
}: {
  value: number;
  label?: string;
  /** Eski API (to‘q va oq variantlar): endi bitta ko‘rinish, qiymat e’tiborga olinmaydi */
  tone?: "sky" | "paper";
  className?: string;
}) {
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`inline-flex shrink-0 gap-[0.125em] align-[-0.125em] ${className}`}
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const part = Math.min(1, Math.max(0, value - i));
        return (
          <span key={i} className="relative size-[1em] text-[var(--input-border)]">
            <StarShape lit={false} className="size-full" />
            {part > 0 && (
              <span className="absolute inset-y-0 left-0 overflow-hidden text-lapis" style={{ width: `${part * 100}%` }}>
                <StarShape className="size-[1em]" />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
