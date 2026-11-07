"use client";

import { AlertTriangle, ArrowDownRight, ArrowUpRight, Check, Info, RotateCcw } from "lucide-react";
import type { AcuteView, ChallengeView, GrfcSlim } from "@/lib/country";
import { fmtNumber, fmtPct, fmtPeople } from "@/lib/format";
import { DataNote, SourceLink } from "./ui";

export default function EstimateChallenge({
  challenge,
  countryName,
  population,
  acute,
  grfc,
  estimate,
  setEstimate,
  revealed,
  onReveal,
  onReset,
}: {
  challenge: ChallengeView;
  countryName: string;
  population: { value: number; year: number } | null;
  acute: AcuteView | null;
  grfc: GrfcSlim | null;
  estimate: number;
  setEstimate: (n: number) => void;
  revealed: boolean;
  onReveal: () => void;
  onReset: () => void;
}) {
  const real = challenge.value;
  const diff = estimate - real;
  const abs = Math.abs(diff);
  const direction = diff > 0 ? "superior" : diff < 0 ? "inferior" : "igual";
  const ratio = real > 0 ? estimate / real : null;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="card p-5 sm:p-7">
        {!revealed ? (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Tu estimación · {challenge.shortName} · {challenge.year}
            </p>
            <h3 className="mt-2 font-serif text-2xl leading-snug sm:text-[28px]">
              ¿Qué porcentaje de la población de {countryName} crees que {challenge.id === "pou" ? "padece hambre" : "vive en inseguridad alimentaria moderada o grave"}?
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-ink-2">
              Mueve el control o escribe un número entre 0 y 100. Después confirmarás tu respuesta y verás el
              dato oficial. No hay penalización por acertar o fallar: el objetivo es comparar tu percepción con
              la medición.
            </p>

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

            <div className="mt-7">
              <div className="flex items-baseline justify-between">
                <label htmlFor="estimate" className="text-xs font-medium uppercase tracking-wider text-muted">
                  Tu respuesta
                </label>
                <output htmlFor="estimate" className="display text-4xl tabular text-terracotta">
                  {fmtNumber(estimate, 1)} %
                </output>
              </div>
              <input
                id="estimate"
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
                  <label htmlFor="estimate-number" className="text-[11px] text-muted">
                    Escribir
                  </label>
                  <input
                    id="estimate-number"
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
                  className="inline-flex items-center gap-2 rounded-full bg-terracotta px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-rust"
                >
                  Confirmar y ver el dato
                  <Check size={16} />
                </button>
              </div>
            </div>

            <DataNote>
              Indicador: {challenge.name}
              {challenge.sdg ? ` (ODS ${challenge.sdg})` : ""}. Año del dato: {challenge.year}. Fuente:{" "}
              {challenge.source}. La pregunta se refiere a este indicador concreto, no a una percepción general
              de «hambre».
            </DataNote>
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Resultado · {challenge.shortName} · {challenge.year}
                </p>
                <h3 className="mt-1 font-serif text-2xl leading-snug">
                  Tu estimación frente al dato oficial
                </h3>
              </div>
              <button
                type="button"
                onClick={onReset}
                className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 text-[11px] text-muted hover:bg-ink/5"
              >
                <RotateCcw size={13} /> Cambiar
              </button>
            </div>

            <div className="mt-7 space-y-6">
              <ComparisonBar label="Tu estimación" value={estimate} color="#d99a2b" suffix="%" />
              <ComparisonBar
                label={`Dato oficial (${challenge.year})`}
                value={real}
                color="#b4472e"
                suffix="%"
                display={challenge.id === "pou" && real === 2.5 ? "< 2,5 %" : undefined}
                note={challenge.id === "pou" && real === 2.5 ? "La FAO informa «menos del 2,5 %» con el valor 2,5." : undefined}
              />
            </div>

            <div className="mt-7 rounded-xl border border-ink/10 bg-paper-2/50 p-4">
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

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-ink/10 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Personas afectadas (cifra oficial)
                </p>
                {challenge.people ? (
                  <>
                    <p className="tabular mt-1 font-serif text-2xl">{fmtPeople(challenge.people.value)}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted">
                      Serie «personas subalimentadas» ({challenge.people.year}). Es una estimación modelizada de
                      la FAO, no un conteo individual.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mt-1 text-sm font-medium">Datos no disponibles</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted">
                      No hay una serie oficial de número de personas para este indicador. No la calculamos
                      multiplicando la prevalencia por la población: sería una estimación propia.
                    </p>
                  </>
                )}
              </div>
              <div className="rounded-xl border border-ink/10 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Población total</p>
                {population ? (
                  <>
                    <p className="tabular mt-1 font-serif text-2xl">{fmtPeople(population.value)}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted">
                      {population.year}. Se usa solo como contexto; no es un indicador de hambre.
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-sm">Datos no disponibles</p>
                )}
              </div>
            </div>

            {challenge.isFallback && (
              <DataNote>
                <strong>Este dato no es prevalencia de subalimentación.</strong> {challenge.fallbackReason}
              </DataNote>
            )}
            {challenge.stale && (
              <DataNote>
                <strong>Aviso de antigüedad:</strong> {challenge.staleReason}
              </DataNote>
            )}
            <DataNote>
              Fuente: {challenge.source}. El dato corresponde a {challenge.year}; no se interpola ni se
              actualiza con estimaciones propias.
            </DataNote>
          </>
        )}
      </div>

      <aside className="space-y-5">
        <AcutePanel acute={acute} grfc={grfc} />
        <div className="rounded-xl border border-ink/10 bg-paper-2/40 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Recuerda</p>
          <p className="mt-2 text-[12px] leading-relaxed text-muted">
            «Hambre» en este sitio equivale a subalimentación (ODS 2.1.1). La inseguridad alimentaria
            moderada o grave (ODS 2.1.2) y la inseguridad alimentaria aguda (IPC) miden dimensiones distintas.
            Un país puede empeorar en una y mejorar en otra.
          </p>
          <p className="mt-3 text-[12px] leading-relaxed text-muted">
            Fuente metodológica:{" "}
            <SourceLink href="https://www.fao.org/publications/sofi/2026/en">SOFI 2026</SourceLink>.
          </p>
        </div>
      </aside>
    </div>
  );
}

