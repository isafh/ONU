import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen } from "lucide-react";
import { getGrfc, getHeadlines, getWorld } from "@/lib/data-server";
import { fmtNumber, fmtPeople } from "@/lib/format";
import DotField from "@/components/home/DotField";
import WorldTrend from "@/components/charts/WorldTrend";
import Reveal from "@/components/Reveal";

const CAUSES = [
  {
    n: "01",
    key: "conflict",
    title: "Conflictos armados",
    kind: "Conductor documentado",
    text: "La guerra destruye cosechas, carreteras y mercados, desplaza a millones de personas y bloquea la ayuda humanitaria. Es el factor que el GRFC identifica con más frecuencia como causa principal de las crisis alimentarias agudas.",
    source: "GRFC 2026 · IPC/FSIN",
  },
  {
    n: "02",
    key: "economic",
    title: "Crisis económicas",
    kind: "Conductor documentado",
    text: "La inflación de los alimentos, la depreciación de la moneda, el desempleo y la deuda reducen el poder de compra de los hogares. El acceso a los alimentos depende tanto del precio como de la disponibilidad.",
    source: "SOFI 2026 · GRFC 2026",
  },
  {
    n: "03",
    key: "climate",
    title: "Cambio climático y clima extremo",
    kind: "Conductor documentado",
    text: "Sequías, inundaciones y ciclones destruyen la producción y los pastos. Los fenómenos extremos son el segundo conductor más citado en las crisis alimentarias y golpean sobre todo a quienes ya viven de la agricultura de subsistencia.",
    source: "GRFC 2026 · FAO",
  },
  {
    n: "04",
    key: "poverty",
    title: "Pobreza",
    kind: "Factor estructural",
    text: "El hambre no es solo un problema de cantidad de comida: es un problema de capacidad de compra. Cuando el alimento disponible es demasiado caro, una familia pobre come menos o peor aunque el mercado esté lleno.",
    source: "SOFI 2026 · Banco Mundial",
  },
  {
    n: "05",
    key: "inequality",
    title: "Desigualdad económica",
    kind: "Factor estructural",
    text: "La distribución del ingreso, de la tierra y del acceso a servicios básicos determina quién come primero y quién queda atrás. Las mujeres y las zonas rurales están sobrerrepresentadas entre las personas afectadas.",
    source: "SOFI 2026 · FIDA",
  },
  {
    n: "06",
    key: "production",
    title: "Producción y distribución",
    kind: "Factor estructural",
    text: "Pérdidas poscosecha, falta de infraestructura, caminos intransitables y cadenas de frío inexistentes hacen que los alimentos no lleguen. Un país puede producir suficiente y aun así tener hambre.",
    source: "FAO · FIDA",
  },
];

