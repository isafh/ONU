"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  MapPin,
  RotateCcw,
  Sparkles,
  Users,
} from "lucide-react";
import type { CountryView } from "@/lib/country";
import { evaluateMeasures } from "@/lib/country";
import { fmtNumber, fmtPct, fmtPeople, fmtPou } from "@/lib/format";
import EstimateChallenge from "./EstimateChallenge";
import SeverityScale from "./SeverityScale";
import CausesSection from "./CausesSection";
import SolutionsSimulator from "./SolutionsSimulator";
import EvaluationPanel from "./EvaluationPanel";
import UNResponse from "./UNResponse";
import { SectionHeading } from "./ui";

const NAV = [
  { id: "estimar", label: "1. Estima" },
  { id: "datos", label: "2. Datos" },
  { id: "escala", label: "3. Escala" },
  { id: "causas", label: "4. Causas" },
  { id: "soluciones", label: "5. Soluciones" },
  { id: "evaluacion", label: "6. Evaluación" },
  { id: "onu", label: "7. ONU" },
];

export default function CountryExperience({ view }: { view: CountryView }) {
  const { country, challenge, scale, context, profile, acute, grfc, measures, featured } = view;
  const [estimate, setEstimate] = useState(20);
  const [revealed, setRevealed] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [evaluated, setEvaluated] = useState(false);

  const selected = useMemo(
    () => measures.filter((m) => selectedIds.includes(m.id)),
    [measures, selectedIds],
  );

  const evaluation = useMemo(
    () =>
      evaluateMeasures(
        selected,
        profile,
        country,
        Boolean(context.find((c) => c.id === "stunting" || c.id === "wasting")),
      ),
    [selected, profile, country, context],
  );

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 6) return prev;
      return [...prev, id];
    });
  };

  const msfi = context.find((c) => c.id === "msfi");
  const sfi = context.find((c) => c.id === "sfi");
  const stunting = context.find((c) => c.id === "stunting");
  const pop = challenge?.population ?? null;

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div>
      {/* Cabecera */}
      <section className="border-b border-ink/10 bg-paper-2/40">
        <div className="mx-auto max-w-7xl px-4 pb-8 pt-6 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-[11px] text-muted" aria-label="Migas de pan">
            <Link href="/mapa" className="inline-flex items-center gap-1 hover:text-terracotta">
              <ArrowLeft size={12} /> Mapa
            </Link>
            <span>/</span>
            <span>{country.continent}</span>
            <span>/</span>
            <span className="text-ink-2">{country.nameEs}</span>
          </nav>

          <div className="mt-5 grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
            <div>
              <p className="kicker text-terracotta">
                {country.regionEs} · {country.incomeEs}
              </p>
              <h1 className="display mt-2 text-4xl sm:text-5xl lg:text-6xl">{country.nameEs}</h1>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ink-2">
                {profile?.context ??
                  `${country.nameEs} aparece en la base con datos de contexto, pero no dispone de un perfil verificado de causas y respuesta en esta edición. La aplicación muestra solo los indicadores disponibles y evita atribuir explicaciones no documentadas.`}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] text-muted">
                <span className="rounded-full bg-ink/5 px-2.5 py-1">Capital: {country.capital || "—"}</span>
                <span className="rounded-full bg-ink/5 px-2.5 py-1">ISO3: {country.iso3}</span>
                <span className="rounded-full bg-ink/5 px-2.5 py-1">
                  {profile ? "Perfil verificado" : "Sin perfil verificado"}
                </span>
                {profile?.updated && (
                  <span className="rounded-full bg-ink/5 px-2.5 py-1">Actualizado: {profile.updated}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <QuickStat
                label={challenge ? challenge.shortName : "Prevalencia"}
                value={challenge ? (challenge.id === "pou" ? fmtPou(challenge.value) : fmtPct(challenge.value)) : "s/d"}
                sub={challenge ? `Año ${challenge.year}` : "Datos no disponibles"}
                accent
              />
              <QuickStat
                label="Inseguridad aguda (IPC)"
                value={acute ? fmtPct(acute.phase3plusPct) : "s/d"}
                sub={acute ? `${acute.period}` : "Sin evaluación GRFC"}
              />
              <QuickStat
                label={
                  challenge?.id === "pou" && msfi
                    ? "Inseguridad alimentaria"
                    : sfi
                      ? "Inseguridad grave"
                      : "Población"
                }
                value={
                  challenge?.id === "pou" && msfi
                    ? `${fmtNumber(msfi.value, 1)} %`
                    : sfi
                      ? `${fmtNumber(sfi.value, 1)} %`
                      : pop
                        ? fmtPeople(pop.value)
                        : "s/d"
                }
                sub={
                  challenge?.id === "pou" && msfi
                    ? `${msfi.year} · ODS 2.1.2`
                    : sfi
                      ? `${sfi.year} · FIES grave`
                      : pop
                        ? `Población ${pop.year}`
                        : "Datos no disponibles"
                }
              />
              <QuickStat
                label="Personas subalimentadas"
                value={challenge?.people ? fmtPeople(challenge.people.value) : "s/d"}
                sub={challenge?.people ? `Año ${challenge.people.year}` : "Sin cifra oficial"}
              />
            </div>
          </div>

          {stunting && (
            <p className="mt-5 max-w-3xl text-[11px] leading-relaxed text-muted">
              Contexto nutricional: el {fmtNumber(stunting.value, 1)} % de los menores de cinco años presenta
              retraso del crecimiento ({stunting.year}). Es un indicador de desnutrición crónica distinto de la
              prevalencia de hambre y de la inseguridad alimentaria aguda.
            </p>
          )}
        </div>
      </section>

      {/* Navegación de fases */}
      <nav className="sticky top-16 z-40 border-b border-ink/10 bg-paper/95 backdrop-blur-md no-print" aria-label="Fases de la experiencia">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
          {NAV.filter((n) => (n.id === "escala" || n.id === "datos" || n.id === "estimar" ? Boolean(challenge) : true)).map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => scrollTo(n.id)}
              className="whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] text-muted transition-colors hover:bg-ink/5 hover:text-ink"
            >
              {n.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Fases 1 y 2 */}
        <section className="border-b border-ink/10 py-12 sm:py-16">
          <SectionHeading
            id="estimar"
            phase="1"
            kicker="El desafío"
            title="Antes de ver el dato, estima"
            intro="La percepción pública del hambre suele diferir de las mediciones oficiales. Este ejercicio no busca acertar, sino hacer visible esa diferencia."
          />
          <div id="datos" className="mt-8 scroll-mt-32">
            {challenge ? (
              <EstimateChallenge
                challenge={challenge}
                countryName={country.nameEs}
                population={pop}
                acute={acute}
                grfc={grfc}
                estimate={estimate}
                setEstimate={setEstimate}
                revealed={revealed}
                onReveal={() => {
                  setRevealed(true);
                  window.setTimeout(() => scrollTo("datos"), 60);
                }}
                onReset={() => setRevealed(false)}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-ink/20 bg-paper-2/40 p-6">
                <p className="font-serif text-xl">Desafío no disponible para {country.nameEs}</p>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                  No hay datos de prevalencia de subalimentación ni de inseguridad alimentaria moderada o grave
                  para este país en la base. No inventamos una cifra para completar la experiencia. Puedes
                  consultar las causas documentadas y la respuesta de la ONU más abajo.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Fase 3 */}
        {challenge && scale && (
          <section className="border-b border-ink/10 py-12 sm:py-16">
            <SectionHeading
              id="escala"
              phase="3"
              kicker="Comprender la magnitud"
              title="Una escala relativa, con criterio explícito"
              intro={`Qué significa el nivel 1-10, en qué nivel está ${country.nameEs}, cómo se compara con el promedio mundial y con los países de su región.`}
            />
            <div className="mt-8">
              <SeverityScale
                scale={scale}
                countryIso={country.iso3}
                countryName={country.nameEs}
                value={challenge.value}
                year={challenge.year}
                indicatorLabel={challenge.shortName}
              />
            </div>
          </section>
        )}

        {/* Fase 4 */}
        <section className="border-b border-ink/10 py-12 sm:py-16">
          <SectionHeading
            id="causas"
            phase="4"
            kicker="¿Por qué ocurre?"
            title={`Las causas del hambre en ${country.nameEs}`}
            intro="Distinguimos entre causas documentadas, factores contribuyentes e hipótesis. No todas las causas tienen el mismo nivel de evidencia, y ninguna actúa sola."
          />
          <div className="mt-8">
            <CausesSection country={country} profile={profile} grfc={grfc} context={context} />
          </div>
        </section>

        {/* Fase 5 */}
        <section className="border-b border-ink/10 py-12 sm:py-16">
          <SectionHeading
            id="soluciones"
            phase="5"
            kicker="El simulador"
            title="¿Qué harías para combatir el hambre?"
            intro="Elige entre medidas reales, con objetivos, población beneficiaria, organismos, resultados documentados y limitaciones. Puedes combinarlas."
          />
          <div className="mt-8">
            <SolutionsSimulator
              measures={measures}
              selectedIds={selectedIds}
              onToggle={toggle}
              onClear={() => {
                setSelectedIds([]);
                setEvaluated(false);
              }}
              onEvaluate={() => {
                setEvaluated(true);
                window.setTimeout(() => scrollTo("evaluacion"), 60);
              }}
              evaluated={evaluated}
              acuteLabel={country.nameEs}
            />
          </div>
        </section>

        {/* Fase 6 */}
        <section className="border-b border-ink/10 py-12 sm:py-16">
          <SectionHeading
            id="evaluacion"
            phase="6"
            kicker="Evaluación"
            title="Qué cubre tu respuesta y qué deja fuera"
            intro="Sin respuestas correctas absolutas: ventajas, desventajas y tensiones de tu combinación de medidas."
          />
          <div className="mt-8">
            <EvaluationPanel
              evaluation={evaluation}
              country={country}
              evaluated={evaluated && selected.length > 0}
              onEvaluate={() => setEvaluated(true)}
              selectedCount={selected.length}
            />
          </div>
        </section>

        {/* Fase 7 */}
        <section className="py-12 sm:py-16">
          <div id="onu" className="scroll-mt-32">
            <UNResponse country={country} profile={profile} measures={measures} selected={selected} />
          </div>
        </section>

        {/* Cierre */}
        <section className="border-t border-ink/10 py-12">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
            <div>
              <p className="kicker text-terracotta">Sigue explorando</p>
              <h2 className="display mt-2 text-3xl sm:text-4xl">El hambre no se entiende país por país</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
                Compara este caso con otros países, revisa la evolución global y consulta las limitaciones
                metodológicas antes de sacar conclusiones.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/mapa" className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-[12px] font-semibold text-paper hover:bg-ink/90">
                  <MapPin size={14} /> Volver al mapa
                </Link>
                <Link href="/datos" className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2.5 text-[12px] font-medium hover:bg-ink/5">
                  <Users size={14} /> Comparar países
                </Link>
                <Link href="/metodologia" className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2.5 text-[12px] font-medium hover:bg-ink/5">
                  <BookOpen size={14} /> Metodología
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setEstimate(20);
                    setRevealed(false);
                    setSelectedIds([]);
                    setEvaluated(false);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2.5 text-[12px] font-medium text-muted hover:bg-ink/5"
                >
                  <RotateCcw size={14} /> Reiniciar
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-ink/10 bg-paper-2/40 p-5">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                <Sparkles size={13} /> Otros países con perfil verificado
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {featured.map((f) => (
                  <Link
                    key={f.iso3}
                    href={`/pais/${f.iso3}/`}
                    className={`rounded-full px-2.5 py-1 text-[11px] transition-colors ${
                      f.iso3 === country.iso3
                        ? "bg-terracotta text-white"
                        : "border border-ink/15 text-ink-2 hover:bg-ink/5"
                    }`}
                  >
                    {f.nameEs}
                  </Link>
                ))}
              </div>
              <p className="mt-3 text-[10px] leading-relaxed text-muted">
                Los demás países del mapa conservan sus datos y, cuando existen, los conductores del GRFC. No
                reciben un perfil inventado.
              </p>
            </div>
          </div>
        </section>

        <p className="border-t border-ink/10 py-8 text-[10px] leading-relaxed text-muted">
          Fuentes principales de esta ficha: SOFI 2026 (FAO, FIDA, UNICEF, PMA y OMS), Base de datos del GRFC
          2026 (FSIN/GNAFC), IPC, páginas de país del PMA y series del Banco Mundial/FAO. Las cifras de cada
          bloque indican su año y su fuente. Este proyecto no es una publicación oficial de las Naciones
          Unidas.
        </p>
      </div>
    </div>
  );
}

function QuickStat({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-3.5 ${accent ? "border-terracotta/30 bg-terracotta/5" : "border-ink/10 bg-[#fffdf8]"}`}>
      <p className="text-[9px] font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className={`tabular mt-1 text-2xl font-semibold ${accent ? "text-rust" : "text-ink"}`}>{value}</p>
      <p className="mt-0.5 line-clamp-2 text-[9px] leading-snug text-muted">{sub}</p>
    </div>
  );
}
