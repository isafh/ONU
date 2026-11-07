"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtNumber } from "@/lib/format";

interface Props {
  world: Record<string, [number, number][]>;
}

const SERIES = {
  pou: {
    id: "pou",
    label: "Subalimentación",
    sublabel: "Prevalencia de subalimentación (PoU, ODS 2.1.1)",
    color: "#b4472e",
    max: 14,
  },
  msfi: {
    id: "msfi",
    label: "Inseguridad alimentaria",
    sublabel: "Moderada o grave (FIES, ODS 2.1.2)",
    color: "#d99a2b",
    max: 35,
  },
} as const;

type Key = keyof typeof SERIES;

export default function WorldTrend({ world }: Props) {
  const [active, setActive] = useState<Key>("pou");
  const conf = SERIES[active];

  const data = useMemo(() => {
    return (world[active] ?? []).map(([year, value]) => ({ year, value }));
  }, [world, active]);

  const first = data[0];
  const last = data[data.length - 1];

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-ink/15 p-1">
          {(Object.keys(SERIES) as Key[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setActive(key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:text-[13px] ${
                active === key ? "bg-ink text-paper" : "text-muted hover:text-ink"
              }`}
              aria-pressed={active === key}
            >
              {SERIES[key].label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted">Mundo · {first?.year}–{last?.year}</p>
      </div>

      <div className="h-[280px] w-full sm:h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#ded4c2" strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: "#6b6157" }}
              tickLine={false}
              axisLine={{ stroke: "#ded4c2" }}
              minTickGap={28}
            />
            <YAxis
              domain={[0, conf.max]}
              tick={{ fontSize: 11, fill: "#6b6157" }}
              tickLine={false}
              axisLine={false}
              width={38}
              tickFormatter={(v: number) => `${v}%`}
            />
            <ReferenceLine x={2020} stroke="#6b6157" strokeDasharray="3 4" strokeOpacity={0.5} label={{ value: "COVID-19", position: "insideTopLeft", fontSize: 10, fill: "#6b6157" }} />
            <Tooltip
              contentStyle={{
                background: "#17130e",
                border: "none",
                borderRadius: 8,
                color: "#f7f3ea",
                fontSize: 12,
                padding: "8px 10px",
              }}
              labelStyle={{ color: "#f0c778", marginBottom: 2 }}
              formatter={(value) => [`${fmtNumber(Number(value), 1)} %`, conf.sublabel]}
              labelFormatter={(year) => `Año ${year}`}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={conf.color}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: conf.color, stroke: "#fffdf8", strokeWidth: 2 }}
              isAnimationActive
              animationDuration={700}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <p className="max-w-lg text-[11px] leading-relaxed text-muted">
          {active === "pou"
            ? "Porcentaje de la población mundial cuya ingesta energética habitual es insuficiente. Estimación modelizada de la FAO; los valores se publican como promedio trienal."
            : "Porcentaje de la población que, en algún momento del año, redujo la calidad o la cantidad de alimentos por falta de recursos. Encuesta FIES de la FAO."}
        </p>
        <p className="tabular text-xs text-ink-2">
          {first && last && (
            <>
              <span className="font-semibold">{fmtNumber(first.value, 1)} %</span> en {first.year}
              <span className="mx-2 text-muted">→</span>
              <span className="font-semibold">{fmtNumber(last.value, 1)} %</span> en {last.year}
            </>
          )}
        </p>
      </div>
    </div>
  );
}
