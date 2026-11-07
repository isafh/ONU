"use client";

import { AlertCircle, ArrowRight, CheckCircle2, Info, Scale } from "lucide-react";
import type { Evaluation } from "@/lib/country";
import type { Country } from "@/lib/types";
import { fmtNumber } from "@/lib/format";

export default function EvaluationPanel({
  evaluation,
  country,
  evaluated,
  onEvaluate,
  selectedCount,
}: {
  evaluation: Evaluation;
  country: Country;
  evaluated: boolean;
  onEvaluate: () => void;
  selectedCount: number;
}) {
  if (!evaluated) {
    return (
      <div className="rounded-2xl border border-dashed border-ink/20 bg-paper-2/40 p-6">
        <p className="font-serif text-xl">Aún no has evaluado tu respuesta</p>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Cuando termines de elegir medidas, pulsa el botón. La evaluación no es una nota: compara tu
          selección con las causas identificadas en {country.nameEs}, señala qué dimensiones cubres, qué
          queda fuera y qué tensiones prácticas aparecen.
        </p>
        <button
          type="button"
          onClick={onEvaluate}
          disabled={selectedCount === 0}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-[12px] font-semibold text-paper transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Evaluar mi selección
          <ArrowRight size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Cobertura de causas" value={`${evaluation.coveragePct} %`} help="Dimensiones de las causas del país que al menos una medida seleccionada aborda." />
        <Metric label="Medidas inmediatas" value={String(evaluation.horizon.inmediato)} help="Ayuda de emergencia, nutrición o protección." />
        <Metric label="Medidas de largo plazo" value={String(evaluation.horizon["largo plazo"])} help="Producción, infraestructura, protección social o sistemas alimentarios." />
        <Metric label="Coste alto" value={String(evaluation.highCost)} help="Medidas con coste alto según la biblioteca de programas." />
      </div>

      <div className="card p-5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Cobertura de las causas identificadas</p>
        <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-ink/8">
          <div className="h-full bg-terracotta transition-[width] duration-500" style={{ width: `${evaluation.coveragePct}%` }} />
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted">
          {evaluation.coveragePct === 0
            ? "Ninguna de las dimensiones identificadas queda cubierta de forma directa por tu selección."
            : `Cubres ${evaluation.coveragePct} % de las dimensiones asociadas a las causas del país. La cobertura no mide la intensidad ni la calidad de la aplicación.`}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <List
          title="Puntos fuertes de tu enfoque"
          items={evaluation.strengths}
          icon={<CheckCircle2 size={15} className="text-olive" />}
          empty="No se identificaron fortalezas con la selección actual."
        />
        <List
          title="Dimensiones que quedan fuera"
          items={evaluation.gaps}
          icon={<AlertCircle size={15} className="text-terracotta" />}
          empty="No se detectaron vacíos evidentes respecto a las causas documentadas."
        />
      </div>

      <List
        title="Tensiones y trade-offs"
        items={evaluation.tradeoffs}
        icon={<Scale size={15} className="text-amber" />}
        empty="No se detectaron tensiones relevantes con la selección actual."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Horizonte temporal</p>
          <div className="mt-3 space-y-2 text-[11px]">
            {(["inmediato", "corto plazo", "largo plazo"] as const).map((k) => {
              const total = Math.max(1, selectedCount);
              return (
                <div key={k} className="flex items-center gap-2">
                  <span className="w-24 text-muted">{k === "inmediato" ? "Inmediato" : k === "corto plazo" ? "Corto plazo" : "Largo plazo"}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/8">
                    <div className="h-full rounded-full bg-olive/70" style={{ width: `${(evaluation.horizon[k] / total) * 100}%` }} />
                  </div>
                  <span className="tabular w-4 text-right">{evaluation.horizon[k]}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Base de evidencia</p>
          <div className="mt-3 space-y-2 text-[11px]">
            {(["fuerte", "moderada", "limitada"] as const).map((k) => {
              const total = Math.max(1, selectedCount);
              return (
                <div key={k} className="flex items-center gap-2">
                  <span className="w-24 capitalize text-muted">{k}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/8">
                    <div className="h-full rounded-full bg-terracotta/70" style={{ width: `${(evaluation.evidence[k] / total) * 100}%` }} />
                  </div>
                  <span className="tabular w-4 text-right">{evaluation.evidence[k]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex gap-2.5 rounded-xl border border-ink/10 bg-paper-2/40 p-4 text-[11px] leading-relaxed text-muted">
        <Info size={15} className="mt-0.5 shrink-0 text-terracotta" />
        <p>
          Esta evaluación es una ayuda para razonar, no un veredicto. Se basa en las causas registradas para{" "}
          {country.nameEs}, en los atributos declarados de cada medida y en reglas explícitas de cobertura y
          horizonte. No mide la calidad de la ejecución ni garantiza resultados. Un porcentaje alto de
          cobertura no implica que la estrategia sea viable con la financiación y el acceso disponibles.
        </p>
      </div>
    </div>
  );
}

function Metric({ label, value, help }: { label: string; value: string; help: string }) {
  return (
    <div className="card p-4" title={help}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="display mt-1 text-3xl">{value}</p>
      <p className="mt-1 text-[10px] leading-relaxed text-muted">{help}</p>
    </div>
  );
}

function List({
  title,
  items,
  icon,
  empty,
}: {
  title: string;
  items: string[];
  icon: React.ReactNode;
  empty: string;
}) {
  return (
    <div className="card p-5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{title}</p>
      {items.length === 0 ? (
        <p className="mt-2 text-[12px] text-muted">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {items.map((item, i) => (
            <li key={`${item}-${i}`} className="flex gap-2 text-[12px] leading-relaxed text-ink-2">
              <span className="mt-0.5 shrink-0">{icon}</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
