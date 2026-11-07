"use client";

import { AlertCircle, Info } from "lucide-react";
import type { ContextItem, GrfcSlim } from "@/lib/country";
import type { CauseItem, Country, CountryProfile } from "@/lib/types";
import { fmtNumber, fmtPeople } from "@/lib/format";
import { DataNote, EvidenceBadge, SourceLink } from "./ui";

const TAG_LABEL: Record<string, string> = {
  conflict: "Conflicto",
  economic: "Crisis económica",
  climate: "Clima",
  production: "Producción",
  access: "Acceso a alimentos",
  poverty: "Pobreza",
  inequality: "Desigualdad",
  displacement: "Desplazamiento",
  nutrition: "Nutrición",
  infrastructure: "Infraestructura",
};

export default function CausesSection({
  country,
  profile,
  grfc,
  context,
}: {
  country: Country;
  profile: CountryProfile | null;
  grfc: GrfcSlim | null;
  context: ContextItem[];
}) {
  const causes = profile?.causes ?? [];
  const hypotheses = profile?.hypotheses ?? [];

  if (!profile) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-dashed border-ink/20 bg-paper-2/40 p-6">
          <div className="flex gap-2.5">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-terracotta" />
            <div>
              <p className="font-serif text-xl">Sin perfil verificado de causas para {country.nameEs}</p>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                Esta base incluye perfiles detallados para 12 países. Para {country.nameEs} no hay un perfil
                con causas específicas verificado, así que no repetimos automáticamente las mismas causas de
                otros países ni inventamos una explicación. Mostramos solo lo que las fuentes documentan.
              </p>
            </div>
          </div>
        </div>

        {grfc ? (
          <div className="card p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              Conductores documentados por el GRFC
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Principal", value: grfc.drivers.primary },
                { label: "Secundario", value: grfc.drivers.secondary },
                { label: "Terciario", value: grfc.drivers.tertiary },
              ].map((d) => (
                <div key={d.label} className="rounded-lg border border-ink/10 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted">{d.label}</p>
                  <p className="mt-1 text-sm font-medium">{d.value ?? "Datos no disponibles"}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted">
              El GRFC identifica estos conductores para el país en su última evaluación con datos
              {grfc.drivers.year ? ` (${grfc.drivers.year})` : ""}. No son una lista exhaustiva de causas ni
              una relación causal demostrada: son la clasificación de contexto de la crisis alimentaria aguda.
              {grfc.protracted && " La crisis se considera prolongada."}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-ink/10 p-5 text-sm text-muted">
            Tampoco hay un registro del GRFC que identifique conductores para este país. Los datos disponibles
            son los de contexto que aparecen abajo.
          </div>
        )}

        {context.length > 0 && <ContextGrid context={context} />}

        <DataNote>
          Para añadir un perfil verificado de este país hay que documentar sus causas con fuentes primarias
          (GRFC, IPC, FAO, PMA u organismos nacionales). Mientras tanto, la aplicación no completa el vacío con
          texto genérico.
        </DataNote>
      </div>
    );
  }

  const documented = causes.filter((c) => c.type === "documented");
  const contributing = causes.filter((c) => c.type === "contributing");

  return (
    <div className="space-y-6">
      <div className="card bg-[#fffdf8] p-5 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Contexto del país</p>
        <p className="mt-2 max-w-4xl text-sm leading-relaxed text-ink-2">{profile.context}</p>
      </div>

      {documented.length > 0 && (
        <CauseGroup title="Causas documentadas" items={documented} />
      )}
      {contributing.length > 0 && (
        <CauseGroup
          title="Factores contribuyentes"
          intro="La evidencia los asocia al hambre, pero no permiten atribuir una relación causal única con los datos disponibles."
          items={contributing}
        />
      )}
      {hypotheses.length > 0 && (
        <CauseGroup
          title="Hipótesis"
          intro="Explicaciones plausibles que no están verificadas para este país en las fuentes consultadas. Se muestran separadas para no confundirlas con evidencia."
          items={hypotheses}
        />
      )}

      <div className="rounded-xl border border-ink/10 bg-paper-2/40 p-4 text-[11px] leading-relaxed text-muted">
        <p className="font-semibold uppercase tracking-wider text-ink-2">Cómo leer estas causas</p>
        <p className="mt-1.5">
          Una causa «documentada» aparece identificada como conductor o factor en la fuente citada. Un «factor
          contribuyente» está asociado al hambre en la literatura y en los datos, pero no se puede aislar como
          causa única. Una «hipótesis» es una explicación razonable que aún no está verificada. Ninguna de estas
          etiquetas implica que la causa sea la única ni que actuar sobre ella garantice el resultado.
        </p>
      </div>

      {context.length > 0 && <ContextGrid context={context} />}

      {profile.caveat && (
        <div className="flex gap-2.5 rounded-xl border border-amber/35 bg-amber/8 p-4 text-[11px] leading-relaxed text-[#6b4a12]">
          <Info size={15} className="mt-0.5 shrink-0" />
          <p>{profile.caveat}</p>
        </div>
      )}

      <DataNote>
        Perfil actualizado el {profile.updated}. Las fuentes de cada causa se enlazan en la tarjeta correspondiente.
        Los datos de contexto proceden del Banco Mundial/FAO y pueden corresponder a años distintos; se indica
        el año en cada cifra.
      </DataNote>
    </div>
  );
}

