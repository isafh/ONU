"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Info,
  Loader2,
  MapPin,
  RotateCcw,
  Search,
  Shuffle,
  Sparkles,
  X,
} from "lucide-react";
import type { Country, IndicatorMeta, Series } from "@/lib/types";
import { useJson } from "@/lib/client-data";
import { pointsFor } from "@/lib/analysis";
import { buildScale, pickChallenge, type ChallengeView } from "@/lib/country";
import { fmtNumber, fmtPeople } from "@/lib/format";
import WorldMap from "@/components/map/WorldMap";

type SeriesFile = { generatedAt: string; series: Series };
type Step = "pick" | "estimate" | "result";

interface Props {
  countries: Country[];
  indicators: IndicatorMeta[];
  world: Record<string, [number, number][]>;
}

export default function MobileChallenge({ countries, indicators, world }: Props) {
  const seriesState = useJson<SeriesFile>("series.json");
  const topoState = useJson<unknown>("world-110m.topo.json");

  const [step, setStep] = useState<Step>("pick");
  const [selected, setSelected] = useState<string | null>(null);
  const [estimate, setEstimate] = useState(20);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const series = seriesState.data?.series;
  const loading = seriesState.status === "loading" || topoState.status === "loading";

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

  // Enlace directo desde el mapa móvil: /movil/desafio?pais=AFG
  useEffect(() => {
    if (typeof window === "undefined") return;
    const iso = new URLSearchParams(window.location.search).get("pais")?.toUpperCase();
    if (iso && countries.some((c) => c.iso3 === iso)) {
      setSelected(iso);
      setStep("estimate");
    }
  }, [countries]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const choose = (iso3: string) => {
    setSelected(iso3);
    setEstimate(20);
    setQuery("");
    setSearchOpen(false);
    setStep("estimate");
  };

  const randomCountry = () => {
    const pool = eligible.filter((c) => c.iso3 !== selected);
    if (!pool.length) return;
    choose(pool[Math.floor(Math.random() * pool.length)].iso3);
  };

  return (
    <div className="px-4 pb-6 pt-5">
      <div className="flex items-center justify-between">
        <p className="kicker text-terracotta">Desafío de estimación</p>
        <span className="rounded-full bg-ink/5 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-muted">
          Paso {step === "pick" ? 1 : step === "estimate" ? 2 : 3} de 3
        </span>
      </div>

      <StepBar step={step} />

      {step === "pick" && (
        <>
          <h1 className="display mt-5 text-3xl">Elige un país a ciegas</h1>
          <p className="mt-2 text-[12px] leading-relaxed text-muted">
            El mapa está en blanco: no verás colores ni cifras hasta confirmar tu estimación. Toca un país,
            búscalo o deja que el azar decida.
          </p>

          <div className="relative mt-4">
            <div className="flex items-center gap-2 rounded-full border border-ink/15 bg-[#fffdf8] px-3 py-2.5">
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
                className="w-full bg-transparent text-xs outline-none placeholder:text-muted/70"
                aria-label="Buscar país para el desafío"
                role="combobox"
                aria-expanded={searchOpen && results.length > 0}
                aria-controls="mobile-challenge-results"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} aria-label="Borrar búsqueda">
                  <X size={13} className="text-muted" />
                </button>
              )}
            </div>
            {searchOpen && query.trim() && (
              <ul
                id="mobile-challenge-results"
                className="absolute inset-x-0 z-30 mt-1.5 overflow-hidden rounded-xl border border-ink/15 bg-[#fffdf8] py-1 shadow-xl"
                role="listbox"
              >
                {results.length === 0 && <li className="px-4 py-3 text-xs text-muted">Sin resultados</li>}
                {results.map((c) => (
                  <li key={c.iso3} role="option" aria-selected={selected === c.iso3}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-xs hover:bg-ink/5"
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

          <div className="mt-4">
            {loading ? (
              <div className="flex h-[240px] items-center justify-center rounded-2xl border border-ink/10 bg-[#f2ecdf] text-xs text-muted">
                <Loader2 className="mr-2 animate-spin" size={15} /> Cargando mapa…
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
          </div>

          <button
            type="button"
            onClick={randomCountry}
            disabled={!eligible.length}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink/15 bg-[#fffdf8] px-4 py-3 text-xs font-medium disabled:opacity-50"
          >
            <Shuffle size={14} /> País al azar
          </button>

          <div className="mt-4 flex items-start gap-2 rounded-xl bg-paper-2/50 p-3 text-[10px] leading-relaxed text-muted">
            <Info size={13} className="mt-0.5 shrink-0 text-terracotta" />
            <p>
              El dato que buscarás es el mismo que colorea el mapa principal. Aquí los colores se ocultan
              para que la estimación no esté condicionada.
            </p>
          </div>
        </>
      )}

      {step === "estimate" && country && (
        <>
          <button
            type="button"
            onClick={() => setStep("pick")}
            className="mt-4 inline-flex items-center gap-1.5 text-[11px] text-muted hover:text-ink"
          >
            <ArrowLeft size={13} /> Elegir otro país
          </button>

          <div className="mt-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              {country.continent} · {country.regionEs}
            </p>
            <h1 className="display mt-1 text-3xl">{country.nameEs}</h1>
          </div>

          {!series ? (
            <div className="mt-8 flex items-center justify-center rounded-2xl border border-ink/10 bg-[#f2ecdf] py-14 text-xs text-muted">
              <Loader2 className="mr-2 animate-spin" size={15} /> Cargando el dato…
            </div>
          ) : !challenge ? (
            <div className="mt-5 rounded-2xl border border-dashed border-ink/20 bg-paper-2/40 p-5">
              <p className="font-serif text-xl">Sin dato para el desafío</p>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                {country.nameEs} no tiene observaciones de PoU ni de inseguridad alimentaria moderada o grave
                en esta base. No inventamos una cifra para completar el ejercicio.
              </p>
              <div className="mt-4 grid gap-2">
                <Link
                  href={`/pais/${country.iso3}/`}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-terracotta px-4 py-3 text-xs font-semibold text-white"
                >
                  Ver ficha del país <ArrowRight size={14} />
                </Link>
                <button
                  type="button"
                  onClick={randomCountry}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 px-4 py-2.5 text-xs font-medium"
                >
                  <Shuffle size={14} /> Probar con otro país
                </button>
              </div>
            </div>
          ) : (
            <EstimateStep
              challenge={challenge}
              country={country}
              estimate={estimate}
              setEstimate={setEstimate}
              onReveal={() => setStep("result")}
            />
          )}
        </>
      )}

      {step === "result" && country && challenge && (
        <>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              {country.continent} · {country.regionEs}
            </p>
            <button
              type="button"
              onClick={() => {
                setStep("pick");
                setSelected(null);
              }}
              className="inline-flex items-center gap-1.5 text-[11px] text-muted hover:text-ink"
            >
              <RotateCcw size={13} /> Otro país
            </button>
          </div>
          <h1 className="display mt-1 text-3xl">{country.nameEs}</h1>

          <ResultStep
            challenge={challenge}
            country={country}
            estimate={estimate}
            level={scale?.decile ? { level: scale.decile.level, label: scale.decile.label, n: scale.decile.n } : null}
            onRetry={() => setStep("estimate")}
          />
        </>
      )}

      {step !== "pick" && !country && (
        <div className="mt-6 rounded-2xl border border-dashed border-ink/20 p-5 text-sm text-muted">
          <p className="font-serif text-lg text-ink">Elige un país primero</p>
          <button
            type="button"
            onClick={() => setStep("pick")}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-terracotta px-4 py-2.5 text-xs font-semibold text-white"
          >
            Volver al mapa <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function StepBar({ step }: { step: Step }) {
  const active = step === "pick" ? 1 : step === "estimate" ? 2 : 3;
  return (
    <div className="mt-3 flex gap-1.5" aria-hidden="true">
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={`h-1 flex-1 rounded-full ${n <= active ? "bg-terracotta" : "bg-ink/10"}`}
        />
      ))}
    </div>
  );
}

function EstimateStep({
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
      <p className="mt-5 text-[10px] font-semibold uppercase tracking-wider text-muted">
        {challenge.shortName}
        {challenge.sdg ? ` · ODS ${challenge.sdg}` : ""} · {challenge.year}
      </p>
      <h2 className="mt-2 font-serif text-2xl leading-snug">
        ¿Qué porcentaje de la población de {country.nameEs} crees que{" "}
        {challenge.id === "pou" ? "padece hambre" : "vive en inseguridad alimentaria moderada o grave"}?
      </h2>

      {challenge.isFallback && (
        <div className="mt-3 flex gap-2 rounded-xl border border-amber/40 bg-amber/10 p-3 text-[11px] leading-relaxed text-[#6b4a12]">
          <Info size={15} className="mt-0.5 shrink-0" />
          <p>{challenge.fallbackReason}</p>
        </div>
      )}
      {challenge.stale && (
        <div className="mt-2 flex gap-2 rounded-xl border border-terracotta/30 bg-terracotta/5 p-3 text-[11px] leading-relaxed text-rust">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <p>{challenge.staleReason}</p>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-ink/10 bg-[#fffdf8] p-4">
        <div className="flex items-baseline justify-between">
          <label htmlFor="mobile-estimate" className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Tu respuesta
          </label>
          <output htmlFor="mobile-estimate" className="display text-4xl tabular text-terracotta">
            {fmtNumber(estimate, 1)} %
          </output>
        </div>
        <input
          id="mobile-estimate"
          type="range"
          min={0}
          max={100}
          step={0.5}
          value={estimate}
          onChange={(e) => setEstimate(Number(e.target.value))}
          className="hunger-range mt-3"
          aria-valuetext={`${estimate} por ciento`}
        />
        <div className="mt-1 flex justify-between text-[9px] text-muted">
          <span>0 %</span>
          <span>25 %</span>
          <span>50 %</span>
          <span>75 %</span>
          <span>100 %</span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 rounded-full border border-ink/15 bg-paper px-3 py-2">
            <label htmlFor="mobile-estimate-number" className="text-[10px] text-muted">
              Escribir
            </label>
            <input
              id="mobile-estimate-number"
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={estimate}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (Number.isFinite(v)) setEstimate(Math.min(100, Math.max(0, v)));
              }}
              className="w-14 bg-transparent text-right text-sm font-semibold tabular outline-none"
            />
            <span className="text-xs text-muted">%</span>
          </div>
          <span className="text-[9px] text-muted">Sin penalización</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onReveal}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-terracotta px-4 py-3.5 text-sm font-semibold text-white"
      >
        Confirmar y ver el dato <Check size={16} />
      </button>

      <p className="mt-3 text-[10px] leading-relaxed text-muted">
        Indicador: {challenge.name}
        {challenge.sdg ? ` (ODS ${challenge.sdg})` : ""}. Año: {challenge.year}. Fuente: {challenge.source}.
      </p>
    </>
  );
}

function ResultStep({
  challenge,
  country,
  estimate,
  level,
  onRetry,
}: {
  challenge: ChallengeView;
  country: Country;
  estimate: number;
  level: { level: number; label: string; n: number } | null;
  onRetry: () => void;
}) {
  const real = challenge.value;
  const abs = Math.abs(estimate - real);
  const diff = estimate - real;
  const direction = diff > 0 ? "superior" : diff < 0 ? "inferior" : "igual";
  const ratio = real > 0 ? estimate / real : null;
  const display = challenge.id === "pou" && real === 2.5 ? "< 2,5 %" : `${fmtNumber(real, 1)} %`;

  return (
    <>
      <div className="mt-4 rounded-2xl border border-ink/10 bg-[#fffdf8] p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
          Dato oficial · {challenge.shortName} · {challenge.year}
        </p>
        <p className="display mt-1 text-5xl text-rust">{display}</p>
        <p className="mt-1 text-[10px] leading-relaxed text-muted">
          {challenge.name}. Fuente: {challenge.source}.
        </p>
        {challenge.isFallback && (
          <p className="mt-2 rounded-lg bg-amber/10 p-2 text-[10px] leading-relaxed text-[#6b4a12]">
            Sustituto explícito: no es prevalencia de subalimentación.
          </p>
        )}
      </div>

      <div className="mt-4 space-y-4">
        <ComparisonBar label="Tu estimación" value={estimate} color="#d99a2b" />
        <ComparisonBar label="Dato oficial" value={real} color="#b4472e" display={display} />
      </div>

      <div className="mt-4 rounded-xl border border-ink/10 bg-paper-2/50 p-3.5">
        <p className="text-[12px] leading-relaxed">
          Tu estimación fue <strong className="tabular">{fmtNumber(abs, 1)} puntos</strong>{" "}
          {direction === "igual" ? "igual al dato oficial." : `${direction} al dato oficial.`}
          {ratio != null && ratio > 0 && (
            <>
              {" "}Representa <strong className="tabular">{fmtNumber(ratio, 1)}×</strong> el valor medido.
            </>
          )}
        </p>
        <p className="mt-1.5 text-[10px] leading-relaxed text-muted">
          {abs <= 2
            ? "Muy cerca del dato oficial."
            : abs <= 5
              ? "Cerca, con una diferencia moderada."
              : abs <= 10
                ? "Hay una distancia apreciable."
                : "La diferencia es grande: revisa qué mide el indicador y a qué año corresponde."}
        </p>
      </div>

      <div className="mt-3 grid gap-2">
        <div className="rounded-xl border border-ink/10 p-3.5">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted">Personas afectadas</p>
          {challenge.people ? (
            <>
              <p className="tabular mt-0.5 font-serif text-2xl">{fmtPeople(challenge.people.value)}</p>
              <p className="text-[10px] leading-relaxed text-muted">
                Cifra oficial ({challenge.people.year}). Estimación modelizada de la FAO.
              </p>
            </>
          ) : (
            <>
              <p className="mt-0.5 text-sm font-medium">Datos no disponibles</p>
              <p className="text-[10px] leading-relaxed text-muted">
                No se calcula multiplicando la prevalencia por la población.
              </p>
            </>
          )}
        </div>

        {level && (
          <div className="rounded-xl border border-ink/10 p-3.5">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-muted">Magnitud relativa</p>
            <p className="mt-0.5 text-[12px] leading-relaxed">
              Nivel <strong className="tabular">{level.level} de 10</strong>: {level.label}.
            </p>
            <p className="text-[9px] leading-relaxed text-muted">
              Deciles de {level.n} países con dato ese año. Relativo, no clínico.
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-2">
        <Link
          href={`/movil/mapa?pais=${country.iso3}`}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-terracotta px-4 py-3 text-sm font-semibold text-white"
        >
          <MapPin size={15} /> Ver el dato en el mapa
        </Link>
        <Link
          href={`/pais/${country.iso3}/`}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 px-4 py-2.5 text-xs font-medium"
        >
          Ficha completa del país <ArrowRight size={14} />
        </Link>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-[11px] text-muted"
        >
          <Sparkles size={13} /> Volver a estimar este país
        </button>
      </div>

      <p className="mt-3 text-[9px] leading-relaxed text-muted">
        El dato es el mismo que colorea el mapa principal. Este proyecto no es una publicación oficial de las
        Naciones Unidas.
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
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-medium text-ink-2">{label}</span>
        <span className="tabular text-base font-semibold" style={{ color }}>
          {display ?? `${fmtNumber(value, 1)} %`}
        </span>
      </div>
      <div className="h-6 overflow-hidden rounded-md bg-ink/5" role="img" aria-label={`${label}: ${value} por ciento`}>
        <div
          className="h-full rounded-md transition-[width] duration-700"
          style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }}
        />
      </div>
    </div>
  );
}