export default function HomePage() {
  const headlines = getHeadlines();
  const F = headlines.figures;
  const world = getWorld();
  const grfc = getGrfc();

  const driverCounts: Record<string, number> = { conflict: 0, climate: 0, economic: 0 };
  let countriesWithDrivers = 0;
  for (const c of Object.values(grfc.countries)) {
    const p = c.drivers.primary;
    if (!p) continue;
    countriesWithDrivers++;
    if (p.startsWith("Conflicto")) driverCounts.conflict++;
    else if (p.startsWith("Fenómenos")) driverCounts.climate++;
    else if (p.startsWith("Crisis")) driverCounts.economic++;
  }

  const regionBars = headlines.regionalMsfi;
  const maxRegion = Math.max(...regionBars.map((r) => r.prevalence));

  return (
    <main>
      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden">
        <div className="grain absolute inset-0 -z-10 opacity-60" />
        <div className="mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-16 lg:px-8 lg:pb-24 lg:pt-20">
          <div className="rise">
            <p className="kicker flex items-center gap-2 text-terracotta">
              <span className="h-px w-8 bg-terracotta" />
              Datos abiertos · edición 2026
            </p>
            <h1 className="display mt-5 max-w-[15ch] text-[2.9rem] sm:text-6xl lg:text-[4.6rem]">
              El hambre en el mundo: ¿cuánto sabes realmente?
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-2">
              <strong className="font-semibold text-ink">{fmtPeople(F.hungerPeople)}</strong> de personas
              —casi una de cada trece— no tuvieron suficiente comida en 2025. Detrás de esa cifra hay
              conflictos, pobreza, crisis económicas y un clima cada vez más extremo. Esta aplicación te
              invita a mirar los datos, poner a prueba tu percepción y decidir qué harías tú.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/mapa"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-terracotta px-6 py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-rust"
              >
                Explorar el mapa del hambre
                <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/metodologia"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/20 px-6 py-3.5 text-sm font-medium text-ink transition-colors hover:bg-ink/5"
              >
                <BookOpen size={16} />
                Cómo se mide
              </Link>
            </div>
            <p className="mt-6 text-[11px] leading-relaxed text-muted">
              Fuente: SOFI 2026 (FAO, FIDA, UNICEF, PMA y OMS), publicado el 21 de julio de 2026.{" "}
              <a className="underline decoration-line underline-offset-2 hover:text-terracotta" href={headlines.doi} target="_blank" rel="noreferrer">
                doi:10.4060/cd8306en
              </a>
            </p>
          </div>

          <div className="rise" style={{ animationDelay: "160ms" }}>
            <DotField total={645} africa={F.africaHungryPeople / 1_000_000} asia={F.asiaHungryPeople / 1_000_000} rest={44} />
            <p className="mt-3 max-w-md text-[11px] leading-relaxed text-muted">
              Composición regional del hambre en 2025. África concentra {fmtPeople(F.africaHungryPeople)} y Asia{" "}
              {fmtPeople(F.asiaHungryPeople)}. El resto del mundo, {fmtPeople(F.hungerPeople - F.africaHungryPeople - F.asiaHungryPeople)}.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- STAT BAND ---------------- */}
      <section className="bg-deep text-paper">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <h2 className="kicker text-paper/60">El mundo en cuatro cifras · 2025</h2>
            <p className="text-[11px] text-paper/50">Todas las cifras: SOFI 2026</p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-xl bg-paper/15 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                big: "645 M",
                label: "personas padecen hambre",
                sub: `${fmtNumber(F.hungerPrevalence, 1)} % de la población mundial`,
                delta: "Tercer año consecutivo de descenso",
              },
              {
                big: "2,1 mil M",
                label: "con inseguridad alimentaria moderada o grave",
                sub: `${fmtNumber(F.msfiPrevalence, 1)} % de la población mundial`,
                delta: "86 millones menos que en 2024",
              },
              {
                big: "2,69 mil M",
                label: "no pueden permitirse una dieta saludable",
                sub: `${fmtNumber(F.unaffordableHealthyDietPrevalence, 1)} % de la población mundial`,
                delta: `Coste medio: ${fmtNumber(F.healthyDietCostPpp, 2)} USD PPA/día`,
              },
              {
                big: "309 M",
                label: "personas con hambre en África",
                sub: `${fmtNumber(F.africaHungerPrevalence, 1)} % de la población africana`,
                delta: "Más que Asia (292 M) en cifras absolutas",
              },
            ].map((s) => (
              <div key={s.label} className="bg-deep p-6 lg:p-7">
                <p className="display text-4xl text-amber-soft lg:text-[2.9rem]">{s.big}</p>
                <p className="mt-3 text-sm font-medium leading-snug text-paper">{s.label}</p>
                <p className="tabular mt-2 text-xs text-paper/70">{s.sub}</p>
                <p className="mt-4 border-t border-paper/15 pt-3 text-[11px] leading-relaxed text-paper/55">{s.delta}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-3xl text-[11px] leading-relaxed text-paper/50">
            «Hambre» aquí equivale a subalimentación (ODS 2.1.1). La inseguridad alimentaria moderada o
            grave (ODS 2.1.2) es un indicador distinto y no debe sumarse ni compararse como si midiera lo
            mismo. Ambas son estimaciones de la FAO publicadas en SOFI 2026.
          </p>
        </div>
      </section>

      {/* ---------------- DEFINICIONES ---------------- */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal>
          <p className="kicker text-terracotta">Antes de seguir</p>
          <div className="mt-3 grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:items-end">
            <h2 className="display max-w-xl text-4xl sm:text-5xl">Tres cosas que no son lo mismo</h2>
            <p className="text-sm leading-relaxed text-muted">
              El debate público mezcla indicadores que miden dimensiones distintas. Confundirlos lleva a
              conclusiones equivocadas: un país puede tener poca subalimentación crónica y sufrir una crisis
              alimentaria aguda, o al contrario.
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            {
              tag: "Crónico · ODS 2.1.1",
              title: "Subalimentación",
              color: "border-t-terracotta",
              what: "Insuficiencia habitual de energía alimentaria durante un año.",
              how: "Modelo FAO con balances alimentarios y encuestas. Se publica como promedio trienal.",
              not: "No mide hambre percibida ni crisis repentinas.",
            },
            {
              tag: "Crónico · ODS 2.1.2",
              title: "Inseguridad alimentaria",
              color: "border-t-amber",
              what: "Hogares que reducen la calidad o cantidad de alimentos por falta de recursos.",
              how: "Encuesta FIES de ocho preguntas, aplicada a nivel de hogar.",
              not: "No equivale a la subalimentación: mide acceso, no ingesta calórica.",
            },
            {
              tag: "Agudo · IPC/CIF",
              title: "Crisis alimentaria aguda",
              color: "border-t-olive",
              what: "Población en Fase 3 o superior: crisis, emergencia o catástrofe.",
              how: "Clasificación consensuada con múltiples fuentes y un periodo de análisis concreto.",
              not: "No se mide con la FIES ni con la prevalencia de subalimentación.",
            },
          ].map((d, i) => (
            <Reveal key={d.title} delay={i * 80}>
              <article className={`card h-full border-t-[3px] ${d.color} p-6`}>
                <p className="kicker text-[10px] text-muted">{d.tag}</p>
                <h3 className="mt-3 font-serif text-2xl">{d.title}</h3>
                <dl className="mt-5 space-y-4 text-sm">
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted">Qué mide</dt>
                    <dd className="mt-1 leading-relaxed text-ink-2">{d.what}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted">Cómo se mide</dt>
                    <dd className="mt-1 leading-relaxed text-ink-2">{d.how}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted">No confundir con</dt>
                    <dd className="mt-1 leading-relaxed text-terracotta">{d.not}</dd>
                  </div>
                </dl>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- TENDENCIA ---------------- */}
      <section className="border-y border-ink/10 bg-paper-2/50">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <Reveal>
            <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-end">
              <div>
                <p className="kicker text-terracotta">La tendencia</p>
                <h2 className="display mt-3 max-w-xl text-4xl sm:text-5xl">Menos hambre que hace dos décadas. Lejos de cero.</h2>
              </div>
              <p className="text-sm leading-relaxed text-muted">
                La prevalencia mundial de subalimentación bajó del 12,7 % en 2001 al 8,1 % en 2024, pero el
                ritmo se estancó después de 2015 y empeoró con la pandemia. En 2025, SOFI estima un 7,8 %:
                una mejora real, todavía insuficiente para eliminar el hambre en 2030.
              </p>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <div className="mt-8 rounded-2xl border border-ink/10 bg-[#fffdf8] p-5 sm:p-7">
              <WorldTrend world={world} />
              <p className="mt-5 border-t border-ink/10 pt-4 text-[11px] leading-relaxed text-muted">
                Serie: Banco Mundial / FAO, actualizada en octubre de 2026. La estimación de 2025 (7,8 %)
                procede de SOFI 2026 y no está incluida en la serie del gráfico para no mezclar vintages.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- CAUSAS ---------------- */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal>
          <p className="kicker text-terracotta">Por qué ocurre</p>
          <h2 className="display mt-3 max-w-3xl text-4xl sm:text-5xl">El hambre no tiene una sola causa</h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
            Distinguimos entre <strong className="text-ink">conductores documentados</strong> —los que el GRFC
            identifica país por país en contextos de crisis— y <strong className="text-ink">factores estructurales</strong>,
            que la evidencia asocia al hambre pero que no se pueden atribuir de forma causal con una sola cifra.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CAUSES.map((c, i) => {
            const count = driverCounts[c.key];
            return (
              <Reveal key={c.key} delay={i * 60}>
                <article className="group flex h-full flex-col rounded-2xl border border-ink/10 bg-[#fffdf8] p-6 transition-colors hover:border-ink/25">
                  <div className="flex items-baseline justify-between">
                    <span className="font-serif text-3xl text-line">{c.n}</span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                        c.kind === "Conductor documentado" ? "bg-terracotta/10 text-rust" : "bg-olive/10 text-olive"
                      }`}
                    >
                      {c.kind}
                    </span>
                  </div>
                  <h3 className="mt-4 font-serif text-[22px] leading-tight">{c.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-2">{c.text}</p>
                  <div className="mt-5 border-t border-ink/10 pt-3 text-[11px] text-muted">
                    {count ? (
                      <p className="tabular">
                        Conductor principal en <strong className="text-ink">{count}</strong> de {countriesWithDrivers} países
                        y territorios con datos del GRFC.
                      </p>
                    ) : (
                      <p>{c.source}</p>
                    )}
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
        <p className="mt-6 max-w-3xl text-[11px] leading-relaxed text-muted">
          El recuento de conductores se calcula con el registro más reciente de cada país en la base del GRFC
          2026 (actualización de mitad de año). Solo cubre países y territorios en crisis alimentaria; no es
          una clasificación de todos los países del mundo. Los años de referencia varían.
        </p>
      </section>

      {/* ---------------- REGIONES ---------------- */}
      <section className="bg-deep text-paper">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:px-8">
          <Reveal>
            <p className="kicker text-amber-soft">Dónde se concentra</p>
            <h2 className="display mt-3 max-w-lg text-4xl text-paper sm:text-5xl">
              África ya no solo lidera en porcentaje: lidera en personas
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-paper/70">
              En 2025, el 20,0 % de la población africana padecía hambre, frente al 7,8 % mundial. Por primera
              vez, África concentra más personas con hambre en términos absolutos que Asia (309 frente a 292
              millones), en parte por el rápido crecimiento demográfico.
            </p>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-paper/70">
              La inseguridad alimentaria moderada o grave es aún más extendida: afecta al 56,6 % de la
              población de África, más del doble que en Asia y América Latina y el Caribe.
            </p>
            <Link href="/datos" className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-amber-soft hover:text-paper">
              Ver todas las estadísticas
              <ArrowUpRight size={16} />
            </Link>
          </Reveal>

          <Reveal delay={100}>
            <div className="rounded-2xl border border-paper/15 bg-paper/[0.04] p-6 sm:p-8">
              <p className="kicker text-paper/50">Inseguridad alimentaria moderada o grave</p>
              <p className="mt-1 text-[11px] text-paper/40">% de la población · 2025 · SOFI 2026</p>
              <div className="mt-8 space-y-6">
                {regionBars.map((r) => (
                  <div key={r.region}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-3">
                      <span className={`text-sm ${r.region === "Mundo" ? "font-semibold text-amber-soft" : "text-paper/85"}`}>
                        {r.region}
                      </span>
                      <span className="tabular text-sm text-paper">{fmtNumber(r.prevalence, 1)} %</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-paper/10">
                      <div
                        className={`h-full rounded-full ${r.region === "Mundo" ? "bg-amber-soft" : "bg-terracotta"}`}
                        style={{ width: `${(r.prevalence / maxRegion) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-8 border-t border-paper/15 pt-4 text-[11px] leading-relaxed text-paper/50">
                Cifras regionales publicadas en SOFI 2026. Las regiones no son comparables entre sí en tamaño
                de población; los porcentajes sí permiten comparar intensidad.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-terracotta px-6 py-14 text-white sm:px-12 sm:py-20">
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full border border-white/20" />
            <div className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full border border-white/15" />
            <div className="relative max-w-2xl">
              <p className="kicker text-white/70">Ahora te toca</p>
              <h2 className="display mt-4 text-4xl sm:text-5xl">
                ¿Cuánto crees que sabe el mundo sobre su propio hambre?
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/80">
                Elige un país en el mapa en blanco, estima su prevalencia de hambre y compara tu percepción
                con el dato oficial. Después, decide qué medidas tomarías y descubre qué está haciendo
                realmente la ONU.
              </p>
              <Link
                href="/desafio"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-paper px-6 py-3.5 text-sm font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-white"
              >
                Abrir el desafío de estimación
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