function CauseGroup({
  title,
  intro,
  items,
}: {
  title: string;
  intro?: string;
  items: CauseItem[];
}) {
  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-serif text-xl">{title}</h3>
        <span className="tabular text-[11px] text-muted">{items.length} factores</span>
      </div>
      {intro && <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-muted">{intro}</p>}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {items.map((c, i) => (
          <article key={`${c.title}-${i}`} className="card flex h-full flex-col p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <span className="font-serif text-2xl text-line">{String(i + 1).padStart(2, "0")}</span>
              <EvidenceBadge type={c.type} />
            </div>
            <h4 className="mt-2 font-serif text-lg leading-snug">{c.title}</h4>
            {c.tag && (
              <span className="mt-1.5 w-fit rounded-full bg-ink/5 px-2 py-0.5 text-[10px] text-muted">
                {TAG_LABEL[c.tag] ?? c.tag}
              </span>
            )}
            <p className="mt-2 flex-1 text-[13px] leading-relaxed text-ink-2">{c.detail}</p>
            <p className="mt-3 border-t border-ink/10 pt-2 text-[10px] leading-relaxed text-muted">
              {c.url ? <SourceLink href={c.url}>{c.source}</SourceLink> : c.source}
              {c.year ? ` · ${c.year}` : ""}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ContextGrid({ context }: { context: ContextItem[] }) {
  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-serif text-xl">Datos de contexto</h3>
        <span className="text-[11px] text-muted">No son medidas de hambre</span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {context.map((item) => (
          <div key={item.id} className="rounded-xl border border-ink/10 bg-[#fffdf8] p-3.5" title={item.source}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{item.shortName}</p>
            <p className="tabular mt-1 text-lg font-semibold">{formatContext(item)}</p>
            <p className="mt-0.5 text-[10px] text-muted">
              {item.year}
              {item.note ? ` · ${item.note}` : ""}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-muted">
        Fuente: Banco Mundial/FAO, series WDI. Solo se muestran observaciones de 2015 en adelante. Los
        indicadores contextuales no se usan como prueba causal.
      </p>
    </section>
  );
}

function formatContext(item: ContextItem): string {
  if (item.id === "population") return fmtPeople(item.value);
  if (item.id === "gdp_pc") return `${fmtNumber(item.value, 0)} USD PPA`;
  if (item.unit.startsWith("%") || item.unit.includes("porcentaje")) return `${fmtNumber(item.value, 1)} %`;
  if (item.id === "food_prod") return `${fmtNumber(item.value, 1)} (base 100)`;
  return fmtNumber(item.value, item.decimals);
}
