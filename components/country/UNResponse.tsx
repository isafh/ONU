"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleDashed, Info, MinusCircle } from "lucide-react";
import type { CountryProfile, Measure, Country } from "@/lib/types";
import { matchWithUN } from "@/lib/country";
import { StatusBadge, SourceLink } from "./ui";

const STATUS_HELP = [
  {
    status: "propuesta" as const,
    text: "Recomendación o diseño que no consta como adoptado ni financiado.",
  },
  {
    status: "anunciada" as const,
    text: "Meta o programa anunciado; no se verificó su ejecución completa.",
  },
  {
    status: "en-ejecucion" as const,
    text: "Operación en curso; las cifras pueden describir necesidad o alcance, no efecto medido.",
  },
  {
    status: "resultados" as const,
    text: "Existe al menos un resultado cuantitativo verificable en la fuente citada.",
  },
];

export default function UNResponse({
  country,
  profile,
  measures,
  selected,
}: {
  country: Country;
  profile: CountryProfile | null;
  measures: Measure[];
  selected: Measure[];
}) {
  const interventions = profile?.unResponse ?? [];
  const comparison = matchWithUN(selected, profile);
  const nameOf = (id: string) => measures.find((m) => m.id === id)?.shortName ?? id;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-ink/10 bg-deep p-5 text-paper sm:p-7">
        <p className="kicker text-amber-soft">La respuesta real</p>
        <h2 className="display mt-3 max-w-3xl text-3xl text-paper sm:text-4xl">
          ¿QUÉ ESTÁ HACIENDO REALMENTE LA ONU?
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-paper/70">
          Solo mostramos intervenciones y resultados que aparecen en las fuentes citadas. Cuando una fuente
          describe la escala de la necesidad pero no una cifra de personas alcanzadas o de impacto, lo decimos:
          no convertimos una proyección en un resultado.
        </p>
      </div>

      <div className="card p-4 sm:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
          Cómo leer el estado de cada intervención
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {STATUS_HELP.map((s) => (
            <div key={s.status} className="rounded-lg border border-ink/10 p-3">
              <StatusBadge status={s.status} />
              <p className="mt-2 text-[10px] leading-relaxed text-muted">{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      {profile && interventions.length > 0 ? (
        interventions.map((u, i) => (
          <article key={`${u.programme}-${i}`} className="card overflow-hidden">
            <div className="border-b border-ink/10 bg-paper-2/50 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                    Programa documentado · {country.nameEs}
                  </p>
                  <h3 className="mt-1 font-serif text-2xl leading-tight">{u.programme}</h3>
                  <p className="mt-1 text-[11px] text-muted">{u.agencies.join(" · ")}</p>
                </div>
                <StatusBadge status={u.status} />
              </div>
              {u.statusNote && (
                <p className="mt-3 flex gap-1.5 rounded-lg bg-[#fffdf8] p-2.5 text-[11px] leading-relaxed text-muted">
                  <Info size={13} className="mt-0.5 shrink-0" />
                  {u.statusNote}
                </p>
              )}
            </div>
            <div className="grid gap-5 p-5 sm:grid-cols-2">
              <Block title="Objetivos" text={u.objectives} />
              <Block title="Intervenciones principales" text={u.interventions} />
              <Block title="Resultados disponibles" text={u.results} accent />
              <Block title="Dificultades y limitaciones" text={u.limitations} />
            </div>
            <div className="border-t border-ink/10 px-5 py-3 text-[10px] text-muted">
              Fuentes:{" "}
              {u.sources.map((s, idx) => (
                <span key={s.url}>
                  {idx > 0 && " · "}
                  <SourceLink href={s.url}>{s.label}</SourceLink> ({s.year})
                </span>
              ))}
            </div>
          </article>
        ))
      ) : (
        <div className="rounded-xl border border-dashed border-ink/20 bg-paper-2/40 p-6">
          <p className="font-serif text-xl">Sin intervención verificada para {country.nameEs} en esta base</p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            No hemos verificado un programa específico para este país en las fuentes consultadas. No
            atribuimos a la ONU acciones que no estén documentadas. Puedes consultar las medidas con
            resultados verificados en otros contextos en la biblioteca de programas y en la página de
            metodología.
          </p>
          <Link href="/metodologia#fuentes" className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-terracotta hover:text-rust">
            Ver fuentes y metodología <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {profile?.adaptation && (
        <article className="rounded-2xl border border-olive/30 bg-olive/5 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-olive">
            Experiencia documentada en otro país
          </p>
          <h3 className="mt-1 font-serif text-xl">
            {profile.adaptation.country}: {profile.adaptation.strategy}
          </h3>
          <p className="mt-1 text-[11px] text-muted">{profile.adaptation.organisation}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Resultados</p>
              <p className="mt-1 text-[12px] leading-relaxed text-ink-2">{profile.adaptation.results}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                ¿Podría adaptarse a {country.nameEs}?
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-ink-2">{profile.adaptation.applicability}</p>
            </div>
          </div>
          <p className="mt-3 border-t border-olive/20 pt-2 text-[10px] text-muted">
            Fuente: <SourceLink href={profile.adaptation.source.url}>{profile.adaptation.source.label}</SourceLink>{" "}
            ({profile.adaptation.source.year}). Es una experiencia de otro país, no una intervención en {country.nameEs}.
          </p>
        </article>
      )}

      <div className="card p-5 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
          Tu selección frente a la respuesta documentada
        </p>
        {selected.length === 0 ? (
          <div className="mt-2">
            <p className="text-sm leading-relaxed text-muted">
              Todavía no has seleccionado medidas. Elige algunas en el simulador para ver qué coincide con la
              respuesta documentada y qué queda fuera.
            </p>
            <a href="#soluciones" className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-terracotta hover:text-rust">
              Ir al simulador <ArrowRight size={13} />
            </a>
          </div>
        ) : (
          <>
            <p className="mt-1 text-sm leading-relaxed text-ink-2">
              De las {selected.length} medidas que elegiste, <strong>{comparison.matched.length}</strong>{" "}
              {comparison.matched.length === 1 ? "aparece" : "aparecen"} también entre las intervenciones
              documentadas para {country.nameEs} en esta base.
            </p>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <CompareList
                title="Coinciden"
                items={comparison.matched.map(nameOf)}
                icon={<CheckCircle2 size={13} className="text-olive" />}
                empty="Ninguna coincidencia directa."
              />
              <CompareList
                title="Solo en tu respuesta"
                items={comparison.userOnly.map(nameOf)}
                icon={<CircleDashed size={13} className="text-amber" />}
                empty="Todas tus medidas coinciden."
              />
              <CompareList
                title="Solo en la respuesta documentada"
                items={comparison.unOnly.map(nameOf)}
                icon={<MinusCircle size={13} className="text-muted" />}
                empty="No hay medidas documentadas fuera de tu selección."
              />
            </div>
            <p className="mt-4 border-t border-ink/10 pt-3 text-[10px] leading-relaxed text-muted">
              La comparación se limita a las diez medidas de esta biblioteca y a los programas que pudimos
              verificar en las fuentes citadas. Que una medida aparezca como «solo en tu respuesta» no significa
              que la ONU no la esté aplicando: significa que no encontramos evidencia de ello en esta base.
            </p>
          </>
        )}
      </div>

      <div className="flex gap-2.5 rounded-xl border border-ink/10 bg-paper-2/40 p-4 text-[11px] leading-relaxed text-muted">
        <Info size={15} className="mt-0.5 shrink-0 text-terracotta" />
        <p>
          Esta sección distingue entre medidas propuestas, programas anunciados, intervenciones en ejecución y
          resultados efectivamente demostrados. Las cifras de personas en necesidad no son resultados de la
          ONU: describen la magnitud del problema que la respuesta intenta atender.
        </p>
      </div>
    </div>
  );
}

function Block({ title, text, accent = false }: { title: string; text: string; accent?: boolean }) {
  return (
    <div className={accent ? "rounded-lg bg-terracotta/5 p-3" : ""}>
      <p className={`text-[10px] font-semibold uppercase tracking-wider ${accent ? "text-rust" : "text-muted"}`}>
        {title}
      </p>
      <p className="mt-1 text-[12px] leading-relaxed text-ink-2">{text}</p>
    </div>
  );
}

function CompareList({
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
    <div className="rounded-lg border border-ink/10 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{title}</p>
      {items.length === 0 ? (
        <p className="mt-1.5 text-[11px] text-muted">{empty}</p>
      ) : (
        <ul className="mt-1.5 space-y-1">
          {items.map((i) => (
            <li key={i} className="flex items-start gap-1.5 text-[11px] leading-relaxed text-ink-2">
              <span className="mt-0.5 shrink-0">{icon}</span>
              {i}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
