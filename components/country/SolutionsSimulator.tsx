"use client";

import {
  Check,
  ChevronDown,
  CloudSun,
  Handshake,
  HeartPulse,
  Info,
  Package,
  ShieldCheck,
  Sprout,
  Tractor,
  Utensils,
  Wallet,
  Wheat,
  X,
} from "lucide-react";
import type { Measure } from "@/lib/types";
import { fmtNumber } from "@/lib/format";
import { SourceLink } from "./ui";

const ICONS: Record<string, typeof Package> = {
  package: Package,
  wallet: Wallet,
  utensils: Utensils,
  sprout: Sprout,
  tractor: Tractor,
  shield: ShieldCheck,
  "heart-pulse": HeartPulse,
  "cloud-sun": CloudSun,
  wheat: Wheat,
  handshake: Handshake,
};

const HORIZON_LABEL = {
  inmediato: "Respuesta inmediata",
  "corto plazo": "Corto plazo",
  "largo plazo": "Largo plazo",
} as const;

const EVIDENCE_LABEL = {
  fuerte: "Evidencia fuerte",
  moderada: "Evidencia moderada",
  limitada: "Evidencia limitada",
} as const;

const COST_LABEL = { alto: "Coste alto", medio: "Coste medio", bajo: "Coste bajo" } as const;
const COVERAGE_LABEL = { amplia: "Cobertura amplia", media: "Cobertura media", focalizada: "Cobertura focalizada" } as const;

const TAG_LABEL: Record<string, string> = {
  conflict: "Conflicto",
  economic: "Crisis económica",
  climate: "Clima",
  production: "Producción",
  access: "Acceso",
  poverty: "Pobreza",
  inequality: "Desigualdad",
  displacement: "Desplazamiento",
  nutrition: "Nutrición",
  infrastructure: "Infraestructura",
};

