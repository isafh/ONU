"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Info,
  Loader2,
  MapPin,
  RotateCcw,
  Search,
  Shuffle,
  X,
} from "lucide-react";
import type { Country, IndicatorMeta, Series } from "@/lib/types";
import { useJson } from "@/lib/client-data";
import { pointsFor } from "@/lib/analysis";
import { buildScale, pickChallenge, type ChallengeView } from "@/lib/country";
import { fmtNumber, fmtPeople } from "@/lib/format";
import WorldMap from "@/components/map/WorldMap";

type SeriesFile = { generatedAt: string; series: Series };

interface Props {
  countries: Country[];
  indicators: IndicatorMeta[];
  world: Record<string, [number, number][]>;
}

export default function ChallengeExplorer({ countries, indicators, world }: Props) {
  const seriesState = useJson<SeriesFile>("series.json");
  const topoState = useJson<unknown>("world-110m.topo.json");

  const [selected, setSelected] = useState<string | null>(null);
  const [estimate, setEstimate] = useState(20);
  const [revealed, setRevealed] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const series = seriesState.data?.series;
  const loading = seriesState.status === "loading" || topoState.status === "loading";
  const error =
    seriesState.status === "error" ? seriesState.error : topoState.status === "error" ? topoState.error : null;

  const country = useMemo(
    () => (selected ? countries.find((c) => c.iso3 === selected) ?? null : null),
    [selected, countries],
  );

  const challenge = useMemo(
    () => (country && series ? pickChallenge(country, series, indicators) : null),
    [country, series, indicators],
  );

  const scale = useMemo(
    () =>
      country && challenge && series
        ? buildScale(country, countries, series, challenge.id, challenge.year, challenge.value, world)
        : null,
    [country, challenge, series, countries, world],
  );

  const names = useMemo(() => Object.fromEntries(countries.map((c) => [c.iso3, c.nameEs])), [countries]);

  const eligible = useMemo(() => {
    if (!series) return [];
    return countries.filter(
      (c) => pointsFor(series, c.iso3, "pou").length > 0 || pointsFor(series, c.iso3, "msfi").length > 0,
    );
  }, [countries, series]);

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

  const choose = (iso3: string) => {
    setSelected(iso3);
    setRevealed(false);
    setEstimate(20);
    setQuery("");
    setSearchOpen(false);
  };

  const randomCountry = () => {
    const pool = eligible.filter((c) => c.iso3 !== selected);
    if (!pool.length) return;
    choose(pool[Math.floor(Math.random() * pool.length)].iso3);
  };

  // En pantallas pequeñas el panel queda debajo del mapa: al elegir un país
  // llevamos la vista al panel para que la selección tenga respuesta visible.
  useEffect(() => {
    if (!selected) return;
    if (typeof window === "undefined" || !window.matchMedia("(max-width: 1023px)").matches) return;
    document.getElementById("desafio-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selected]);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker text-terracotta">Desafío de estimación</p>
          <h1 className="display mt-2 text-4xl sm:text-5xl">Predice el dato sin ver el color</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Este mapa está en blanco a propósito: si estuviera coloreado, el color ya sería la respuesta.
            Elige un país, estima su prevalencia de hambre y confirma. Después verás el dato oficial y podrás
            consultarlo también en el mapa principal.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-ink/15 bg-[#fffdf8] px-3 py-1.5 text-[11px] text-muted">
          <Info size={13} />
          Sin colores ni cifras hasta confirmar
        </div>
      </div>

      {/* Controles */}
      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative">
          <div className="flex items-center gap-2 rounded-full border border-ink/15 bg-[#fffdf8] px-3 py-2">
            <Search size={14} className="text-muted" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && results[0]) choose(results[0].iso3);
                if (e.key === "Escape") setSearchOpen(false);
              }}
              placeholder="Buscar un país…"
              className="w-52 bg-transparent text-xs outline-none placeholder:text-muted/70"
              aria-label="Buscar país para el desafío"
              role="combobox"
              aria-expanded={searchOpen && results.length > 0}
              aria-controls="challenge-search-results"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Borrar búsqueda">
                <X size={13} className="text-muted" />
              </button>
            )}
          </div>
          {searchOpen && query.trim() && (
            <ul
              id="challenge-search-results"
              className="absolute left-0 z-30 mt-2 w-72 overflow-hidden rounded-xl border border-ink/15 bg-[#fffdf8] py-1 shadow-xl"
              role="listbox"
            >
              {results.length === 0 && <li className="px-4 py-3 text-xs text-muted">Sin resultados</li>}
              {results.map((c) => (
                <li key={c.iso3} role="option" aria-selected={selected === c.iso3}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-xs hover:bg-ink/5"
                    onClick={() => choose(c.iso3)}
                  >
                    <span className="font-medium">{c.nameEs}</span>
                    <span className="text-[10px] text-muted">{c.regionEs}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={randomCountry}
            disabled={!eligible.length}
            className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-xs font-medium text-ink transition-colors hover:bg-ink/5 disabled:opacity-50"
          >
            <Shuffle size={14} /> País al azar
          </button>
          <Link
            href="/mapa"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs text-muted transition-colors hover:text-ink"
          >
            <MapPin size={13} /> Ir al mapa principal
          </Link>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-terracotta/30 bg-terracotta/5 p-5 text-sm text-rust">
          No se pudieron cargar los datos del desafío: {error}. Ejecuta <code>npm run data</code> para
          regenerar la base.
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          {loading ? (
            <div className="flex h-[420px] items-center justify-center rounded-2xl border border-ink/10 bg-[#f2ecdf] text-sm text-muted">
              <Loader2 className="mr-2 animate-spin" size={16} /> Cargando mapa y series…
            </div>
          ) : (
            <WorldMap
              topology={topoState.data}
              values={{}}
              names={names}
              indicator="pou"
              selected={selected}
              onSelect={choose}
              accentLabel="Dato oculto"
              blind
            />
          )}

          <div className="mt-4 rounded-xl border border-ink/10 bg-[#fffdf8] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Por qué el mapa está en blanco
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-ink-2">
              La escala de color del mapa principal revela el dato de cada país. Aquí se oculta para que la
              estimación sea tuya: todos los países comparten el mismo relleno y el cursor solo muestra el
              nombre. No hay trampa en los datos: la respuesta es exactamente la misma que aparece en el
              mapa principal.
            </p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-ink/10 pt-3 text-[11px] text-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-[3px] border border-ink/20 bg-[#e6ddcb]" /> País sin dato visible
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-[3px] border border-ink bg-[#cdbfa4]" /> País seleccionado
              </span>
            </div>
          </div>
        </div>

        {/* Panel */}
        <aside id="desafio-panel" className="scroll-mt-20 lg:sticky lg:top-20 lg:self-start">
          {!country ? (
            <div className="rounded-2xl border border-dashed border-ink/20 bg-paper-2/40 p-6 text-sm text-muted">
              <p className="font-serif text-xl text-ink">Elige un país</p>
              <p className="mt-2 leading-relaxed">
                Haz clic en el mapa o búscalo por nombre. Primero verás la pregunta; el dato oficial solo
                aparece cuando confirmes tu estimación.
              </p>
              <ol className="mt-5 space-y-2 text-[11px] leading-relaxed">
                <li className="rounded-lg bg-paper p-3">
                  <strong className="text-ink">1. Elige.</strong> Puedes usar «País al azar» para no escoger
                  solo los casos que ya conoces.
                </li>
                <li className="rounded-lg bg-paper p-3">
                  <strong className="text-ink">2. Estima.</strong> Mueve el control o escribe un porcentaje
                  entre 0 y 100.
                </li>
                <li className="rounded-lg bg-paper p-3">
                  <strong className="text-ink">3. Compara.</strong> Verás el dato oficial, las personas
                  afectadas y el enlace al mapa principal.
                </li>
              </ol>
              <button
                type="button"
                onClick={randomCountry}
                disabled={!eligible.length}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-terracotta px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-rust disabled:opacity-50"
              >
                <Shuffle size={14} /> Elegir un país al azar
              </button>
            </div>
          ) : !challenge ? (
            <div className="card overflow-hidden">
              <PanelHeader country={country} onClose={() => setSelected(null)} />
              <div className="px-5 py-5">
                <p className="font-serif text-xl leading-snug">Sin dato para el desafío</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {country.nameEs} no tiene observaciones de prevalencia de subalimentación (PoU) ni de
                  inseguridad alimentaria moderada o grave (FIES) en esta base. No inventamos una cifra para
                  completar el ejercicio.
                </p>
                <div className="mt-5 flex flex-col gap-2">
                  <Link
                    href={`/pais/${country.iso3}/`}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-terracotta px-4 py-3 text-sm font-semibold text-white hover:bg-rust"
                  >
                    Ver ficha del país <ArrowRight size={15} />
                  </Link>
                  <button
                    type="button"
                    onClick={randomCountry}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 px-4 py-2.5 text-xs font-medium hover:bg-ink/5"
                  >
                    <Shuffle size={14} /> Probar con otro país
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <PanelHeader
                country={country}
                onClose={() => setSelected(null)}
                result={revealed}
              />

              <div className="px-5 py-5">
                {!revealed ? (
                  <BeforeReveal
                    challenge={challenge}
                    country={country}
                    estimate={estimate}
                    setEstimate={setEstimate}
                    onReveal={() => setRevealed(true)}
                  />
                ) : (
                  <AfterReveal
                    challenge={challenge}
                    country={country}
                    estimate={estimate}
                    scaleLevel={scale?.decile ?? null}
                    onReset={() => setRevealed(false)}
                    onOther={randomCountry}
                  />
                )}
              </div>
            </div>
          )}
        </aside>
      </div>

      <p className="mt-8 max-w-3xl border-t border-ink/10 pt-4 text-[11px] leading-relaxed text-muted">
        El desafío usa el mismo indicador y el mismo año que la ficha del país: prevalencia de subalimentación
        (ODS 2.1.1) y, solo si no existe, inseguridad alimentaria moderada o grave (ODS 2.1.2) con aviso
        explícito. No se interpola ni se calcula una cifra propia. Las respuestas y la metodología completa
        están en <Link href="/metodologia#experiencia" className="underline decoration-line underline-offset-2 hover:text-terracotta">Metodología</Link>.
      </p>
    </div>
  );
}

function PanelHeader({
  country,
  onClose,
  result = false,
}: {
  country: Country;
  onClose: () => void;
  result?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-ink/10 bg-paper-2/60 px-5 py-4">
      <div>
        <p className="kicker text-[10px] text-muted">
          {result ? "Resultado" : "Tu predicción"} · {country.continent}
        </p>
        <h2 className="mt-1 font-serif text-2xl leading-tight">{country.nameEs}</h2>
        <p className="mt-0.5 text-[11px] text-muted">{country.regionEs}</p>
      </div>
      <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-ink/10" aria-label="Cerrar panel">
        <X size={15} />
      </button>
    </div>
  );
}

function BeforeReveal({
  challenge,
  country,
  estimate,
  setEstimate,
  onReveal,
}: {
  challenge: ChallengeView;
  country: Country;
  estimate: number;
  setEstimate: (n: number) => void;
  onReveal: () => void;
}) {
  return (
    <>
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
        {challenge.shortName}
        {challenge.sdg ? ` · ODS ${challenge.sdg}` : ""} · {challenge.year}
      </p>
      <h3 className="mt-2 font-serif text-xl leading-snug">
        ¿Qué porcentaje de la población de {country.nameEs} crees que{" "}
        {challenge.id === "pou" ? "padece hambre" : "vive en inseguridad alimentaria moderada o grave"}?
      </h3>

      {challenge.isFallback && (
        <div className="mt-4 flex gap-2.5 rounded-xl border border-amber/40 bg-amber/10 p-3.5 text-[12px] leading-relaxed text-[#6b4a12]">
          <Info size={16} className="mt-0.5 shrink-0" />
          <p>{challenge.fallbackReason}</p>
        </div>
      )}
      {challenge.stale && (
        <div className="mt-3 flex gap-2.5 rounded-xl border border-terracotta/30 bg-terracotta/5 p-3.5 text-[12px] leading-relaxed text-rust">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <p>{challenge.staleReason}</p>
        </div>
      )}

      <div className="mt-6">
        <div className="flex items-baseline justify-between">
          <label htmlFor="challenge-estimate" className="text-xs font-medium uppercase tracking-wider text-muted">
            Tu respuesta
          </label>
          <output htmlFor="challenge-estimate" className="display text-3xl tabular text-terracotta">
            {fmtNumber(estimate, 1)} %
          </output>
        </div>
        <input
          id="challenge-estimate"
          type="range"
          min={0}
          max={100}
          step={0.5}
          value={estimate}
          onChange={(e) => setEstimate(Number(e.target.value))}
          className="hunger-range mt-3"
          aria-valuetext={`${estimate} por ciento`}
        />
        <div className="mt-1 flex justify-between text-[10px] text-muted">
          <span>0 %</span>
          <span>25 %</span>
          <span>50 %</span>
          <span>75 %</span>
          <span>100 %</span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-ink/15 bg-paper px-3 py-2">
            <label htmlFor="challenge-estimate-number" className="text-[11px] text-muted">
              Escribir
            </label>
            <input
              id="challenge-estimate-number"
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={estimate}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (Number.isFinite(v)) setEstimate(Math.min(100, Math.max(0, v)));
              }}
              className="w-16 bg-transparent text-right text-sm font-semibold tabular outline-none"
            />
            <span className="text-sm text-muted">%</span>
          </div>
          <button
            type="button"
            onClick={onReveal}
            className="inline-flex items-center gap-2 rounded-full bg-terracotta px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rust"
          >
            Confirmar y ver el dato
            <Check size={16} />
          </button>
        </div>
      </div>

      <p className="mt-4 border-t border-ink/10 pt-3 text-[11px] leading-relaxed text-muted">
        Indicador: {challenge.name}
        {challenge.sdg ? ` (ODS ${challenge.sdg})` : ""}. Año del dato: {challenge.year}. Fuente:{" "}
        {challenge.source}. La pregunta se refiere a este indicador concreto, no a una percepción general de
        «hambre».
      </p>
    </>
  );
}

function AfterReveal({
  challenge,
  country,
  estimate,
  scaleLevel,
  onReset,
  onOther,
}: {
  challenge: ChallengeView;
  country: Country;
  estimate: number;
  scaleLevel: { level: number; label: string; n: number } | null;
  onReset: () => void;
  onOther: () => void;
}) {
  const real = challenge.value;
  const diff = estimate - real;
  const abs = Math.abs(diff);
  const direction = diff > 0 ? "superior" : diff < 0 ? "inferior" : "igual";
  const ratio = real > 0 ? estimate / real : null;
  const displayReal = challenge.id === "pou" && real === 2.5 ? "< 2,5 %" : `${fmtNumber(real, 1)} %`;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            {challenge.shortName} · {challenge.year}
          </p>
          <h3 className="mt-1 font-serif text-xl leading-snug">Tu estimación frente al dato oficial</h3>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 text-[11px] text-muted hover:bg-ink/5"
        >
          <RotateCcw size={13} /> Cambiar
        </button>
      </div>

      <div className="mt-6 space-y-5">
        <ComparisonBar label="Tu estimación" value={estimate} color="#d99a2b" />
        <ComparisonBar label={`Dato oficial (${challenge.year})`} value={real} color="#b4472e" display={displayReal} />
      </div>

      <div className="mt-5 rounded-xl border border-ink/10 bg-paper-2/50 p-4">
        <p className="text-sm leading-relaxed">
          Tu estimación fue <strong className="tabular">{fmtNumber(abs, 1)} puntos porcentuales</strong>{" "}
          {direction === "igual" ? "igual al dato oficial." : `${direction} al dato oficial.`}
          {ratio != null && ratio > 0 && (
            <>
              {" "}Representa aproximadamente <strong className="tabular">{fmtNumber(ratio, 1)}×</strong> el
              valor medido.
            </>
          )}
        </p>
        <p className="mt-2 text-[12px] leading-relaxed text-muted">
          {abs <= 2
            ? "Tu percepción está muy cerca del dato oficial para este indicador y año."
            : abs <= 5
              ? "Tu percepción está cerca, con una diferencia moderada."
              : abs <= 10
                ? "Hay una distancia apreciable entre tu percepción y el dato oficial."
                : "La diferencia es grande. Vale la pena revisar qué indica exactamente el indicador y qué año cubre."}
        </p>
      </div>

      <div className="mt-4 grid gap-3">
        <div className="rounded-xl border border-ink/10 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Dato oficial</p>
          <p className="tabular mt-1 font-serif text-3xl">{displayReal}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">
            {challenge.name} · {challenge.year}. Fuente: {challenge.source}.
          </p>
          {challenge.isFallback && (
            <p className="mt-2 text-[11px] leading-relaxed text-[#6b4a12]">
              Sustituto explícito: no es prevalencia de subalimentación.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-ink/10 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Personas afectadas (cifra oficial)
          </p>
          {challenge.people ? (
            <>
              <p className="tabular mt-1 font-serif text-2xl">{fmtPeople(challenge.people.value)}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">
                Serie «personas subalimentadas» ({challenge.people.year}). Estimación modelizada de la FAO, no
                un conteo individual.
              </p>
            </>
          ) : (
            <>
              <p className="mt-1 text-sm font-medium">Datos no disponibles</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">
                No la calculamos multiplicando la prevalencia por la población: sería una estimación propia.
              </p>
            </>
          )}
        </div>

        {scaleLevel && (
          <div className="rounded-xl border border-ink/10 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              Magnitud relativa en el mundo
            </p>
            <p className="mt-1 text-sm leading-relaxed">
              Nivel <strong className="tabular">{scaleLevel.level} de 10</strong>: {scaleLevel.label}.
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-muted">
              Deciles de {scaleLevel.n} países con dato ese año. Es una posición relativa, no una escala
              clínica: el nivel 1 no significa «sin hambre».
            </p>
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-2">
        <Link
          href={`/mapa/?pais=${country.iso3}`}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-terracotta px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-rust"
        >
          Ver el dato en el mapa principal <ArrowRight size={15} />
        </Link>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/pais/${country.iso3}/`}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-ink/15 px-4 py-2.5 text-xs font-medium hover:bg-ink/5"
          >
            Ficha del país
          </Link>
          <button
            type="button"
            onClick={onOther}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-ink/15 px-4 py-2.5 text-xs font-medium hover:bg-ink/5"
          >
            <Shuffle size={14} /> Otro país
          </button>
        </div>
      </div>

      <p className="mt-3 text-[10px] leading-relaxed text-muted">
        El mapa principal colorea los países con la misma escala que oculta este mapa. Este proyecto no es una
        publicación oficial de las Naciones Unidas.
      </p>
    </>
  );
}

function ComparisonBar({
  label,
  value,
  color,
  display,
}: {
  label: string;
  value: number;
  color: string;
  display?: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-[12px] font-medium text-ink-2">{label}</span>
        <span className="tabular text-lg font-semibold" style={{ color }}>
          {display ?? `${fmtNumber(value, 1)} %`}
        </span>
      </div>
      <div className="h-7 overflow-hidden rounded-md bg-ink/5" role="img" aria-label={`${label}: ${value} por ciento`}>
        <div
          className="h-full rounded-md transition-[width] duration-700"
          style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }}
        />
      </div>
    </div>
  );
}
