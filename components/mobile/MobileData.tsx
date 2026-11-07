"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, ChevronDown, Info, Loader2 } from "lucide-react";
import type { Country, IndicatorId, IndicatorMeta, Series } from "@/lib/types";
import { useJson } from "@/lib/client-data";
import { valuesInYear, yearsWithData } from "@/lib/analysis";
import { fmtPct, fmtPou } from "@/lib/format";
import { MAP_INDICATORS } from "@/lib/map-scale";

type SeriesFile = { generatedAt: string; series: Series };

interface Props {
  countries: Country[];
  indicators: IndicatorMeta[];
  world: Record<string, [number, number][]>;
}

const POU = "pou" as IndicatorId;

export default function MobileData({ countries, indicators, world }: Props) {
  const seriesState = useJson<SeriesFile>("series.json");
  const [indicator, setIndicator] = useState<IndicatorId>(POU);
  const [year, setYear] = useState<number | null>(null);

  const series = seriesState.data?.series;

  const years = useMemo(() => {
    if (!series) return [];
    return yearsWithData(series, indicator).filter(
      (y) => valuesInYear(countries, series, indicator, y).length >= 50,
    );
  }, [series, indicator, countries]);

  useEffect(() => {
    if (!years.length) return;
    if (year == null || !years.includes(year)) setYear(years[years.length - 1]);
  }, [years, year]);

  const meta = indicators.find((i) => i.id === indicator)!;
  const conf = MAP_INDICATORS.find((m) => m.id === indicator)!;

  const data = useMemo(
    () => (series && year != null ? valuesInYear(countries, series, indicator, year) : []),
    [series, year, indicator, countries],
  );

  const ranking = useMemo(() => [...data].sort((a, b) => b.value - a.value).slice(0, 10), [data]);
  const max = ranking.length ? ranking[0].value : 1;

  const worldPoint = useMemo(() => {
    if (year == null) return null;
    return (world[indicator] ?? []).find((p) => p[0] === year) ?? null;
  }, [world, indicator, year]);

  const loading = seriesState.status === "loading";
  const error = seriesState.status === "error" ? seriesState.error : null;

  return (
    <div className="px-4 pb-6 pt-5">
      <p className="kicker text-terracotta">Estadísticas</p>
      <h1 className="display mt-1.5 text-3xl">Los países con más hambre</h1>
      <p className="mt-2 text-[12px] leading-relaxed text-muted">
        Rankings calculados solo con observaciones exactas del año seleccionado. No se interpola ni se
        rellena un año ausente.
      </p>

      <div className="mt-4 inline-flex w-full rounded-full border border-ink/15 p-0.5">
        {MAP_INDICATORS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setIndicator(m.id)}
            className={`flex-1 rounded-full px-2 py-2 text-[11px] font-medium transition-colors ${
              indicator === m.id ? "bg-ink text-paper" : "text-muted"
            }`}
            aria-pressed={indicator === m.id}
          >
            {m.id === "pou" ? "Subalimentación" : "Inseg. alimentaria"}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
          {conf.full}
        </p>
        <label className="relative inline-flex items-center">
          <span className="sr-only">Año</span>
          <select
            value={year ?? ""}
            onChange={(e) => setYear(Number(e.target.value))}
            className="appearance-none rounded-full border border-ink/15 bg-[#fffdf8] py-1.5 pl-3 pr-7 text-[11px] font-medium tabular"
          >
            {years.slice().reverse().map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <ChevronDown size={12} className="pointer-events-none absolute right-2 text-muted" />
        </label>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-terracotta/30 bg-terracotta/5 p-4 text-xs text-rust">
          No se pudieron cargar las series: {error}.
        </div>
      )}

      {loading ? (
        <div className="mt-6 flex items-center justify-center rounded-2xl border border-ink/10 bg-[#f2ecdf] py-14 text-xs text-muted">
          <Loader2 className="mr-2 animate-spin" size={15} /> Cargando series…
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-deep p-4 text-paper">
              <p className="text-[9px] uppercase tracking-wider text-paper/50">Promedio mundial</p>
              <p className="display mt-1 text-3xl text-amber-soft">
                {worldPoint ? (indicator === "pou" ? fmtPou(worldPoint[1]) : fmtPct(worldPoint[1])) : "s/d"}
              </p>
              <p className="text-[10px] text-paper/60">{worldPoint ? `Año ${worldPoint[0]}` : "Sin dato exacto"}</p>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-[#fffdf8] p-4">
              <p className="text-[9px] uppercase tracking-wider text-muted">Cobertura</p>
              <p className="display mt-1 text-3xl">{data.length}</p>
              <p className="text-[10px] text-muted">países con dato en {year}</p>
            </div>
          </div>

          <section className="mt-5" aria-labelledby="top10">
            <div className="flex items-center gap-2">
              <BarChart3 size={15} className="text-terracotta" />
              <h2 id="top10" className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                Mayor prevalencia · {year}
              </h2>
            </div>
            <ol className="mt-3 space-y-1.5">
              {ranking.map((r, i) => {
                const c = countries.find((x) => x.iso3 === r.iso3);
                const display = indicator === "pou" ? fmtPou(r.value) : fmtPct(r.value);
                return (
                  <li key={r.iso3}>
                    <Link
                      href={`/movil/mapa?pais=${r.iso3}`}
                      className="flex items-center gap-3 rounded-xl border border-ink/10 bg-[#fffdf8] px-3 py-2.5"
                    >
                      <span className="tabular w-4 text-[11px] font-semibold text-muted">{i + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-[12px] font-medium">{c?.nameEs ?? r.iso3}</span>
                          <span className="tabular shrink-0 text-[12px] font-semibold">{display}</span>
                        </span>
                        <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-ink/5">
                          <span
                            className="block h-full rounded-full bg-terracotta"
                            style={{ width: `${max ? (r.value / max) * 100 : 0}%` }}
                          />
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>

          <div className="mt-4 flex items-start gap-2 rounded-xl bg-paper-2/50 p-3 text-[10px] leading-relaxed text-muted">
            <Info size={13} className="mt-0.5 shrink-0 text-terracotta" />
            <p>
              {conf.description} Fuente: {meta.source}. Los años y la cobertura varían; un puesto alto no
              implica necesariamente más personas afectadas en términos absolutos.
            </p>
          </div>

          <Link
            href="/datos"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink/15 px-4 py-3 text-xs font-medium"
          >
            Ver todas las estadísticas y comparar <ArrowRight size={14} />
          </Link>
        </>
      )}
    </div>
  );
}