export default function SolutionsSimulator({
  measures,
  selectedIds,
  onToggle,
  onClear,
  onEvaluate,
  evaluated,
  acuteLabel,
}: {
  measures: Measure[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onClear: () => void;
  onEvaluate: () => void;
  evaluated: boolean;
  acuteLabel: string | null;
}) {
  const selected = measures.filter((m) => selectedIds.includes(m.id));
  const addressed = [...new Set(selected.flatMap((m) => m.addresses))];

  return (
    <div>
      <div className="rounded-xl border border-ink/10 bg-paper-2/40 p-4 text-[12px] leading-relaxed text-muted">
        <p>
          Asume el papel de responsable de la respuesta. Puedes combinar hasta seis medidas. No hay una
          respuesta «correcta»: la evaluación mostrará qué causas cubres, qué queda fuera y qué tensiones
          aparecen al aplicarlas en {acuteLabel ?? "este contexto"}.
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {measures.map((m) => {
          const Icon = ICONS[m.icon] ?? Package;
          const active = selectedIds.includes(m.id);
          return (
            <article
              key={m.id}
              className={`card flex h-full flex-col overflow-hidden transition-all ${
                active ? "border-terracotta/60 ring-1 ring-terracotta/30" : ""
              }`}
            >
              <div className="flex items-start gap-3 p-4 pb-3">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    active ? "bg-terracotta text-white" : "bg-ink/5 text-ink-2"
                  }`}
                >
                  <Icon size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-serif text-[17px] leading-tight">{m.name}</h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted">{m.summary}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 px-4">
                <Tag>{HORIZON_LABEL[m.horizon]}</Tag>
                <Tag>{EVIDENCE_LABEL[m.evidence]}</Tag>
                <Tag>{COST_LABEL[m.cost]}</Tag>
                <Tag>{COVERAGE_LABEL[m.coverage]}</Tag>
              </div>

              <div className="flex flex-wrap gap-1 px-4 pt-2">
                {m.addresses.map((t) => (
                  <span key={t} className="rounded-full bg-olive/10 px-2 py-0.5 text-[9px] text-olive">
                    {TAG_LABEL[t] ?? t}
                  </span>
                ))}
              </div>

              <div className="mt-3 flex-1 px-4">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 border-t border-ink/10 pt-2.5 text-[11px] font-medium text-ink-2 hover:text-terracotta">
                    Objetivo, resultados y límites
                    <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="mt-2 space-y-2.5 text-[11px] leading-relaxed text-ink-2">
                    <p>{m.description}</p>
                    <p>
                      <strong className="text-ink">Objetivo:</strong> {m.objective}
                    </p>
                    <p>
                      <strong className="text-ink">Población beneficiaria:</strong> {m.beneficiaries}
                    </p>
                    <p>
                      <strong className="text-ink">Organismos:</strong> {m.agencies.join(", ")}.
                    </p>
                    <p>
                      <strong className="text-ink">Dónde se ha implementado:</strong> {m.implementedIn.join(", ")}.
                    </p>
                    <div>
                      <strong className="text-ink">Resultados documentados:</strong>
                      {m.results.length === 0 ? (
                        <p className="mt-1 rounded bg-amber/10 p-2 text-[10px] text-[#6b4a12]">
                          No se verificaron resultados cuantitativos en las fuentes consultadas. La medida puede
                          estar en ejecución, pero esta base no atribuye un resultado no documentado.
                        </p>
                      ) : (
                        <ul className="mt-1 space-y-2">
                          {m.results.map((r) => (
                            <li key={r.claim} className="rounded bg-paper-2/60 p-2">
                              <p>{r.claim}</p>
                              <p className="mt-1 text-[10px] text-muted">
                                <SourceLink href={r.url}>{r.source}</SourceLink> · {r.year}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div>
                      <strong className="text-ink">Limitaciones:</strong>
                      <ul className="mt-1 list-disc space-y-1 pl-4 text-muted">
                        {m.limitations.map((l) => (
                          <li key={l}>{l}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </details>
              </div>

              <div className="p-4 pt-3">
                <button
                  type="button"
                  onClick={() => onToggle(m.id)}
                  aria-pressed={active}
                  className={`inline-flex w-full items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-semibold transition-colors ${
                    active
                      ? "bg-ink text-paper hover:bg-ink/90"
                      : "border border-ink/20 text-ink hover:bg-ink/5"
                  }`}
                >
                  {active ? <X size={13} /> : <Check size={13} />}
                  {active ? "Quitar de mi respuesta" : "Añadir a mi respuesta"}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-ink/15 bg-[#fffdf8] p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              Tu respuesta · {selected.length} {selected.length === 1 ? "medida" : "medidas"}
            </p>
            <p className="mt-1 text-sm text-ink-2">
              {selected.length === 0
                ? "Selecciona al menos dos medidas para poder evaluar cómo se complementan."
                : selected.map((m) => m.shortName).join(" · ")}
            </p>
            {addressed.length > 0 && (
              <p className="mt-1 text-[11px] text-muted">
                Dimensiones cubiertas: {addressed.map((t) => TAG_LABEL[t] ?? t).join(", ")}.
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selected.length > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="rounded-full border border-ink/15 px-3 py-2 text-[11px] text-muted hover:bg-ink/5"
              >
                Limpiar
              </button>
            )}
            <button
              type="button"
              onClick={onEvaluate}
              disabled={selected.length === 0}
              className="inline-flex items-center gap-1.5 rounded-full bg-terracotta px-4 py-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-rust disabled:cursor-not-allowed disabled:opacity-40"
            >
              Evaluar mis decisiones
            </button>
          </div>
        </div>
        {selected.length === 1 && (
          <p className="mt-3 flex items-start gap-1.5 border-t border-ink/10 pt-2.5 text-[11px] leading-relaxed text-muted">
            <Info size={13} className="mt-0.5 shrink-0" />
            Una sola medida rara vez aborda causas múltiples. Puedes combinar respuesta inmediata, protección
            social y medidas estructurales.
          </p>
        )}
        {evaluated && (
          <p className="mt-2 text-[10px] text-muted">
            La evaluación está más abajo y se actualiza cuando cambias la selección.
          </p>
        )}
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[9px] text-muted">{children}</span>;
}
