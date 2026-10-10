import { formatNumber } from "./format";
import { TableFrame, numeric, th } from "./table";

// Brend oilasidagi juftlik: lapis-ko‘k (yuborilgan) va tile-moviy (chop etilgan — holat belgisidagi rang bilan bir xil).
// Yorug‘ va qorong‘i rejim uchun alohida qadamlar; dataviz validate_palette.js bilan tekshirilgan: sahifa foni (mist)
// va oq fonda kontrast >= 3:1, rang ko‘rmaslik (deutan ΔE 18 / 16) va oddiy ko‘zda ajralish — hammasi o‘tgan
const COLORS = ["bg-[#3b5fc4] dark:bg-[#4f78dc]", "bg-[#009690] dark:bg-[#0f9a8a]"] as const;

export type ChartPoint = {
  key: string;
  /** o‘q ostidagi qisqa yozuv */
  label: string;
  /** maslahat oynasi va jadval uchun to‘liq nom */
  title: string;
  values: number[];
};

/** 0 dan yuqoriga "toza" bo‘linmalar (1, 2, 5, 10, 20…) — faqat butun sonli hisoblar uchun */
function scaleTicks(max: number): number[] {
  const rough = Math.max(max, 1) / 4;
  const power = 10 ** Math.floor(Math.log10(rough));
  const step = Math.max(1, [1, 2, 5, 10].map((m) => m * power).find((s) => s >= rough) ?? power * 10);
  const top = Math.max(step, Math.ceil(max / step) * step);
  return Array.from({ length: top / step + 1 }, (_, i) => i * step);
}

/**
 * Ustunli diagramma: kutubxonasiz, serverda HTML/CSS. Rasm qismi ekran o‘quvchidan yashirilgan —
 * qiymatlar "Jadval ko‘rinishi"da (klaviatura va ekran o‘quvchi uchun), sichqonchada esa maslahat oynasida.
 * labelEvery — o‘q yozuvlari har N-ustunda, oxirgisidan (bugun / joriy oy) boshlab sanaladi.
 * totals — davr bo‘yicha jami, legendada nom yonida ("Yuborilgan 8"); berilsa legenda bitta qatorda ham ko‘rinadi.
 */
export function BarChart({
  series,
  points,
  tableLabel,
  labelEvery = 1,
  totals,
}: {
  series: string[];
  points: ChartPoint[];
  tableLabel: string;
  labelEvery?: number;
  totals?: number[];
}) {
  const max = Math.max(0, ...points.flatMap((p) => p.values));
  const ticks = scaleTicks(max);
  const top = ticks[ticks.length - 1];
  const pct = (value: number) => `${(value / top) * 100}%`;
  const last = points.length - 1;
  // Chetdagi ustunlarning maslahat oynasi diagramma chegarasidan chiqib ketmasin
  const align = (i: number) =>
    i < points.length / 3 ? "left-0" : i > (points.length * 2) / 3 ? "right-0" : "left-1/2 -translate-x-1/2";

  return (
    <div className="mt-4">
      {(series.length > 1 || totals) && (
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
          {series.map((name, s) => (
            <li key={name} className="flex items-center gap-2">
              <span aria-hidden="true" className={`size-3 rounded-sm ${COLORS[s]}`} />
              {name}
              {totals && <span className="font-semibold tabular-nums">{formatNumber(totals[s])}</span>}
            </li>
          ))}
        </ul>
      )}

      <div aria-hidden="true" className="mt-5 grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 text-xs text-muted">
        <div className="relative tabular-nums">
          {/* Ustun kengligi eng uzun yozuvga teng bo‘lsin */}
          <span className="invisible">{formatNumber(top)}</span>
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 translate-y-1/2" style={{ bottom: pct(t) }}>
              {formatNumber(t)}
            </span>
          ))}
        </div>

        <div className="relative h-40">
          {ticks.map((t) => (
            <div
              key={t}
              className={`absolute inset-x-0 border-t ${t === 0 ? "border-muted/50" : "border-line"}`}
              style={{ bottom: pct(t) }}
            />
          ))}
          {max === 0 && <p className="absolute inset-0 grid place-items-center text-sm">Bu davrda ma’lumot yo‘q</p>}
          <div className="absolute inset-0 flex">
            {points.map((p, i) => (
              <div
                key={p.key}
                className={`group relative flex h-full flex-1 items-end justify-center gap-0.5 hover:bg-ink/5 ${series.length > 1 ? "px-1" : "px-px"}`}
              >
                {p.values.map((value, s) => (
                  <div
                    key={series[s]}
                    className={`w-full max-w-6 rounded-t ${COLORS[s]}`}
                    style={{ height: value > 0 ? `max(2px, ${pct(value)})` : 0 }}
                  />
                ))}
                <div
                  className={`pointer-events-none invisible absolute bottom-full z-10 mb-2 whitespace-nowrap rounded-lg border border-line bg-paper px-3 py-2 text-xs text-ink shadow-md group-hover:visible ${align(i)}`}
                >
                  <p className="text-muted">{p.title}</p>
                  {p.values.map((value, s) => (
                    <p key={series[s]} className="mt-1 flex items-center gap-2">
                      <span className={`h-0.5 w-3 rounded-full ${COLORS[s]}`} />
                      <strong className="font-semibold tabular-nums">{formatNumber(value)}</strong>
                      <span className="text-muted">{series[s]}</span>
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div />
        <div className="flex">
          {points.map((p, i) => (
            <div key={p.key} className="relative h-6 flex-1">
              {/* Chetdagi yozuv grafik chegarasidan chiqmasin: oxirgisi o‘ng chetga tekislanadi */}
              {(last - i) % labelEvery === 0 && (
                <span
                  className={`absolute top-1.5 whitespace-nowrap ${i === last ? "right-0" : "left-1/2 -translate-x-1/2"}`}
                >
                  {p.label}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <details className="mt-2 text-sm">
        <summary className="w-fit cursor-pointer py-1 text-muted hover:text-ink">Jadval ko‘rinishi</summary>
        <TableFrame label={tableLabel} minWidth="min-w-0">
          <thead>
            <tr>
              <th scope="col" className={th}>
                Davr
              </th>
              {series.map((name) => (
                <th key={name} scope="col" className={`${th} ${numeric}`}>
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.key}>
                <th scope="row" className="border-b border-line px-4 py-1.5 font-normal">
                  {p.title}
                </th>
                {p.values.map((value, s) => (
                  <td key={series[s]} className={`border-b border-line px-4 py-1.5 ${numeric}`}>
                    {formatNumber(value)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </TableFrame>
      </details>
    </div>
  );
}
