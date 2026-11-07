import type { ReactNode } from "react";
import type { EvidenceType, ProgrammeStatus } from "@/lib/types";

export function EvidenceBadge({ type }: { type: EvidenceType }) {
  const map = {
    documented: {
      label: "Causa documentada",
      cls: "bg-rust/10 text-rust",
      title: "La fuente citada identifica este factor como causa o conductor de la crisis.",
    },
    contributing: {
      label: "Factor contribuyente",
      cls: "bg-amber/15 text-[#8a5c10]",
      title: "La evidencia lo asocia al hambre, pero no se puede atribuir como causa única con los datos disponibles.",
    },
    hypothesis: {
      label: "Hipótesis",
      cls: "bg-ink/8 text-muted",
      title: "Explicación plausible que no está verificada para este país en las fuentes consultadas.",
    },
  } as const;
  const item = map[type];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${item.cls}`}
      title={item.title}
    >
      {item.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: ProgrammeStatus }) {
  const map: Record<ProgrammeStatus, { label: string; cls: string }> = {
    propuesta: { label: "Propuesta", cls: "border border-ink/25 text-muted" },
    anunciada: { label: "Anunciada", cls: "bg-amber/20 text-[#7a500c]" },
    "en-ejecucion": { label: "En ejecución", cls: "bg-olive/15 text-olive" },
    resultados: { label: "Resultados demostrados", cls: "bg-rust/12 text-rust" },
  };
  const item = map[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${item.cls}`}>
      {item.label}
    </span>
  );
}

export function SectionHeading({
  phase,
  kicker,
  title,
  intro,
  id,
}: {
  phase: string;
  kicker: string;
  title: string;
  intro?: ReactNode;
  id: string;
}) {
  return (
    <div id={id} className="scroll-mt-28">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-semibold text-paper tabular">
          {phase}
        </span>
        <p className="kicker text-terracotta">{kicker}</p>
      </div>
      <h2 className="display mt-4 max-w-3xl text-3xl sm:text-4xl">{title}</h2>
      {intro && <div className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{intro}</div>}
    </div>
  );
}

export function DataNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 border-t border-ink/10 pt-3 text-[11px] leading-relaxed text-muted">{children}</p>
  );
}

export function SourceLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="underline decoration-line underline-offset-2 transition-colors hover:text-terracotta"
    >
      {children}
    </a>
  );
}
