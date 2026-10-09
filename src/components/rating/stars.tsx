import { s } from "./styles";

// Qirrali (3D) yulduz, 24×24: asos currentColor, yorug‘lik chap-yuqoridan — chap qirralar oqroq, o‘ng-pastkilari to‘qroq
const BASE = "M12 1.5L14.7 8.78L22.46 9.1L16.38 13.92L18.47 21.4L12 17.1L5.53 21.4L7.62 13.92L1.54 9.1L9.3 8.78Z";
const LIGHT = "M12 12.5L9.3 8.78L12 1.5ZM12 12.5L14.7 8.78L22.46 9.1ZM12 12.5L1.54 9.1L9.3 8.78ZM12 12.5L5.53 21.4L7.62 13.92Z";
const SHADE = "M12 12.5L12 1.5L14.7 8.78ZM12 12.5L22.46 9.1L16.38 13.92ZM12 12.5L16.38 13.92L18.47 21.4ZM12 12.5L12 17.1L5.53 21.4Z";

/** Bitta yulduz. lit=false — xira shisha yulduz */
export function StarShape({ lit = true }: { lit?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={BASE} fill="currentColor" stroke="currentColor" strokeWidth={1.1} strokeLinejoin="round" />
      <path d={LIGHT} fill="#fff" fillOpacity={lit ? 0.38 : 0.12} />
      <path d={SHADE} fill="#000" fillOpacity={lit ? 0.22 : 0.14} />
    </svg>
  );
}

/**
 * 5 yulduz, kasr qismi qisman bo‘yaladi (4,3 → to‘rtta to‘liq va uchdan bir). O‘lcham — shrift o‘lchami (1em).
 * tone="paper" — oq fondagi variant (maqola tepasidagi havola).
 */
export function Stars({ value, label, tone = "sky", className = "" }: { value: number; label?: string; tone?: "sky" | "paper"; className?: string }) {
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`${s.stars} ${tone === "paper" ? s.paper : ""} ${className}`}
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const part = Math.min(1, Math.max(0, value - i));
        return (
          <span key={i} className={`${s.slot} ${s.off}`}>
            <StarShape lit={false} />
            {part > 0 && (
              <span className={`${s.fill} ${s.on}`} style={{ width: `${part * 100}%` }}>
                <StarShape />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