function ComparisonBar({
  label,
  value,
  color,
  suffix,
  note,
  display,
}: {
  label: string;
  value: number;
  color: string;
  suffix: string;
  note?: string;
  display?: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-[12px] font-medium text-ink-2">{label}</span>
        <span className="tabular text-lg font-semibold" style={{ color }}>
          {display ?? `${fmtNumber(value, 1)} ${suffix}`}
        </span>
      </div>
      <div className="h-7 overflow-hidden rounded-md bg-ink/5" role="img" aria-label={`${label}: ${value} por ciento`}>
        <div
          className="h-full rounded-md transition-[width] duration-700"
          style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }}
        />
      </div>
      {note && <p className="mt-1 text-[10px] text-muted">{note}</p>}
    </div>
  );
}

function AcutePanel({ acute, grfc }: { acute: AcuteView | null; grfc: GrfcSlim | null }) {
  if (!acute) {
    return (
      <div className="card p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
          Inseguridad alimentaria aguda
        </p>
        <p className="mt-2 text-sm font-medium">Datos no disponibles</p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted">
          Este país no aparece en la base del GRFC/IPC con una evaluación de crisis alimentaria aguda. No se
          deduce a partir de otros indicadores.
        </p>
      </div>
    );
  }

  const max = grfc ? Math.max(...grfc.history.map((h) => h.phase3plusPct ?? 0), 1) : 1;

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-ink/10 bg-olive/8 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-olive">
            Inseguridad alimentaria aguda · IPC
          </p>
          {acute.origin === "pma-override" && (
            <span className="rounded-full bg-amber/20 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#7a500c]">
              Sustitución explícita
            </span>
          )}
        </div>
        <p className="tabular mt-1 text-2xl font-semibold text-ink">
          {fmtPct(acute.phase3plusPct)}{" "}
          <span className="text-[11px] font-normal text-muted">de la población analizada</span>
        </p>
        <p className="mt-0.5 text-[11px] text-ink-2">
          {acute.phase3plus == null ? "Personas: datos no disponibles" : `${fmtPeople(acute.phase3plus)} de personas en Fase 3 o superior`}
        </p>
      </div>
      <div className="p-4">
        <p className="text-[11px] leading-relaxed text-ink-2">
          Periodo: <strong>{acute.period}</strong>. Año de referencia: {acute.year}. Fuente:{" "}
          <SourceLink href={acute.url}>{acute.sourceLabel}</SourceLink>.
        </p>
        {acute.note && <p className="mt-2 text-[11px] leading-relaxed text-muted">{acute.note}</p>}
        {acute.stale && (
          <p className="mt-2 flex gap-1.5 text-[11px] leading-relaxed text-rust">
            <AlertTriangle size={13} className="mt-0.5 shrink-0" />
            Dato no reciente en la base: úsalo como referencia histórica, no como situación actual.
          </p>
        )}

        {grfc && grfc.history.length > 1 && (
          <div className="mt-4 border-t border-ink/10 pt-3">
            <p className="text-[10px] uppercase tracking-wider text-muted">Serie en la base GRFC</p>
            <div className="mt-2 flex items-end gap-1.5" aria-hidden="true">
              {grfc.history.map((h) => (
                <div key={h.year} className="group flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-sm bg-olive/60 transition-colors group-hover:bg-olive"
                    style={{ height: `${Math.max(3, ((h.phase3plusPct ?? 0) / max) * 46)}px` }}
                    title={`${h.year}: ${h.phase3plusPct ?? "s/d"} %`}
                  />
                  <span className="text-[8px] text-muted">{String(h.year).slice(2)}</span>
                </div>
              ))}
            </div>
            <p className="mt-1 text-[9px] leading-relaxed text-muted">
              % de población analizada en Fase 3+. Los años y las coberturas de análisis varían.
            </p>
          </div>
        )}

        {acute.origin === "pma-override" && (
          <div className="mt-3 flex gap-1.5 rounded-lg bg-amber/10 p-2.5 text-[10px] leading-relaxed text-[#6b4a12]">
            <Info size={13} className="mt-0.5 shrink-0" />
            <p>
              La base del GRFC no tiene una evaluación reciente de este territorio. Se muestra el dato del PMA
              en un bloque separado para no presentar una cifra de 2022 como si fuera actual.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
