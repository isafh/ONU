"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  BarChart3,
  Check,
  Download,
  Info,
  Loader2,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import type { Country, IndicatorId, IndicatorMeta, Series, SeriesPoint } from "@/lib/types";
import { useJson } from "@/lib/client-data";
import { latestUntil, pointsFor, valueInYear, valuesInYear, yearsWithData } from "@/lib/analysis";
import { fmtNumber, fmtPeople } from "@/lib/format";
import MultiCountryChart, { CHART_COLORS, type ChartSeries } from "./MultiCountryChart";

type SeriesFile = { generatedAt: string; series: Series };
type Metric = "prevalence" | "people";

const ORDER: IndicatorId[] = [
  "pou",
  "msfi",
  "sfi",
  "undernourished_n",
  "stunting",
  "wasting",
  "poverty",
  "gdp_pc",
  "food_prod",
  "gini",
  "agri_land",
  "population",
];

function formatValue(meta: IndicatorMeta, value: number): string {
  if (meta.id === "pou" && value === 2.5) return "< 2,5 %";
  if (meta.valueType === "count") return fmtPeople(value);
  if (meta.valueType === "percent") return `${fmtNumber(value, 1)} %`;
  if (meta.valueType === "currency") return `${fmtNumber(value, 0)} USD PPA`;
  return fmtNumber(value, meta.decimals);
}

function formatAxis(meta: IndicatorMeta, value: number): string {
  if (meta.valueType === "count") return fmtPeople(value);
  if (meta.valueType === "percent") return `${fmtNumber(value, 1)} %`;
  if (meta.valueType === "currency") return `${fmtNumber(value, 0)}`;
  return fmtNumber(value, meta.decimals);
}

