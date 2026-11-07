"use client";

import { useMemo } from "react";
import type { IndicatorMeta, SeriesPoint } from "@/lib/types";
import { fmtNumber, fmtPeople } from "@/lib/format";

export interface ChartSeries {
  iso3: string;
  name: string;
  points: SeriesPoint[];
}

export const CHART_COLORS = [
  "#b4472e",
  "#d99a2b",
  "#5e6b3f",
  "#2f6f73",
  "#8a5c10",
  "#6a4c93",
];

const W = 760;
const H = 340;
const M = { top: 16, right: 20, bottom: 36, left: 58 };

function formatValue(value: number, meta: IndicatorMeta): string {
  if (meta.id === "pou" && value === 2.5) return "< 2,5 %";
  if (meta.valueType === "count") return fmtPeople(value);
  if (meta.valueType === "percent") return `${fmtNumber(value, 1)} %`;
  if (meta.valueType === "currency") return `${fmtNumber(value, 0)} USD`;
  return fmtNumber(value, meta.decimals);
}

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

/**
 * Gráfico de líneas propio (SVG) para comparar países.
 * No conecta observaciones separadas por más de un año: un hueco en la serie
 * se muestra como hueco, no como una tendencia inventada.
 */
export default function MultiCountryChart({
  series,
  meta,
}: {
  series: ChartSeries[];
  meta: IndicatorMeta;
}) {
  const years = series.flatMap((s) => s.points.map((p) => p[0]));
  const minYear = years.length ? Math.min(...years) : 2000;
  const maxYear = years.length ? Math.max(...years) : new Date().getFullYear();
  const maxValue = series.flatMap((s) => s.points.map((p) => p[1])).reduce((a, b) => Math.max(a, b), 0);
  const yMax = niceMax(maxValue * 1.08);

  const innerW = W - M.left - M.right;
  const innerH = H - M.top - M.bottom;
  const x = (year: number) => M.left + ((year - minYear) / Math.max(1, maxYear - minYear)) * innerW;
  const y = (value: number) => M.top + innerH - (value / yMax) * innerH;

  const yTicks = Array.from({ length: 5 }, (_, i) => (yMax / 4) * i);
  const span = maxYear - minYear;
  const roughStep = span / 5;
  const yearStep = roughStep <= 1 ? 1 : roughStep <= 2 ? 2 : roughStep <= 5 ? 5 : 10;
  const xTicks = useMemo(() => {
    const out: number[] = [];
    const start = Math.ceil(minYear / yearStep) * yearStep;
    for (let year = start; year <= maxYear; year += yearStep) out.push(year);
    return out;
  }, [minYear, maxYear, yearStep]);

  if (!series.length) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-xl border border-dashed border-ink/20 bg-paper-2/30 px-6 text-center text-sm text-muted">
        Selecciona hasta seis países en la tabla para comparar sus series.
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full min-w-[560px]"
          role="img"
          aria-label={`Evolución de ${meta.name} en ${series.map((s) => s.name).join(", ")}`}
        >
          <rect x={M.left} y={M.top} width={innerW} height={innerH} fill="#fffdf8" stroke="#ded4c2" />
          {yTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={M.left}
                x2={W - M.right}
                y1={y(tick)}
                y2={y(tick)}
                stroke="#ded4c2"
                strokeDasharray="2 4"
              />
              <text x={M.left - 8} y={y(tick) + 4} textAnchor="end" fontSize={10} fill="#6b6157">
                {meta.valueType === "count" ? fmtPeople(tick) : meta.valueType === "percent" ? `${fmtNumber(tick, 0)} %` : fmtNumber(tick, 0)}
              </text>
            </g>
          ))}
          {xTicks.map((tick) => (
            <g key={tick}>
              <line x1={x(tick)} x2={x(tick)} y1={M.top} y2={M.top + innerH} stroke="#ded4c2" strokeDasharray="2 4" opacity={0.6} />
              <text x={x(tick)} y={H - 14} textAnchor="middle" fontSize={10} fill="#6b6157">
                {tick}
              </text>
            </g>
          ))}

          {series.map((s, idx) => {
            const color = CHART_COLORS[idx % CHART_COLORS.length];
            const segments: SeriesPoint[][] = [];
            let current: SeriesPoint[] = [];
            for (const p of s.points) {
              const prev = current[current.length - 1];
              if (prev && p[0] - prev[0] > 1) {
                if (current.length) segments.push(current);
                current = [];
              }
              current.push(p);
            }
            if (current.length) segments.push(current);

            return (
              <g key={s.iso3}>
                {segments.map((seg, si) => (
                  <polyline
                    key={si}
                    points={seg.map((p) => `${x(p[0])},${y(p[1])}`).join(" ")}
                    fill="none"
                    stroke={color}
                    strokeWidth={2.2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                ))}
                {s.points.map((p) => (
                  <circle key={p[0]} cx={x(p[0])} cy={y(p[1])} r={2.4} fill={color}>
                    <title>{`${s.name} · ${p[0]}: ${formatValue(p[1], meta)}`}</title>
                  </circle>
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
        {series.map((s, idx) => (
          <span key={s.iso3} className="inline-flex items-center gap-1.5 text-[11px] text-ink-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART_COLORS[idx % CHART_COLORS.length] }} />
            {s.name}
          </span>
        ))}
      </div>
      <p className="mt-3 border-t border-ink/10 pt-2 text-[10px] leading-relaxed text-muted">
        Solo se representan observaciones existentes en la serie. Una línea se interrumpe cuando faltan más de
        un año de datos: no se interpola ni se rellena el hueco. Pasa el cursor sobre un punto para ver el valor.
      </p>
    </div>
  );
}
