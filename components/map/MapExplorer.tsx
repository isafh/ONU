"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Info, Loader2, Search, X } from "lucide-react";
import type { Country, GrfcCountry, IndicatorId, IndicatorMeta, Series } from "@/lib/types";
import { useJson } from "@/lib/client-data";
import {
  latestUntil,
  pointsFor,
  valueInYear,
  valuesInYear,
  yearsWithData,
  rankOf,
} from "@/lib/analysis";
import { fmtNumber, fmtPct, fmtPeople, fmtPou } from "@/lib/format";
import { MAP_BINS, MAP_INDICATORS, NO_DATA_COLOR } from "@/lib/map-scale";
import WorldMap from "./WorldMap";

interface Props {
  countries: Country[];
  indicators: IndicatorMeta[];
  grfc: { countries: Record<string, GrfcCountry> };
}

type SeriesFile = { generatedAt: string; series: Series };

const POU = "pou" as IndicatorId;
const MSFI = "msfi" as IndicatorId;

export default function MapExplorer({ countries, indicators, grfc }: Props) {
  const seriesState = useJson<SeriesFile>("series.json");
  const topoState = useJson<unknown>("world-110m.topo.json");

  const [indicator, setIndicator] = useState<IndicatorId>(POU);
  const [year, setYear] = useState<number | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const series = seriesState.data?.series;

  // Enlace directo desde el desafío: /mapa/?pais=AFG
  useEffect(() => {
    if (typeof window === "undefined") return;
    const iso = new URLSearchParams(window.location.search).get("pais")?.toUpperCase();
    if (iso && countries.some((c) => c.iso3 === iso)) setSelected(iso);
  }, [countries]);

  // En pantallas pequeñas el panel de país queda debajo del mapa y de la
  // leyenda. Al seleccionar un país se lleva la vista al panel para que el
  // clic produzca una respuesta visible.
  useEffect(() => {
    if (!selected) return;
    if (typeof window === "undefined" || !window.matchMedia("(max-width: 1023px)").matches) return;
    document.getElementById("pais-seleccionado")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selected]);

  const years = useMemo(() => {
    if (!series) return [];
    const all = yearsWithData(series, indicator);
    return all.filter((y) => valuesInYear(countries, series, indicator, y).length >= 50);
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

  const ranking = useMemo(() => [...withData].sort((a, b) => b.value - a.value).slice(0, 10), [withData]);
  const coverage = withData.length;

  const names = useMemo(() => Object.fromEntries(countries.map((c) => [c.iso3, c.nameEs])), [countries]);

  const selectedCountry = selected ? countries.find((c) => c.iso3 === selected) ?? null : null;
  const selectedValue = selected && year != null && series ? valueInYear(pointsFor(series, selected, indicator), year) : null;
  const selectedRank = selected ? rankOf(withData, selected) : null;

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return countries
      .filter((c) => c.nameEs.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.iso3.toLowerCase() === q)
      .slice(0, 8);
  }, [query, countries]);

  const loading = seriesState.status === "loading" || topoState.status === "loading";
  const error = seriesState.status === "error" ? seriesState.error : topoState.status === "error" ? topoState.error : null;

  const bins = MAP_BINS[indicator] ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker text-terracotta">Mapa interactivo</p>
          <h1 className="display mt-2 text-4xl sm:text-5xl">El mapa del hambre</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Cada país se colorea según un indicador y un año concretos. Pasa el cursor para ver el dato,
            busca un país o haz clic para consultar su ficha. El gris significa «sin dato para ese año»,
            no «sin hambre».
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-ink/15 bg-[#fffdf8] px-3 py-1.5 text-[11px] text-muted">
          <Info size={13} />
          {meta.sdg ? `${meta.sdg} · ` : ""}{meta.source.split("—")[0].trim()}
        </div>
      </div>

      {/* Controles */}
      <div className="mt-7 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="inline-flex w-full rounded-full border border-ink/15 p-1 sm:w-auto">
          {MAP_INDICATORS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setIndicator(m.id)}
              className={`flex-1 rounded-full px-3 py-2 text-xs font-medium transition-colors sm:flex-none sm:px-4 sm:text-[13px] ${
                indicator === m.id ? "bg-ink text-paper" : "text-muted hover:text-ink"
              }`}
              aria-pressed={indicator === m.id}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="flex items-center gap-2 text-xs text-muted">
            Año
            <select
              value={year ?? ""}
              onChange={(e) => setYear(Number(e.target.value))}
              className="rounded-full border border-ink/15 bg-[#fffdf8] px-3 py-2 text-xs font-medium text-ink"
            >
              {years
                .slice()
                .reverse()
                .map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
            </select>
          </label>

          <div className="relative">
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
                  if (e.key === "Enter" && searchResults[0]) {
                    setSelected(searchResults[0].iso3);
                    setQuery(searchResults[0].nameEs);
                    setSearchOpen(false);
                  }
                  if (e.key === "Escape") setSearchOpen(false);
                }}
                placeholder="Buscar un país…"
                className="w-44 bg-transparent text-xs outline-none placeholder:text-muted/70"
                aria-label="Buscar país"
                role="combobox"
                aria-expanded={searchOpen && searchResults.length > 0}
                aria-controls="country-search-results"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} aria-label="Borrar búsqueda">
                  <X size={13} className="text-muted" />
                </button>
              )}
            </div>
            {searchOpen && query.trim() && (
              <ul
                id="country-search-results"
                className="absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-xl border border-ink/15 bg-[#fffdf8] py-1 shadow-xl"
                role="listbox"
              >
                {searchResults.length === 0 && <li className="px-4 py-3 text-xs text-muted">Sin resultados</li>}
                {searchResults.map((c) => {
                  const v = year != null && series ? valueInYear(pointsFor(series, c.iso3, indicator), year) : null;
                  return (
                    <li key={c.iso3} role="option" aria-selected={selected === c.iso3}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-xs hover:bg-ink/5"
                        onClick={() => {
                          setSelected(c.iso3);
                          setQuery(c.nameEs);
                          setSearchOpen(false);
                        }}
                      >
                        <span className="font-medium">{c.nameEs}</span>
                        <span className="tabular text-muted">{v == null ? "s/d" : meta.id === "pou" ? fmtPou(v) : fmtPct(v)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-terracotta/30 bg-terracotta/5 p-5 text-sm text-rust">
          No se pudieron cargar los datos del mapa: {error}. Ejecuta <code>npm run data</code> para regenerar la base.
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          {loading ? (
            <div className="flex h-[420px] items-center justify-center rounded-2xl border border-ink/10 bg-[#f2ecdf] text-sm text-muted">
              <Loader2 className="mr-2 animate-spin" size={16} /> Cargando mapa y series…
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

          {/* Leyenda */}
          <div className="mt-4 rounded-xl border border-ink/10 bg-[#fffdf8] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                {mapConf.full} · {year}
              </p>
              <p className="text-[10px] text-muted">
                {coverage} países con dato · {fmtNumber(100 - (coverage / countries.length) * 100, 0)} % sin dato
              </p>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
              {bins.map((b) => (
                <span key={b.label} className="inline-flex items-center gap-1.5 text-[11px] text-ink-2">
                  <span className="h-3 w-3 rounded-[3px] border border-ink/10" style={{ background: b.color }} />
                  {b.label}
                </span>
              ))}
              <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
                <span className="h-3 w-3 rounded-[3px] border border-ink/10" style={{ background: NO_DATA_COLOR }} />
                Sin dato
              </span>
            </div>
            <p className="mt-3 border-t border-ink/10 pt-2 text-[10px] leading-relaxed text-muted">
              {mapConf.description} Fuente: {meta.source}. Última actualización de la serie:{" "}
              {meta.coverage?.vintage ?? "—"}.
            </p>
          </div>

          {/* Top 10 */}
          <div className="mt-4 rounded-xl border border-ink/10 bg-[#fffdf8] p-4 sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Mayor prevalencia en {year} · {meta.shortName}
            </p>
            <ol className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
              {ranking.map((r, i) => {
                const c = countries.find((x) => x.iso3 === r.iso3)!;
                return (
                  <li key={r.iso3}>
                    <button
                      type="button"
                      onClick={() => setSelected(r.iso3)}
                      className={`flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-xs transition-colors hover:bg-ink/5 ${
                        selected === r.iso3 ? "bg-ink/5" : ""
                      }`}
                    >
                      <span className="tabular w-4 text-[10px] text-muted">{i + 1}</span>
                      <span className="flex-1 truncate">{c.nameEs}</span>
                      <span className="tabular font-medium">{meta.id === "pou" ? fmtPou(r.value) : fmtPct(r.value)}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        {/* Panel de país */}
        <aside id="pais-seleccionado" className="scroll-mt-20 lg:sticky lg:top-20 lg:self-start">
          {!selectedCountry ? (
            <div className="rounded-2xl border border-dashed border-ink/20 bg-paper-2/40 p-6 text-sm text-muted">
              <p className="font-serif text-xl text-ink">Elige un país</p>
              <p className="mt-2 leading-relaxed">
                Haz clic en el mapa o usa el buscador. Verás su dato oficial, su tendencia y el acceso a la
                ficha completa del país.
              </p>
              <div className="mt-5 space-y-2 text-[11px]">
                <p className="rounded-lg bg-paper p-3">
                  <strong className="text-ink">Consejo:</strong> compara dos países con el mismo color. Un color
                  parecido no implica la misma historia: mira el número de personas y el contexto.
                </p>
              </div>
            </div>
          ) : (
            <CountryPanel
              country={selectedCountry}
              series={series}
              indicator={indicator}
              meta={meta}
              year={year}
              value={selectedValue}
              rank={selectedRank}
              total={withData.length}
              grfc={grfc.countries[selectedCountry.iso3] ?? null}
              onClose={() => setSelected(null)}
            />
          )}
        </aside>
      </div>
    </div>
  );
}

function CountryPanel({
  country,
  series,
  indicator,
  meta,
  year,
  value,
  rank,
  total,
  grfc,
  onClose,
}: {
  country: Country;
  series: Series | undefined;
  indicator: IndicatorId;
  meta: IndicatorMeta;
  year: number | null;
  value: number | null;
  rank: number | null;
  total: number;
  grfc: GrfcCountry | null;
  onClose: () => void;
}) {
  const points = series ? pointsFor(series, country.iso3, indicator) : [];
  const spark = points.filter((p) => year == null || p[0] <= year).slice(-14);
  const numberPoint = indicator === POU && series ? latestUntil(pointsFor(series, country.iso3, "undernourished_n"), year ?? 9999) : null;

  let poly = "";
  if (spark.length > 1) {
    const min = Math.min(...spark.map((p) => p[1]));
    const max = Math.max(...spark.map((p) => p[1]));
    const span = max - min || 1;
    poly = spark
      .map((p, i) => `${(i / (spark.length - 1)) * 240},${52 - ((p[1] - min) / span) * 44}`)
      .join(" ");
  }

  const acute = grfc?.latest ?? null;
  const acuteIsRecent = acute && acute.year >= 2024;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-ink/10 bg-paper-2/60 px-5 py-4">
        <div>
          <p className="kicker text-[10px] text-muted">{country.continent} · {country.incomeEs}</p>
          <h2 className="mt-1 font-serif text-2xl leading-tight">{country.nameEs}</h2>
          <p className="mt-0.5 text-[11px] text-muted">{country.regionEs}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-ink/10" aria-label="Cerrar panel">
          <X size={15} />
        </button>
      </div>

      <div className="px-5 py-5">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
          {meta.shortName} · {year}
        </p>
        <p className="display mt-1 text-4xl">{value == null ? "s/d" : meta.id === "pou" ? fmtPou(value) : fmtPct(value)}</p>
        {value == null && (
          <p className="mt-1 text-xs leading-relaxed text-muted">
            No hay dato para este indicador y año. No se interpola ni se estima: consulta otro año o la ficha
            del país.
          </p>
        )}
        {numberPoint && (
          <p className="mt-2 text-xs text-ink-2">
            <strong className="tabular">{fmtPeople(numberPoint[1])}</strong> de personas subalimentadas
            <span className="text-muted"> ({numberPoint[0]})</span>
          </p>
        )}
        {rank && (
          <p className="mt-1 text-[11px] text-muted">
            Puesto {rank} de {total} países con dato ese año (mayor a menor prevalencia).
          </p>
        )}

        {poly && (
          <div className="mt-4 rounded-lg border border-ink/10 bg-paper/60 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted">Tendencia {spark[0][0]}–{spark[spark.length - 1][0]}</p>
            <svg viewBox="0 0 240 56" className="mt-1 h-14 w-full" aria-hidden="true">
              <polyline points={poly} fill="none" stroke="#b4472e" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          </div>
        )}

        {acute && (
          <div className={`mt-4 rounded-lg border p-3 ${acuteIsRecent ? "border-olive/30 bg-olive/5" : "border-amber/40 bg-amber/5"}`}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-olive">
              Inseguridad alimentaria aguda · IPC
            </p>
            <p className="tabular mt-1 text-sm">
              {fmtPct(acute.phase3plusPct)} <span className="text-[11px] text-muted">de la población analizada</span>
            </p>
            <p className="mt-0.5 text-[11px] text-ink-2">
              {fmtPeople(acute.phase3plus)} de personas en Fase 3 o superior
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-muted">
              Periodo: {acute.period ?? "—"}. {acuteIsRecent ? "" : "Dato desactualizado en la base GRFC. "}
              Es un indicador distinto de la {meta.shortName.toLowerCase()}; no se comparan directamente.
            </p>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2">
          <Link
            href={`/pais/${country.iso3}/`}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-terracotta px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-rust"
          >
            Ver ficha completa
            <ArrowRight size={15} />
          </Link>
        </div>
        <p className="mt-3 text-[10px] leading-relaxed text-muted">
          Fuente: {meta.source}. Año del dato: {year}. El número de personas puede corresponder a otro año
          (se indica entre paréntesis).
        </p>
      </div>
    </div>
  );
}