export default function DataExplorer({
  countries,
  indicators,
}: {
  countries: Country[];
  indicators: IndicatorMeta[];
}) {
  const seriesState = useJson<SeriesFile>("series.json");
  const series = seriesState.data?.series;

  const [indicator, setIndicator] = useState<IndicatorId>("pou");
  const [metric, setMetric] = useState<Metric>("prevalence");
  const [year, setYear] = useState<number | null>(null);
  const [continent, setContinent] = useState("Todos");
  const [region, setRegion] = useState("Todas");
  const [income, setIncome] = useState("Todos");
  const [query, setQuery] = useState("");
  const [sortDesc, setSortDesc] = useState(true);
  const [topN, setTopN] = useState<number | "all">(25);
  const [compare, setCompare] = useState<string[]>([]);

  const peopleMode = indicator === "pou" && metric === "people";
  const displayId: IndicatorId = peopleMode ? "undernourished_n" : indicator;
  const meta = useMemo(() => indicators.find((i) => i.id === indicator)!, [indicators, indicator]);
  const displayMeta = useMemo(
    () => indicators.find((i) => i.id === displayId)!,
    [indicators, displayId],
  );

  const years = useMemo(() => {
    if (!series) return [];
    return yearsWithData(series, indicator).filter(
      (y) => valuesInYear(countries, series, indicator, y).length >= 5,
    );
  }, [series, indicator, countries]);

  // Año por defecto: el más reciente con cobertura razonable (>=15 países);
  // si no existe, el más reciente con al menos 5. El usuario puede elegir
  // después un año con menos cobertura y verlo indicado en la tabla.
  const defaultYear = useMemo(() => {
    if (!series) return null;
    const withCoverage = yearsWithData(series, indicator)
      .map((y) => ({ y, n: valuesInYear(countries, series, indicator, y).length }))
      .filter((x) => x.n >= 5);
    const preferred = [...withCoverage].reverse().find((x) => x.n >= 15) ?? withCoverage[withCoverage.length - 1];
    return preferred?.y ?? null;
  }, [series, indicator, countries]);

  useEffect(() => {
    setYear(defaultYear);
  }, [indicator, defaultYear]);

  useEffect(() => {
    setCompare([]);
    setMetric("prevalence");
  }, [indicator]);

  const continents = useMemo(
    () => ["Todos", ...[...new Set(countries.map((c) => c.continent))].sort((a, b) => a.localeCompare(b, "es"))],
    [countries],
  );
  const regions = useMemo(() => {
    const pool = continent === "Todos" ? countries : countries.filter((c) => c.continent === continent);
    return ["Todas", ...[...new Set(pool.map((c) => c.regionEs))].sort((a, b) => a.localeCompare(b, "es"))];
  }, [countries, continent]);
  const incomes = useMemo(
    () => ["Todos", ...[...new Set(countries.map((c) => c.incomeEs))].sort((a, b) => a.localeCompare(b, "es"))],
    [countries],
  );

  useEffect(() => {
    if (region !== "Todas" && !regions.includes(region)) setRegion("Todas");
  }, [regions, region]);

  const filteredCountries = useMemo(() => {
    const q = query.trim().toLowerCase();
    return countries.filter((c) => {
      if (continent !== "Todos" && c.continent !== continent) return false;
      if (region !== "Todas" && c.regionEs !== region) return false;
      if (income !== "Todos" && c.incomeEs !== income) return false;
      if (!q) return true;
      return (
        c.nameEs.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.iso3.toLowerCase().includes(q)
      );
    });
  }, [countries, continent, region, income, query]);

  interface Row {
    country: Country;
    value: number;
    dataYear: number;
    points: SeriesPoint[];
    displayPoints: SeriesPoint[];
  }

  const rows: Row[] = useMemo(() => {
    if (!series || year == null) return [];
    const out: Row[] = [];
    for (const c of filteredCountries) {
      const value = valueInYear(pointsFor(series, c.iso3, indicator), year);
      if (value == null) continue;
      const displayPoint = peopleMode
        ? latestUntil(pointsFor(series, c.iso3, "undernourished_n"), year)
        : ([year, value] as SeriesPoint);
      if (!displayPoint) continue;
      out.push({
        country: c,
        value: peopleMode ? displayPoint[1] : value,
        dataYear: displayPoint[0],
        points: pointsFor(series, c.iso3, indicator),
        displayPoints: pointsFor(series, c.iso3, displayId),
      });
    }
    return out.sort((a, b) => (sortDesc ? b.value - a.value : a.value - b.value));
  }, [series, year, filteredCountries, indicator, displayId, peopleMode, sortDesc]);

  const visibleRows = topN === "all" ? rows : rows.slice(0, topN);

  const allValues = useMemo(() => {
    if (!series || year == null) return [];
    const allowed = new Set(filteredCountries.map((c) => c.iso3));
    return valuesInYear(countries, series, indicator, year)
      .filter((v) => allowed.has(v.iso3))
      .map((v) => v.value);
  }, [series, year, indicator, countries, filteredCountries]);
  const globalMedian = useMemo(() => {
    if (!allValues.length) return null;
    const s = [...allValues].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  }, [allValues]);

  const regional = useMemo(() => {
    if (!series || year == null) return [];
    const groups = new Map<string, { values: number[]; people: number; years: Set<number> }>();
    for (const c of countries) {
      if (continent !== "Todos" && c.continent !== continent) continue;
      if (region !== "Todas" && c.regionEs !== region) continue;
      if (income !== "Todos" && c.incomeEs !== income) continue;
      const v = valueInYear(pointsFor(series, c.iso3, indicator), year);
      if (v == null) continue;
      const g = groups.get(c.continent) ?? { values: [], people: 0, years: new Set<number>() };
      g.values.push(v);
      if (peopleMode) {
        const p = latestUntil(pointsFor(series, c.iso3, "undernourished_n"), year);
        if (p) {
          g.people += p[1];
          g.years.add(p[0]);
        }
      }
      groups.set(c.continent, g);
    }
    return [...groups.entries()]
      .map(([name, g]) => {
        const s = [...g.values].sort((a, b) => a - b);
        const mid = Math.floor(s.length / 2);
        const median = s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
        return {
          name,
          median,
          total: peopleMode ? g.people : median,
          n: g.values.length,
          years: [...g.years].sort((a, b) => a - b),
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [series, year, countries, indicator, peopleMode, continent, region, income]);

  const maxRegional = Math.max(...regional.map((r) => r.total), 0);

  const chartSeries: ChartSeries[] = useMemo(() => {
    if (!series) return [];
    return compare
      .map((iso3) => {
        const c = countries.find((x) => x.iso3 === iso3);
        if (!c) return null;
        const points = pointsFor(series, c.iso3, displayId).filter(
          (p) => p[0] >= 2000 && p[0] <= new Date().getFullYear(),
        );
        return { iso3, name: c.nameEs, points };
      })
      .filter((x): x is ChartSeries => x !== null && x.points.length > 0);
  }, [series, compare, countries, displayId]);

  const chartCountries = compare
    .map((iso3) => countries.find((c) => c.iso3 === iso3))
    .filter((c): c is Country => Boolean(c));

  const toggleCompare = (iso3: string) => {
    setCompare((prev) => {
      if (prev.includes(iso3)) return prev.filter((x) => x !== iso3);
      if (prev.length >= 6) return prev;
      return [...prev, iso3];
    });
  };

  const reset = () => {
    setIndicator("pou");
    setMetric("prevalence");
    setContinent("Todos");
    setRegion("Todas");
    setIncome("Todos");
    setQuery("");
    setSortDesc(true);
    setTopN(25);
    setCompare([]);
  };

  const exportCsv = () => {
    const header = [
      "iso3",
      "pais",
      "continente",
      "region_banco_mundial",
      "grupo_ingreso",
      "indicador_id",
      "indicador",
      "anio",
      "valor",
      "unidad",
      "fuente",
      "url_fuente",
    ];
    const lines = rows.map((r) =>
      [
        r.country.iso3,
        r.country.nameEs,
        r.country.continent,
        r.country.regionEs,
        r.country.incomeEs,
        displayId,
        displayMeta.name,
        r.dataYear,
        r.value,
        displayMeta.unit,
        displayMeta.source,
        displayMeta.sourceUrl,
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(";"),
    );
    const csv = `\uFEFF${[header.join(";"), ...lines].join("\r\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hunger-map_${displayId}_${year ?? "sin-anio"}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const loading = seriesState.status === "loading";
  const error = seriesState.status === "error" ? seriesState.error : null;

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-7xl items-center justify-center px-4 text-sm text-muted">
        <Loader2 className="mr-2 animate-spin" size={16} /> Cargando la base de datos…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-xl border border-terracotta/30 bg-terracotta/5 p-5 text-sm text-rust">
          No se pudo cargar la base de datos: {error}. Ejecuta <code>npm run data</code> para regenerarla.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker text-terracotta">Estadísticas globales</p>
          <h1 className="display mt-2 text-4xl sm:text-5xl">Los datos, sin atajos</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Rankings, comparaciones regionales y series por país. Todos los valores son observaciones
            publicadas para un año concreto: no se interpolan, no se rellenan huecos y no se mezclan
            indicadores que miden cosas distintas.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-ink/15 bg-[#fffdf8] px-3 py-1.5 text-[11px] text-muted">
          <Info size={13} />
          {allValues.length} países con dato de {meta.shortName.toLowerCase()} en {year ?? "—"}
        </div>
      </header>

      {/* Controles */}
      <section className="mt-7 rounded-2xl border border-ink/10 bg-[#fffdf8] p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Indicador">
            <select
              value={indicator}
              onChange={(e) => setIndicator(e.target.value as IndicatorId)}
              className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm"
            >
              {ORDER.map((id) => {
                const m = indicators.find((i) => i.id === id);
                if (!m) return null;
                return (
                  <option key={id} value={id}>
                    {m.shortName}
                    {m.sdg ? ` · ODS ${m.sdg}` : ""}
                  </option>
                );
              })}
            </select>
          </Field>
          <Field label="Año">
            <select
              value={year ?? ""}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm"
              disabled={!years.length}
            >
              {years.length === 0 && <option value="">Sin años con cobertura suficiente</option>}
              {years
                .slice()
                .reverse()
                .map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Continente">
            <select
              value={continent}
              onChange={(e) => setContinent(e.target.value)}
              className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm"
            >
              {continents.map((c) => (
                <option key={c} value={c}>
                  {c === "Todos" ? "Todos los continentes" : c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Región del Banco Mundial">
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm"
            >
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r === "Todas" ? "Todas las regiones" : r}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Grupo de ingreso">
            <select
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm"
            >
              {incomes.map((i) => (
                <option key={i} value={i}>
                  {i === "Todos" ? "Todos los grupos" : i}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Buscar país">
            <div className="flex items-center gap-2 rounded-lg border border-ink/15 bg-paper px-3 py-2">
              <Search size={14} className="text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nombre o ISO3"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted/70"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} aria-label="Borrar búsqueda">
                  <X size={13} className="text-muted" />
                </button>
              )}
            </div>
          </Field>
          <Field label={indicator === "pou" ? "Métrica" : "Orden"}>
            {indicator === "pou" ? (
              <div className="inline-flex w-full rounded-lg border border-ink/15 p-0.5">
                {(
                  [
                    { id: "prevalence", label: "Prevalencia" },
                    { id: "people", label: "Personas" },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMetric(m.id)}
                    className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                      metric === m.id ? "bg-ink text-paper" : "text-muted hover:text-ink"
                    }`}
                    aria-pressed={metric === m.id}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="inline-flex w-full rounded-lg border border-ink/15 p-0.5">
                <button
                  type="button"
                  onClick={() => setSortDesc(true)}
                  className={`flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs ${sortDesc ? "bg-ink text-paper" : "text-muted"}`}
                >
                  <ArrowDownWideNarrow size={13} /> Mayor
                </button>
                <button
                  type="button"
                  onClick={() => setSortDesc(false)}
                  className={`flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs ${!sortDesc ? "bg-ink text-paper" : "text-muted"}`}
                >
                  <ArrowUpNarrowWide size={13} /> Menor
                </button>
              </div>
            )}
          </Field>
          <Field label="Filas">
            <div className="inline-flex w-full rounded-lg border border-ink/15 p-0.5">
              {[10, 25, 50, "all"].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setTopN(n as number | "all")}
                  className={`flex-1 rounded-md px-1.5 py-1.5 text-xs ${topN === n ? "bg-ink text-paper" : "text-muted"}`}
                >
                  {n === "all" ? "Todos" : n}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-3">
          <p className="max-w-2xl text-[11px] leading-relaxed text-muted">
            {meta.name}. {meta.unit}. Fuente: {meta.source}.{" "}
            {meta.coverage?.vintage ? `Última actualización de la serie: ${meta.coverage.vintage}.` : ""}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 text-[11px] text-muted hover:bg-ink/5"
            >
              <RotateCcw size={12} /> Restablecer
            </button>
            <button
              type="button"
              onClick={exportCsv}
              disabled={rows.length === 0}
              className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-[11px] font-semibold text-paper disabled:opacity-40"
            >
              <Download size={13} /> Descargar CSV
            </button>
          </div>
        </div>
      </section>

      {peopleMode && (
        <div className="mt-4 flex gap-2.5 rounded-xl border border-amber/40 bg-amber/10 p-4 text-[11px] leading-relaxed text-[#6b4a12]">
          <Info size={15} className="mt-0.5 shrink-0" />
          <p>
            La columna «personas» usa la serie oficial de <strong>número de personas subalimentadas</strong>{" "}
            (FAO/Banco Mundial), no la prevalencia multiplicada por la población. Esa serie puede terminar en
            otro año: se indica el año de cada cifra. La prevalencia sigue siendo el criterio de inclusión en el
            ranking de {year}.
          </p>
        </div>
      )}

      {rows.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-ink/20 bg-paper-2/40 p-6 text-sm leading-relaxed text-muted">
          No hay observaciones de {meta.shortName.toLowerCase()} en {year} para los filtros seleccionados. La
          aplicación no interpola ni usa otro año de forma silenciosa: cambia el año o amplía los filtros.
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
        {/* Ranking */}
        <section className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="font-serif text-2xl">
                {peopleMode ? "Personas subalimentadas" : `Ranking · ${meta.shortName}`}
              </h2>
              <p className="mt-1 text-[11px] text-muted">
                {peopleMode
                  ? `${rows.length} países con cifra oficial de personas · inclusión por PoU ${year}`
                  : `${rows.length} países con dato · ${year} · ${sortDesc ? "de mayor a menor" : "de menor a mayor"}`}
              </p>
            </div>
            <div className="rounded-full bg-ink/5 px-3 py-1 text-[10px] text-muted">
              {peopleMode ? "Cifra oficial de personas" : "Prevalencia (%)"}
            </div>
          </div>

          <div className="mt-3 overflow-hidden rounded-xl border border-ink/10 bg-[#fffdf8]">
            <div className="max-h-[680px] overflow-auto">
              <table className="w-full border-collapse text-sm">
                <caption className="sr-only">
                  Ranking de países por {displayMeta.name} en {year}. Los países sin dato no aparecen.
                </caption>
                <thead className="sticky top-0 z-10 bg-paper-2 text-left text-[10px] uppercase tracking-wider text-muted">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-semibold">#</th>
                    <th scope="col" className="px-3 py-2 font-semibold">País</th>
                    <th scope="col" className="hidden px-3 py-2 font-semibold sm:table-cell">Región</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">
                      {peopleMode ? "Personas" : "Valor"}
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">Año</th>
                    <th scope="col" className="px-3 py-2 text-center font-semibold">Comparar</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((r, i) => {
                    const active = compare.includes(r.country.iso3);
                    return (
                      <tr key={r.country.iso3} className="border-t border-ink/8 hover:bg-ink/[0.03]">
                        <td className="tabular px-3 py-2 text-[11px] text-muted">{i + 1}</td>
                        <td className="px-3 py-2">
                          <Link href={`/pais/${r.country.iso3}/`} className="font-medium hover:text-terracotta">
                            {r.country.nameEs}
                          </Link>
                          <span className="ml-1.5 text-[10px] text-muted">{r.country.iso3}</span>
                        </td>
                        <td className="hidden px-3 py-2 text-[11px] text-muted sm:table-cell">{r.country.regionEs}</td>
                        <td className="tabular px-3 py-2 text-right font-semibold">
                          {peopleMode ? fmtPeople(r.value) : formatValue(meta, r.value)}
                        </td>
                        <td className="tabular px-3 py-2 text-right text-[11px] text-muted">{r.dataYear}</td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => toggleCompare(r.country.iso3)}
                            aria-pressed={active}
                            aria-label={`${active ? "Quitar" : "Añadir"} ${r.country.nameEs} del gráfico`}
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-md border transition-colors ${
                              active
                                ? "border-terracotta bg-terracotta text-white"
                                : "border-ink/15 text-muted hover:bg-ink/5"
                            }`}
                          >
                            {active ? <Check size={12} /> : <span className="text-[13px] leading-none">+</span>}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          {topN !== "all" && rows.length > topN && (
            <p className="mt-2 text-[10px] text-muted">
              Mostrando {topN} de {rows.length} países. El CSV incluye todos los países filtrados.
            </p>
          )}
        </section>

        {/* Panel lateral */}
        <aside className="space-y-5">
          <div className="card p-4 sm:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              Resumen de la selección
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Stat label={peopleMode ? "Con PoU" : "Países"} value={String(allValues.length)} />
              {peopleMode && <Stat label="Con cifra oficial" value={String(rows.length)} />}
              <Stat label="Mediana" value={globalMedian == null ? "s/d" : formatValue(meta, globalMedian)} />
              <Stat label="Máximo" value={allValues.length ? formatValue(meta, Math.max(...allValues)) : "s/d"} />
              <Stat label="Mínimo" value={allValues.length ? formatValue(meta, Math.min(...allValues)) : "s/d"} />
            </div>
            <p className="mt-3 border-t border-ink/10 pt-2 text-[10px] leading-relaxed text-muted">
              {peopleMode
                ? `La mediana, el máximo y el mínimo son de prevalencia (PoU ${year}), no de personas. Solo ${rows.length} de esos ${allValues.length} países tienen además una cifra oficial de personas; su año puede ser anterior y se indica en la tabla.`
                : `Estadísticas descriptivas de los países con dato en ${year}. No son agregados poblacionales ni estimaciones regionales de la FAO.`}
            </p>
          </div>

          <div className="card p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                {peopleMode ? "Personas por continente" : "Mediana por continente"}
              </p>
              <BarChart3 size={14} className="text-muted" />
            </div>
            {regional.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Sin datos para los filtros seleccionados.</p>
            ) : (
              <div className="mt-3 space-y-2.5">
                {regional.map((r) => (
                  <div key={r.name}>
                    <div className="flex items-baseline justify-between gap-2 text-[11px]">
                      <span className="font-medium text-ink-2">{r.name}</span>
                      <span className="tabular text-muted">
                        {peopleMode ? fmtPeople(r.total) : formatAxis(meta, r.median)}
                        <span className="ml-1 text-[9px]">({r.n})</span>
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink/8">
                      <div
                        className="h-full rounded-full bg-terracotta/80"
                        style={{ width: `${maxRegional ? Math.max(2, (r.total / maxRegional) * 100) : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 border-t border-ink/10 pt-2 text-[10px] leading-relaxed text-muted">
              {peopleMode
                ? "Suma de las cifras oficiales de personas por país. Los años pueden variar y no es una estimación regional de la FAO."
                : "Mediana de los países con dato de cada continente, no una media ponderada por población. Entre paréntesis, número de países."}
            </p>
          </div>

          <div className="rounded-xl border border-ink/10 bg-paper-2/40 p-4 text-[11px] leading-relaxed text-muted">
            <p className="font-semibold uppercase tracking-wider text-ink-2">Cómo leer un ranking</p>
            <p className="mt-1.5">
              Un país pequeño puede tener una prevalencia altísima y pocas personas afectadas; un país grande
              puede tener una prevalencia moderada y millones de personas. Por eso ofrecemos las dos lecturas y
              nunca las presentamos como equivalentes.
            </p>
          </div>
        </aside>
      </div>

      {/* Gráfico multipaís */}
      <section className="mt-10" id="comparar">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="kicker text-terracotta">Comparación temporal</p>
            <h2 className="display mt-2 text-3xl sm:text-4xl">Compara hasta seis países</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              Añade países desde la tabla. La escala y el indicador son los mismos para todas las líneas; los
              huecos se muestran como huecos.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCompare(rows.slice(0, 5).map((r) => r.country.iso3))}
              className="rounded-full border border-ink/15 px-3 py-1.5 text-[11px] text-muted hover:bg-ink/5"
            >
              Añadir los 5 primeros
            </button>
            {compare.length > 0 && (
              <button
                type="button"
                onClick={() => setCompare([])}
                className="rounded-full border border-ink/15 px-3 py-1.5 text-[11px] text-muted hover:bg-ink/5"
              >
                Vaciar
              </button>
            )}
          </div>
        </div>

        {chartCountries.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {chartCountries.map((c, i) => (
              <span
                key={c.iso3}
                className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-[#fffdf8] px-2.5 py-1 text-[11px]"
              >
                <span className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                {c.nameEs}
                <button
                  type="button"
                  onClick={() => toggleCompare(c.iso3)}
                  aria-label={`Quitar ${c.nameEs}`}
                  className="text-muted hover:text-terracotta"
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 rounded-2xl border border-ink/10 bg-[#fffdf8] p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              {displayMeta.shortName} · {chartSeries.length} países
            </p>
            <p className="text-[10px] text-muted">
              {meta.source}
              {peopleMode ? " · serie de personas subalimentadas" : ""}
            </p>
          </div>
          <MultiCountryChart series={chartSeries} meta={displayMeta} />
        </div>
      </section>

      <p className="mt-8 border-t border-ink/10 pt-4 text-[10px] leading-relaxed text-muted">
        Fuente de los datos: Banco Mundial, indicadores de los ODS basados en FAO, UNICEF, OMS y OIT; series
        consultadas en noviembre de 2026. Metadatos, definiciones y limitaciones en{" "}
        <Link href="/metodologia" className="underline decoration-line underline-offset-2 hover:text-terracotta">
          la página de metodología
        </Link>
        . Los rankings son cálculos descriptivos propios sobre observaciones publicadas y no sustituyen las
        estimaciones oficiales de los organismos.
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</span>
      {children}
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-paper p-2.5">
      <p className="text-[9px] uppercase tracking-wider text-muted">{label}</p>
      <p className="tabular mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  );
}
