"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, Info, Loader2, MapPin, Search, Sparkles, X } from "lucide-react";
import type { Country, GrfcCountry, IndicatorId, IndicatorMeta, Series } from "@/lib/types";
import { useJson } from "@/lib/client-data";
import {
  latestUntil,
  pointsFor,
  rankOf,
  valueInYear,
  valuesInYear,
  yearsWithData,
} from "@/lib/analysis";
import { fmtNumber, fmtPct, fmtPeople, fmtPou } from "@/lib/format";
import { MAP_BINS, MAP_INDICATORS, NO_DATA_COLOR } from "@/lib/map-scale";
import WorldMap from "@/components/map/WorldMap";

type SeriesFile = { generatedAt: string; series: Series };

interface Props {
  countries: Country[];
  indicators: IndicatorMeta[];
  grfc: { countries: Record<string, GrfcCountry> };
}

const POU = "pou" as IndicatorId;

export default function MobileMap({ countries, indicators, grfc }: Props) {
  const seriesState = useJson<SeriesFile>("series.json");
  const topoState = useJson<unknown>("world-110m.topo.json");

  const [indicator, setIndicator] = useState<IndicatorId>(POU);
  const [year, setYear] = useState<number | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const series = seriesState.data?.series;

  // Enlace directo: /movil/mapa?pais=AFG
  useEffect(() => {
    if (typeof window === "undefined") return;
    const iso = new URLSearchParams(window.location.search).get("pais")?.toUpperCase();
    if (iso && countries.some((c) => c.iso3 === iso)) setSelected(iso);
  }, [countries]);

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
  const mapConf = MAP_INDICATORS.find((m) => m.id === indicator)!;

  const values = useMemo(() => {
    const out: Record<string, number | null> = {};
    if (!series || year == null) return out;
    for (const c of countries) out[c.iso3] = valueInYear(pointsFor(series, c.iso3, indicator), year);
    return out;
  }, [series, year, indicator, countries]);

  const withData = useMemo(
    () => (year == null ? [] : valuesInYear(countries, series ?? {}, indicator, year)),
    [series, year, indicator, countries],
  );

  const names = useMemo(() => Object.fromEntries(countries.map((c) => [c.iso3, c.nameEs])), [countries]);

  const country = selected ? countries.find((c) => c.iso3 === selected) ?? null : null;
  const value = country && year != null && series ? valueInYear(pointsFor(series, country.iso3, indicator), year) : null;
  const rank = selected ? rankOf(withData, selected) : null;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return countries
      .filter(
        (c) =>
          c.nameEs.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.iso3.toLowerCase() === q,
      )
      .slice(0, 8);
  }, [query, countries]);

  // Bloquear el scroll de fondo mientras el panel está abierto.
  useEffect(() => {
    if (!selected) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [selected]);

  const loading = seriesState.status === "loading" || topoState.status === "loading";
  const error =
    seriesState.status === "error" ? seriesState.error : topoState.status === "error" ? topoState.error : null;
  const bins = MAP_BINS[indicator] ?? [];

  return (
    <div>
      <div className="px-4 pt-5">
        <p className="kicker text-terracotta">Mapa interactivo</p>
        <h1 className="display mt-1.5 text-3xl">El mapa del hambre</h1>
        <p className="mt-2 text-[12px] leading-relaxed text-muted">
          Toca un país para ver su dato. Pellizca el mapa o usa <strong className="text-ink">+ / −</strong> para
          acercar. El gris significa «sin dato para ese año», no «sin hambre».
        </p>
      </div>

      {/* Controles fijos */}
      <div className="sticky top-14 z-20 -mx-0 mt-4 border-y border-ink/10 bg-paper/95 px-4 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="inline-flex flex-1 rounded-full border border-ink/15 p-0.5">
            {MAP_INDICATORS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setIndicator(m.id)}
                className={`flex-1 rounded-full px-2 py-1.5 text-[11px] font-medium transition-colors ${
                  indicator === m.id ? "bg-ink text-paper" : "text-muted"
                }`}
                aria-pressed={indicator === m.id}
              >
                {m.id === "pou" ? "Hambre" : "Inseg. alimentaria"}
              </button>
            ))}
          </div>
          <label className="relative inline-flex items-center">
            <span className="sr-only">Año</span>
            <select
              value={year ?? ""}
              onChange={(e) => setYear(Number(e.target.value))}
              className="appearance-none rounded-full border border-ink/15 bg-[#fffdf8] py-1.5 pl-3 pr-7 text-[11px] font-medium tabular text-ink"
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

        <div className="relative mt-2">
          <div className="flex items-center gap-2 rounded-full border border-ink/15 bg-[#fffdf8] px-3 py-2">
            <Search size={14} className="text-muted" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && results[0]) {
                  setSelected(results[0].iso3);
                  setQuery("");
                  setSearchOpen(false);
                }
                if (e.key === "Escape") setSearchOpen(false);
              }}
              placeholder="Buscar un país…"
              className="w-full bg-transparent text-xs outline-none placeholder:text-muted/70"
              aria-label="Buscar país"
              role="combobox"
              aria-expanded={searchOpen && results.length > 0}
              aria-controls="mobile-search-results"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Borrar búsqueda">
                <X size={13} className="text-muted" />
              </button>
            )}
          </div>
          {searchOpen && query.trim() && (
            <ul
              id="mobile-search-results"
              className="absolute inset-x-0 z-30 mt-1.5 overflow-hidden rounded-xl border border-ink/15 bg-[#fffdf8] py-1 shadow-xl"
              role="listbox"
            >
              {results.length === 0 && <li className="px-4 py-3 text-xs text-muted">Sin resultados</li>}
              {results.map((c) => {
                const v = year != null && series ? valueInYear(pointsFor(series, c.iso3, indicator), year) : null;
                return (
                  <li key={c.iso3} role="option" aria-selected={selected === c.iso3}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-xs hover:bg-ink/5"
                      onClick={() => {
                        setSelected(c.iso3);
                        setQuery("");
                        setSearchOpen(false);
                      }}
                    >
                      <span className="font-medium">{c.nameEs}</span>
                      <span className="tabular text-muted">
                        {v == null ? "s/d" : meta.id === "pou" ? fmtPou(v) : fmtPct(v)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-4 rounded-xl border border-terracotta/30 bg-terracotta/5 p-4 text-xs text-rust">
          No se pudieron cargar los datos del mapa: {error}.
        </div>
      )}

      <div className="px-4 pt-3">
        {loading ? (
          <div className="flex h-[280px] items-center justify-center rounded-2xl border border-ink/10 bg-[#f2ecdf] text-xs text-muted">
            <Loader2 className="mr-2 animate-spin" size={15} /> Cargando mapa y series…
          </div>
        ) : (
          <WorldMap
            topology={topoState.data}
            values={values}
            names={names}
            indicator={indicator}
            selected={selected}
            onSelect={(iso3) => setSelected(iso3)}
            accentLabel={`${meta.shortName}, ${year}`}
          />
        )}

        <div className="mt-3 rounded-xl border border-ink/10 bg-[#fffdf8]">
          <button
            type="button"
            onClick={() => setLegendOpen((v) => !v)}
            aria-expanded={legendOpen}
            className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left"
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              Escala · {meta.shortName} · {year}
            </span>
            <ChevronDown size={14} className={`text-muted transition-transform ${legendOpen ? "rotate-180" : ""}`} />
          </button>
          {legendOpen ? (
            <div className="border-t border-ink/10 px-3.5 py-3">
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                {bins.map((b) => (
                  <span key={b.label} className="inline-flex items-center gap-1.5 text-[10px] text-ink-2">
                    <span className="h-2.5 w-2.5 rounded-[2px] border border-ink/10" style={{ background: b.color }} />
                    {b.label}
                  </span>
                ))}
                <span className="inline-flex items-center gap-1.5 text-[10px] text-muted">
                  <span className="h-2.5 w-2.5 rounded-[2px] border border-ink/10" style={{ background: NO_DATA_COLOR }} />
                  Sin dato
                </span>
              </div>
              <p className="mt-2 text-[9px] leading-relaxed text-muted">
                {withData.length} países con dato ({fmtNumber(100 - (withData.length / countries.length) * 100, 0)}{" "}
                % sin dato). Fuente: {meta.source}.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 overflow-x-auto border-t border-ink/10 px-3.5 py-2">
              {bins.map((b) => (
                <span
                  key={b.label}
                  className="h-2.5 w-8 shrink-0 rounded-sm border border-ink/10"
                  style={{ background: b.color }}
                  title={b.label}
                />
              ))}
              <span className="ml-1 shrink-0 text-[9px] text-muted">{bins[0]?.label} →</span>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-xl bg-paper-2/50 p-3 text-[10px] leading-relaxed text-muted">
          <Info size={13} className="mt-0.5 shrink-0 text-terracotta" />
          <p>
            {mapConf.description} Los datos de un año concreto no se interpolan. Toca un país para abrir su
            panel.
          </p>
        </div>
      </div>

      {country && (
        <>
          <button
            type="button"
            aria-label="Cerrar panel del país"
            onClick={() => setSelected(null)}
            className="fixed inset-0 z-40 mx-auto max-w-[430px] bg-ink/40"
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-label={`Datos de ${country.nameEs}`}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[82vh] w-full max-w-[430px] overflow-y-auto overscroll-contain rounded-t-3xl bg-paper pb-[max(env(safe-area-inset-bottom),16px)] shadow-2xl"
          >
            <div className="sticky top-0 z-10 border-b border-ink/10 bg-paper/95 px-4 pb-3 pt-2 backdrop-blur-md">
              <div className="mx-auto h-1 w-10 rounded-full bg-ink/15" />
              <div className="mt-2 flex items-start justify-between gap-3">
                <div>
                  <p className="kicker text-[9px] text-muted">
                    {country.continent} · {country.incomeEs}
                  </p>
                  <h2 className="mt-0.5 font-serif text-2xl leading-tight">{country.nameEs}</h2>
                  <p className="text-[10px] text-muted">{country.regionEs}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-full p-2 hover:bg-ink/10"
                  aria-label="Cerrar"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="px-4 pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                {meta.shortName} · {year}
              </p>
              <p className="display mt-1 text-4xl">
                {value == null ? "s/d" : meta.id === "pou" ? fmtPou(value) : fmtPct(value)}
              </p>
              {value == null && (
                <p className="mt-1 text-[11px] leading-relaxed text-muted">
                  No hay dato para este indicador y año. No se interpola ni se estima.
                </p>
              )}

              {country && indicator === POU && series && (
                <MobilePeople series={series} iso3={country.iso3} year={year} />
              )}

              {rank && (
                <p className="mt-1.5 text-[10px] text-muted">
                  Puesto {rank} de {withData.length} países con dato ese año (mayor a menor prevalencia).
                </p>
              )}

              {country && series && <MobileSpark series={series} iso3={country.iso3} indicator={indicator} year={year} />}

              {grfc.countries[country.iso3]?.latest && (
                <AcuteBlock grfc={grfc.countries[country.iso3]} shortName={meta.shortName} />
              )}

              <div className="mt-4 grid gap-2">
                <Link
                  href={`/pais/${country.iso3}/`}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-terracotta px-4 py-3 text-sm font-semibold text-white"
                >
                  Ver ficha completa <ArrowRight size={15} />
                </Link>
                <Link
                  href={`/movil/desafio?pais=${country.iso3}`}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 px-4 py-2.5 text-xs font-medium"
                >
                  <Sparkles size={14} className="text-terracotta" /> Estimar este país en el desafío
                </Link>
                <Link
                  href={`/mapa/?pais=${country.iso3}`}
                  className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-[11px] text-muted"
                >
                  <MapPin size={13} /> Abrir en el mapa de escritorio
                </Link>
              </div>

              <p className="mt-3 border-t border-ink/10 pt-3 text-[9px] leading-relaxed text-muted">
                Fuente: {meta.source}. Año del dato: {year}. El número de personas puede corresponder a otro
                año. No se comparan directamente subalimentación, inseguridad alimentaria y crisis aguda.
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function MobilePeople({ series, iso3, year }: { series: Series; iso3: string; year: number | null }) {
  const p = latestUntil(pointsFor(series, iso3, "undernourished_n"), year ?? 9999);
  if (!p) return null;
  return (
    <p className="mt-2 text-xs text-ink-2">
      <strong className="tabular">{fmtPeople(p[1])}</strong> de personas subalimentadas{" "}
      <span className="text-muted">({p[0]})</span>
    </p>
  );
}

function MobileSpark({
  series,
  iso3,
  indicator,
  year,
}: {
  series: Series;
  iso3: string;
  indicator: IndicatorId;
  year: number | null;
}) {
  const points = pointsFor(series, iso3, indicator).filter((p) => year == null || p[0] <= year).slice(-14);
  if (points.length < 2) return null;
  const min = Math.min(...points.map((p) => p[1]));
  const max = Math.max(...points.map((p) => p[1]));
  const span = max - min || 1;
  const poly = points
    .map((p, i) => `${(i / (points.length - 1)) * 260},${52 - ((p[1] - min) / span) * 44}`)
    .join(" ");

  return (
    <div className="mt-3 rounded-xl border border-ink/10 bg-[#fffdf8] p-3">
      <p className="text-[9px] uppercase tracking-wider text-muted">
        Tendencia {points[0][0]}–{points[points.length - 1][0]}
      </p>
      <svg viewBox="0 0 260 56" className="mt-1 h-14 w-full" aria-hidden="true">
        <polyline
          points={poly}
          fill="none"
          stroke="#b4472e"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function AcuteBlock({ grfc, shortName }: { grfc: GrfcCountry; shortName: string }) {
  const acute = grfc.latest;
  const recent = acute.year >= 2024;
  return (
    <div
      className={`mt-3 rounded-xl border p-3 ${recent ? "border-olive/30 bg-olive/5" : "border-amber/40 bg-amber/5"}`}
    >
      <p className="text-[9px] font-semibold uppercase tracking-wider text-olive">
        Inseguridad alimentaria aguda · IPC
      </p>
      <p className="tabular mt-1 text-sm">
        {fmtPct(acute.phase3plusPct)}{" "}
        <span className="text-[10px] text-muted">de la población analizada</span>
      </p>
      <p className="mt-0.5 text-[10px] text-ink-2">
        {fmtPeople(acute.phase3plus)} de personas en Fase 3 o superior
      </p>
      <p className="mt-1 text-[9px] leading-relaxed text-muted">
        Periodo: {acute.period ?? "—"}. {recent ? "" : "Dato desactualizado en la base GRFC. "}
        Es un indicador distinto de la {shortName.toLowerCase()}; no se comparan directamente.
      </p>
    </div>
  );
}
