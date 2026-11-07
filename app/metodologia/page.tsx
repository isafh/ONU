import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Database,
  ExternalLink,
  FileCheck2,
  GitBranch,
  Info,
  RefreshCw,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { getCountries, getGrfc, getHeadlines, getIndicators, getMeasures } from "@/lib/data-server";
import { fmtNumber, fmtPeople } from "@/lib/format";
import type { IndicatorMeta } from "@/lib/types";

export const metadata: Metadata = {
  title: "Metodología, fuentes y limitaciones",
  description:
    "Definiciones de hambre, inseguridad alimentaria y desnutrición; registro de indicadores; fuentes oficiales; proceso de actualización; validación y limitaciones metodológicas de Hunger Map.",
};

const PRINCIPLES = [
  {
    title: "Ninguna cifra sin fuente, año e indicador",
    text: "Cada valor de la aplicación remite a un indicador concreto, un año de referencia y una fuente oficial. Cuando no hay dato, se muestra «Datos no disponibles»; no se rellena con una estimación propia.",
  },
  {
    title: "Tres medidas, tres significados",
    text: "Subalimentación (PoU), inseguridad alimentaria moderada o grave (FIES) e inseguridad alimentaria aguda (IPC) no son intercambiables. Se presentan por separado y se explica qué mide cada una.",
  },
  {
    title: "Los datos no se inventan ni se interpolan",
    text: "Las series se consultan por año exacto. Un hueco es un hueco. Las únicas estimaciones que aparecen son las que publican los organismos, no cálculos propios presentados como oficiales.",
  },
  {
    title: "La incertidumbre es parte del dato",
    text: "La subalimentación es una estimación modelizada; la FIES es autoinformada; el IPC clasifica crisis con periodos y poblaciones analizadas distintas. La aplicación explica esas diferencias en lugar de ocultarlas.",
  },
];

const SOURCE_ROWS = [
  {
    name: "SOFI 2026 — El estado de la seguridad alimentaria y la nutrición en el mundo",
    publisher: "FAO, FIDA, UNICEF, PMA y OMS",
    use: "Cifras titulares de hambre e inseguridad alimentaria, proyecciones y notas metodológicas.",
    url: "https://doi.org/10.4060/cd8306en",
    detail: "Publicado el 21 de julio de 2026.",
  },
  {
    name: "Banco Mundial — World Development Indicators (API pública)",
    publisher: "Banco Mundial, con series de FAO, UNICEF, OMS y ONU",
    use: "Series país-año de PoU, FIES, personas subalimentadas, desnutrición infantil, población, pobreza, PIB, producción de alimentos, Gini y superficie agrícola.",
    url: "https://data.worldbank.org",
    detail: "Consultada en noviembre de 2026. No requiere clave de API.",
  },
  {
    name: "GRFC 2026 — Global Report on Food Crises, actualización de mitad de año",
    publisher: "Red Global contra las Crisis Alimentarias (GNAFC) / FSIN, con IPC, CH y GIEWS",
    use: "Población en Fase 3 o superior del IPC, conductores de crisis, desplazamiento y clasificación nutricional por país.",
    url: "https://www.fsinplatform.org/global-report-food-crises",
    detail: "Base de datos descargada desde HDX; 72 países y territorios.",
  },
  {
    name: "IPC — Integrated Food Security Phase Classification",
    publisher: "IPC Global Partnership",
    use: "Marco de clasificación de la inseguridad alimentaria aguda (Fases 1 a 5) y referencia de hambruna.",
    url: "https://www.ipcinfo.org",
    detail: "El GRFC armoniza las evaluaciones IPC/CH disponibles.",
  },
  {
    name: "PMA / WFP — páginas de país",
    publisher: "Programa Mundial de Alimentos",
    use: "Perfiles de país, respuesta humanitaria, personas alcanzadas, resultados operativos y limitaciones de acceso.",
    url: "https://www.wfp.org/countries",
    detail: "Consultadas en noviembre de 2026. Son fuentes operativas, no evaluaciones de impacto independientes.",
  },
  {
    name: "UNICEF, OMS y Banco Mundial — Joint Child Malnutrition Estimates (JME)",
    publisher: "UNICEF / OMS / Banco Mundial",
    use: "Retraso del crecimiento y emaciación en menores de cinco años.",
    url: "https://data.unicef.org/topic/nutrition/malnutrition/",
    detail: "Los años de encuesta varían entre países.",
  },
  {
    name: "Natural Earth — límites administrativos 1:110m",
    publisher: "Natural Earth",
    use: "Geometrías del mapa, nombres en español y agrupación por continente.",
    url: "https://www.naturalearthdata.com",
    detail: "Los límites son cartográficos y no implican una posición política.",
  },
];

function coverageText(meta: IndicatorMeta): string {
  const c = meta.coverage;
  if (!c || c.values === 0) return "Sin cobertura";
  return `${c.countries} países · ${c.firstYear ?? "—"}–${c.lastYear ?? "—"} · ${fmtNumber(c.values)} valores`;
}

function IndicatorCard({ meta }: { meta: IndicatorMeta }) {
  return (
    <details className="group rounded-xl border border-ink/10 bg-[#fffdf8] p-4 open:bg-paper-2/30">
      <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            {meta.id}
            {meta.sdg ? ` · ODS ${meta.sdg}` : ""}
            {meta.isPrimary ? " · principal" : ""}
          </p>
          <p className="mt-0.5 font-serif text-lg leading-tight">{meta.name}</p>
          <p className="mt-0.5 text-[11px] text-muted">
            {meta.unit} · {coverageText(meta)}
          </p>
        </div>
        <span className="rounded-full bg-ink/5 px-2 py-1 text-[10px] text-muted group-open:bg-ink group-open:text-paper">
          Ver ficha
        </span>
      </summary>
      <div className="mt-3 space-y-2.5 border-t border-ink/10 pt-3 text-[11px] leading-relaxed text-ink-2">
        <p>
          <strong className="text-ink">Definición.</strong> {meta.definition}
        </p>
        <p>
          <strong className="text-ink">Método.</strong> {meta.methodology}
        </p>
        <p>
          <strong className="text-ink">Agregación.</strong> {meta.aggregation}
        </p>
        <p>
          <strong className="text-ink">Comparabilidad y límites.</strong> {meta.comparability}
        </p>
        <p className="text-muted">
          Fuente:{" "}
          <a
            href={meta.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="underline decoration-line underline-offset-2 hover:text-terracotta"
          >
            {meta.source}
          </a>
          .
        </p>
      </div>
    </details>
  );
}

export default function MetodologiaPage() {
  const indicators = getIndicators();
  const headlines = getHeadlines();
  const grfc = getGrfc();
  const countries = getCountries();
  const measures = getMeasures();
  const F = headlines.figures;
  const grfcCountries = Object.keys(grfc.countries).length;

  return (
    <main>
      <article className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <header className="max-w-4xl">
          <p className="kicker text-terracotta">Metodología y fuentes</p>
          <h1 className="display mt-2 text-4xl sm:text-5xl lg:text-6xl">
            Cómo se mide el hambre —y cómo no se mide
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-ink-2">
            Hunger Map es una herramienta educativa independiente. No es una publicación oficial de las
            Naciones Unidas. Su objetivo es que puedas leer una cifra de hambre sabiendo qué mide, qué no mide,
            de qué año procede y con qué incertidumbre. Esta página documenta las decisiones que hay detrás de
            cada número.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-[10px] text-muted">
            <span className="rounded-full bg-ink/5 px-2.5 py-1">Edición: {headlines.edition}</span>
            <span className="rounded-full bg-ink/5 px-2.5 py-1">
              Datos curados: {headlines.asOf}
            </span>
            <span className="rounded-full bg-ink/5 px-2.5 py-1">
              {countries.length} países · {indicators.length} indicadores
            </span>
            <span className="rounded-full bg-ink/5 px-2.5 py-1">
              GRFC: {grfcCountries} países y territorios
            </span>
            <Link href="#fuentes" className="rounded-full bg-ink/5 px-2.5 py-1 hover:bg-ink/10">
              Ir a fuentes
            </Link>
          </div>
        </header>

        {/* Principios */}
        <section className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PRINCIPLES.map((p, i) => (
            <div key={p.title} className="card p-4">
              <span className="tabular text-[11px] font-semibold text-terracotta">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="mt-1 font-serif text-lg leading-tight">{p.title}</p>
              <p className="mt-2 text-[11px] leading-relaxed text-muted">{p.text}</p>
            </div>
          ))}
        </section>

        {/* Tres medidas */}
        <section className="mt-14" id="definiciones">
          <p className="kicker text-terracotta">Lo primero: no son sinónimos</p>
          <h2 className="display mt-2 text-3xl sm:text-4xl">Tres medidas que describen cosas distintas</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
            La palabra «hambre» se usa a menudo para todo. En esta aplicación, «hambre» significa
            subalimentación (ODS 2.1.1), la medida que emplea SOFI. Las otras dos aparecen con su nombre propio
            y nunca se suman ni se restan entre sí.
          </p>

          <div className="mt-5 overflow-x-auto rounded-xl border border-ink/10 bg-[#fffdf8]">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead className="bg-paper-2 text-left text-[10px] uppercase tracking-wider text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Medida</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Qué mide</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Unidad y periodo</th>
                  <th scope="col" className="px-4 py-3 font-semibold">No confundir con</th>
                </tr>
              </thead>
              <tbody className="align-top">
                <tr className="border-t border-ink/10">
                  <td className="px-4 py-3">
                    <p className="font-semibold">Subalimentación</p>
                    <p className="mt-0.5 text-[10px] text-muted">PoU · ODS 2.1.1</p>
                  </td>
                  <td className="px-4 py-3 text-[12px] leading-relaxed">
                    Proporción de la población cuya ingesta habitual de energía es insuficiente para una vida
                    normal, activa y saludable. Estimación modelizada de la FAO.
                  </td>
                  <td className="px-4 py-3 text-[12px] leading-relaxed">
                    % de la población. Promedio trienal publicado; la serie país-año puede terminar antes que
                    la edición más reciente.
                  </td>
                  <td className="px-4 py-3 text-[12px] leading-relaxed">
                    No es hambre sentida ocasional ni inseguridad alimentaria aguda. No identifica a las mismas
                    personas que la FIES.
                  </td>
                </tr>
                <tr className="border-t border-ink/10 bg-paper-2/20">
                  <td className="px-4 py-3">
                    <p className="font-semibold">Inseguridad alimentaria moderada o grave</p>
                    <p className="mt-0.5 text-[10px] text-muted">FIES · ODS 2.1.2</p>
                  </td>
                  <td className="px-4 py-3 text-[12px] leading-relaxed">
                    Personas en hogares donde un adulto declaró haber reducido la calidad o la cantidad de
                    alimentos por falta de dinero u otros recursos.
                  </td>
                  <td className="px-4 py-3 text-[12px] leading-relaxed">
                    % de la población. Encuesta autoinformada de ocho preguntas, referida al año.
                  </td>
                  <td className="px-4 py-3 text-[12px] leading-relaxed">
                    No mide ingesta calórica ni desnutrición. Sus valores son mucho más altos que la PoU y no
                    deben presentarse como equivalentes.
                  </td>
                </tr>
                <tr className="border-t border-ink/10">
                  <td className="px-4 py-3">
                    <p className="font-semibold">Inseguridad alimentaria aguda</p>
                    <p className="mt-0.5 text-[10px] text-muted">IPC/CH · Fase 3 o superior</p>
                  </td>
                  <td className="px-4 py-3 text-[12px] leading-relaxed">
                    Población en crisis, emergencia o hambruna según el IPC. Clasificación de gravedad para un
                    periodo y un área analizada.
                  </td>
                  <td className="px-4 py-3 text-[12px] leading-relaxed">
                    Personas y % de la población analizada. Periodos de pocos meses; coberturas variables.
                  </td>
                  <td className="px-4 py-3 text-[12px] leading-relaxed">
                    No es una prevalencia anual comparable con PoU o FIES. El denominador es la población
                    analizada, no necesariamente la población total.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-terracotta/25 bg-terracotta/5 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-rust">Hambre (PoU) en 2025</p>
              <p className="display mt-1 text-3xl text-rust">{fmtNumber(F.hungerPrevalence, 1)} %</p>
              <p className="mt-1 text-[11px] leading-relaxed text-ink-2">
                {fmtPeople(F.hungerPeople)} de personas. Edición SOFI 2026.
              </p>
            </div>
            <div className="rounded-xl border border-amber/35 bg-amber/10 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7a500c]">
                Inseguridad moderada o grave (FIES) en 2025
              </p>
              <p className="display mt-1 text-3xl text-[#7a500c]">{fmtNumber(F.msfiPrevalence, 1)} %</p>
              <p className="mt-1 text-[11px] leading-relaxed text-ink-2">
                {fmtPeople(F.msfiPeople)} de personas. Otra dimensión, no otra forma de contar lo mismo.
              </p>
            </div>
            <div className="rounded-xl border border-olive/25 bg-olive/5 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-olive">
                Inseguridad aguda (IPC) en la base GRFC
              </p>
              <p className="display mt-1 text-3xl text-olive">{grfcCountries}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-ink-2">
                países y territorios con evaluación. El dato más reciente puede ser de 2026 y cubrir solo
                parte del año.
              </p>
            </div>
          </div>
        </section>

        {/* Registro de indicadores */}
        <section className="mt-14" id="indicadores">
          <p className="kicker text-terracotta">Registro de indicadores</p>
          <h2 className="display mt-2 text-3xl sm:text-4xl">Qué contiene la base</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
            Doce indicadores, cada uno con su código de origen, unidad, cobertura y límites de comparabilidad.
            Los tres primeros son los que sostienen la narrativa principal; el resto es contexto y nunca se usa
            como prueba causal.
          </p>

          <div className="mt-5 overflow-x-auto rounded-xl border border-ink/10 bg-[#fffdf8]">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <caption className="sr-only">Registro de los doce indicadores de la base de datos</caption>
              <thead className="bg-paper-2 text-left text-[10px] uppercase tracking-wider text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Indicador</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Código</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Unidad</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Cobertura</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Fuente</th>
                </tr>
              </thead>
              <tbody>
                {indicators.map((m) => (
                  <tr key={m.id} className="border-t border-ink/10 align-top">
                    <td className="px-4 py-2.5">
                      <span className="font-medium">{m.name}</span>
                      {m.sdg && <span className="ml-1.5 rounded bg-ink/5 px-1.5 py-0.5 text-[9px] text-muted">ODS {m.sdg}</span>}
                      {m.isPrimary && <span className="ml-1.5 rounded bg-terracotta/10 px-1.5 py-0.5 text-[9px] text-rust">principal</span>}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[10px] text-muted">{m.wbCode}</td>
                    <td className="px-4 py-2.5 text-[11px] text-ink-2">{m.unit}</td>
                    <td className="px-4 py-2.5 text-[11px] text-muted">{coverageText(m)}</td>
                    <td className="px-4 py-2.5 text-[11px]">
                      <a
                        href={m.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="underline decoration-line underline-offset-2 hover:text-terracotta"
                      >
                        {m.source.split("—")[0].trim()}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <details className="mt-4 rounded-xl border border-ink/10 bg-paper-2/30 p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <span className="text-sm font-semibold">Ficha metodológica de cada indicador</span>
              <span className="text-[10px] text-muted">Definición · método · límites</span>
            </summary>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {indicators.map((m) => (
                <IndicatorCard key={m.id} meta={m} />
              ))}
            </div>
          </details>
        </section>

        {/* Fuentes */}
        <section className="mt-14 scroll-mt-24" id="fuentes">
          <p className="kicker text-terracotta">Fuentes</p>
          <h2 className="display mt-2 text-3xl sm:text-4xl">De dónde sale cada cifra</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
            Todas las fuentes son públicas y de acceso gratuito. No se usa ninguna API de pago ni se necesitan
            claves. Las páginas se consultaron en noviembre de 2026; las series pueden haber sido revisadas
            desde entonces.
          </p>

          <div className="mt-5 space-y-3">
            {SOURCE_ROWS.map((s) => (
              <div key={s.name} className="card flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-3xl">
                  <p className="font-serif text-lg leading-tight">{s.name}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted">{s.publisher}</p>
                  <p className="mt-2 text-[12px] leading-relaxed text-ink-2">
                    <strong className="text-ink">Uso en esta aplicación:</strong> {s.use}
                  </p>
                  <p className="mt-1 text-[10px] text-muted">{s.detail}</p>
                </div>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 text-[11px] font-medium hover:bg-ink/5"
                >
                  Abrir fuente <ExternalLink size={12} />
                </a>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-ink/10 bg-paper-2/40 p-4 text-[11px] leading-relaxed text-muted">
            <p className="font-semibold uppercase tracking-wider text-ink-2">Cifras titulares de SOFI 2026</p>
            <p className="mt-1.5">
              {fmtPeople(F.hungerPeople)} de personas padecieron hambre en 2025 ({fmtNumber(F.hungerPrevalence, 1)} %);{" "}
              {fmtPeople(F.msfiPeople)} vivían en inseguridad alimentaria moderada o grave ({fmtNumber(F.msfiPrevalence, 1)} %);{" "}
              {fmtPeople(F.unaffordableHealthyDietPeople)} no podían permitirse una dieta saludable. África concentra{" "}
              {fmtPeople(F.africaHungryPeople)} de las personas con hambre ({fmtNumber(F.africaHungerPrevalence, 1)} % de su población).
              La proyección para 2030 se sitúa entre {fmtPeople(F.projection2030Low)} y {fmtPeople(F.projection2030High)}.
            </p>
            <p className="mt-2">
              Reporte:{" "}
              <a href={headlines.doi} target="_blank" rel="noreferrer" className="underline hover:text-terracotta">
                {headlines.reportTitle} ({headlines.published})
              </a>
              . Nota de prensa:{" "}
              <a href={headlines.pressRelease} target="_blank" rel="noreferrer" className="underline hover:text-terracotta">
                FAO
              </a>
              .
            </p>
          </div>
        </section>

        {/* Comparabilidad */}
        <section className="mt-14" id="comparabilidad">
          <p className="kicker text-terracotta">Comparabilidad</p>
          <h2 className="display mt-2 text-3xl sm:text-4xl">Lo que no sumamos, restamos ni mezclamos</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
            Una serie puede ser correcta y, aun así, no ser comparable con otra. Estas son las reglas que aplica
            la aplicación cuando dos cifras parecen decir lo mismo pero no lo hacen.
          </p>

          <div className="mt-5 space-y-3">
            <Rule
              title="Ediciones y años distintos no se mezclan en un mismo gráfico"
              text={`SOFI 2026 publica 7,8 % de hambre para 2025. La serie país-año del Banco Mundial que usa el mapa termina en 2024 (8,1 %). Son la misma familia de indicadores, pero de ediciones y años distintos: el mapa y la portada no comparten una única línea temporal. Del mismo modo, la serie MSFI del Banco Mundial registra 28,0 % para 2024, mientras SOFI 2026 publica 25,8 % para 2025. No se presentan como una contradicción: son dos vintages.`}
            />
            <Rule
              title="La tasa y el número de personas no se calculan a mano"
              text="La prevalencia de subalimentación y el número de personas subalimentadas son dos series oficiales. La aplicación nunca multiplica la prevalencia por la población para fabricar una cifra de personas: usa la serie SN.ITK.DEFC, que ya publica la FAO. Cuando esa serie no existe para un país, se muestra «Datos no disponibles»."
            />
            <Rule
              title="El denominador del IPC no es la población total"
              text="El porcentaje de población en Fase 3 o superior se calcula sobre la población analizada en un periodo concreto. Puede ser una región, una parte del país o un grupo de población. Por eso no se compara directamente con la PoU ni con la FIES."
            />
            <Rule
              title="Las regiones de la aplicación no son las regiones de SOFI"
              text="La comparación regional usa el continente de Natural Earth y la mediana de los países con dato. Es una lectura descriptiva y no ponderada por población. No coincide necesariamente con las regiones de SOFI, que agrupan países de otra manera y publican agregados propios."
            />
            <Rule
              title="PSE: una sustitución explícita, no un hueco rellenado"
              text="La base del GRFC no contiene una evaluación reciente de Palestina; su último registro es de 2022. Para no presentar ese dato como actual, la ficha muestra en un bloque separado el dato del PMA de 2026 (1,4 millones de personas en Gaza, alrededor del 60,9 % de su población) y advierte de que no es una serie comparable con el GRFC. La prevalencia de inseguridad alimentaria moderada o grave de 2022 (27,4 %) se mantiene como dato histórico, no como situación actual."
            />
          </div>
        </section>

        {/* Escala */}
        <section className="mt-14" id="escala">
          <p className="kicker text-terracotta">La escala 1–10</p>
          <h2 className="display mt-2 text-3xl sm:text-4xl">Un criterio explícito, no una impresión</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
            El nivel 1–10 no es una clasificación clínica ni un umbral absoluto de hambre. Es el decil que ocupa
            el país dentro de la distribución mundial de países con dato para el mismo indicador y año.
          </p>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="card p-5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Cálculo</p>
              <ol className="mt-3 list-decimal space-y-2.5 pl-5 text-[12px] leading-relaxed text-ink-2">
                <li>
                  Se toman todos los países con observación exacta del indicador en el año del desafío. No se
                  usan años vecinos.
                </li>
                <li>
                  Se ordenan de menor a mayor prevalencia. Se calculan los nueve cortes que dividen la
                  distribución en diez grupos.
                </li>
                <li>
                  Se calcula el percentil del país con el rango medio:{" "}
                  <code className="rounded bg-ink/5 px-1 py-0.5 text-[11px]">
                    (países por debajo + empates/2) / total × 100
                  </code>
                  .
                </li>
                <li>
                  El nivel es <code className="rounded bg-ink/5 px-1 py-0.5 text-[11px]">ceil(percentil / 10)</code>,
                  limitado entre 1 y 10. El nivel 1 es el 10 % con menor prevalencia; el 10, el 10 % con mayor.
                </li>
                <li>
                  Si hay menos de 30 países con dato, no se asigna nivel: una escala construida con una muestra
                  pequeña sería engañosa.
                </li>
              </ol>
            </div>
            <div className="space-y-3">
              <div className="rounded-xl border border-terracotta/25 bg-terracotta/5 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-rust">Importante</p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-ink-2">
                  Nivel 1 no significa «sin hambre». Significa que el país está en el grupo con menor
                  prevalencia <em>relativa</em> de los países con dato ese año. Un país puede tener nivel 3 y
                  millones de personas afectadas si su población es grande.
                </p>
              </div>
              <div className="rounded-xl border border-ink/10 bg-paper-2/40 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Por qué deciles</p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-ink-2">
                  Los umbrales absolutos de hambre son discutibles y cambian según el indicador. Los deciles
                  permiten una lectura relativa reproducible, explícita y sensible a la distribución real. La
                  contrapartida es que el nivel depende del conjunto de países con dato: si cambia la cobertura,
                  pueden cambiar los cortes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Desafío y simulador */}
        <section className="mt-14" id="experiencia">
          <p className="kicker text-terracotta">La experiencia interactiva</p>
          <h2 className="display mt-2 text-3xl sm:text-4xl">Cómo funcionan el desafío y el simulador</h2>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="card p-5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Desafío de estimación</p>
              <ul className="mt-3 list-disc space-y-2 pl-4 text-[12px] leading-relaxed text-ink-2">
                <li>
                  El desafío se hace sobre un mapa en blanco: se ocultan los colores del mapa principal para no
                  revelar la respuesta antes de estimar. El dato y su escala aparecen al confirmar.
                </li>
                <li>Se usa la observación más reciente de PoU del país en la base.</li>
                <li>
                  Si no hay PoU, se usa la MSFI más reciente con un aviso explícito de que mide otra dimensión.
                  La respuesta correcta nunca se inventa.
                </li>
                <li>
                  Si el dato está más de dos años por detrás del último año disponible del indicador, se marca
                  como antiguo: puede no describir la situación presente.
                </li>
                <li>No se interpola para hacer coincidir el año del desafío con otro indicador.</li>
                <li>
                  La cifra de personas afectadas solo se muestra si existe la serie oficial de número de
                  personas; no se calcula multiplicando tasa por población.
                </li>
              </ul>
            </div>
            <div className="card p-5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Simulador y evaluación</p>
              <ul className="mt-3 list-disc space-y-2 pl-4 text-[12px] leading-relaxed text-ink-2">
                <li>
                  Puedes elegir hasta seis medidas de una biblioteca de {measures.length}. Cada una declara
                  objetivo, población beneficiaria, organismos, resultados documentados y limitaciones.
                </li>
                <li>
                  La evaluación calcula qué proporción de las dimensiones de las causas del país queda cubierta
                  por al menos una medida. No es una nota ni una predicción de impacto.
                </li>
                <li>
                  También señala vacíos, tensiones y trade-offs: por ejemplo, ayuda de emergencia sin medidas
                  estructurales, o transferencias monetarias en un contexto donde los mercados no funcionan.
                </li>
                <li>
                  Las causas se etiquetan como documentadas, contribuyentes o hipótesis. La etiqueta describe el
                  nivel de evidencia, no la importancia política del factor.
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { s: "Propuesta", t: "Recomendación o diseño que no consta como adoptado ni financiado." },
              { s: "Anunciada", t: "Meta o programa anunciado; no se verificó su ejecución completa." },
              { s: "En ejecución", t: "Operación en curso; las cifras pueden describir necesidad o alcance, no efecto." },
              { s: "Resultados", t: "Existe al menos un resultado cuantitativo verificable en la fuente citada." },
            ].map((x) => (
              <div key={x.s} className="rounded-lg border border-ink/10 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-2">{x.s}</p>
                <p className="mt-1 text-[10px] leading-relaxed text-muted">{x.t}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Actualizar */}
        <section className="mt-14 scroll-mt-24" id="actualizar">
          <p className="kicker text-terracotta">Mantenimiento</p>
          <h2 className="display mt-2 text-3xl sm:text-4xl">Cómo actualizar los datos</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
            La aplicación es un sitio estático: los datos se generan antes del build y se publican como JSON en{" "}
            <code className="rounded bg-ink/5 px-1 py-0.5 text-[11px]">public/data/</code>. No hay base de datos
            en producción ni llamadas a APIs en tiempo de ejecución.
          </p>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-xl border border-ink/10 bg-deep p-5 text-paper">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-soft">
                Secuencia completa
              </p>
              <pre className="mt-3 overflow-x-auto text-[11px] leading-relaxed text-paper/85">
{`npm install

# 1. Series del Banco Mundial (API pública)
npm run data:worldbank

# 2. GRFC desde raw/grfc.xlsx
npm run data:grfc

# 3. Geometrías desde raw/ne_countries.geojson
npm run data:geo

# 4. Validar y copiar la base curada
npm run data:curated

# 5. Construir series, países y mundiales
npm run data:build

# 6. Validar y probar
npm run data:validate
npm test

# 7. Compilar el sitio estático
npm run build`}
              </pre>
              <p className="mt-3 text-[10px] leading-relaxed text-paper/60">
                Requisitos: Node.js 20+, Python 3.12 con pandas y openpyxl para el paso del GRFC. En Windows,
                usa PowerShell y ejecuta los comandos desde la raíz del proyecto.
              </p>
            </div>

            <div className="space-y-3">
              <div className="card p-4">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                  <Database size={13} /> Qué hace cada paso
                </p>
                <ul className="mt-2 space-y-2 text-[11px] leading-relaxed text-ink-2">
                  <li>
                    <code className="rounded bg-ink/5 px-1">data:worldbank</code> descarga los indicadores del
                    WDI a <code className="rounded bg-ink/5 px-1">data/raw/worldbank/</code>. No necesita clave.
                  </li>
                  <li>
                    <code className="rounded bg-ink/5 px-1">data:grfc</code> normaliza la hoja de cálculo del
                    GRFC 2026 (72 países) a un JSON por país.
                  </li>
                  <li>
                    <code className="rounded bg-ink/5 px-1">data:geo</code> convierte Natural Earth en TopoJSON
                    y un diccionario de nombres en español.
                  </li>
                  <li>
                    <code className="rounded bg-ink/5 px-1">data:curated</code> valida perfiles, medidas y
                    titulares, y los copia a <code className="rounded bg-ink/5 px-1">public/data/</code>.
                  </li>
                  <li>
                    <code className="rounded bg-ink/5 px-1">data:build</code> fusiona todo y genera las series
                    país-año y los agregados mundiales.
                  </li>
                </ul>
              </div>

              <div className="card p-4">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                  <RefreshCw size={13} /> Actualización editorial
                </p>
                <p className="mt-2 text-[11px] leading-relaxed text-ink-2">
                  Los titulares de SOFI, los perfiles de país y la biblioteca de medidas se editan a mano en{" "}
                  <code className="rounded bg-ink/5 px-1">data/</code>. Antes de añadir una afirmación:
                </p>
                <ol className="mt-2 list-decimal space-y-1 pl-4 text-[11px] leading-relaxed text-muted">
                  <li>Localiza la fuente primaria y abre el documento o la página.</li>
                  <li>Anota la cifra, el año, el periodo y la población de referencia.</li>
                  <li>Decide si es un resultado, una necesidad, una proyección o una propuesta.</li>
                  <li>Guarda la URL y la fecha de consulta en el propio registro.</li>
                  <li>Ejecuta la validación: los esquemas rechazan campos vacíos y estados inválidos.</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-amber/35 bg-amber/8 p-4 text-[11px] leading-relaxed text-[#6b4a12]">
            <p className="flex items-center gap-1.5 font-semibold uppercase tracking-wider">
              <AlertTriangle size={14} /> Antes de actualizar una serie
            </p>
            <p className="mt-1.5">
              Comprueba si el organismo ha revisado la serie completa o solo añadido un año. No mezcles una
              edición nueva de SOFI con una serie del Banco Mundial descargada antes: regenera la serie y anota
              la vendimia. Si una cifra no se puede verificar, no se publica: se deja el hueco y se muestra
              «Datos no disponibles».
            </p>
          </div>
        </section>

        {/* Validación */}
        <section className="mt-14" id="validacion">
          <p className="kicker text-terracotta">Control de calidad</p>
          <h2 className="display mt-2 text-3xl sm:text-4xl">Validación y pruebas automáticas</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
            El repositorio incluye dos comprobaciones que se ejecutan antes de publicar. No sustituyen la
            revisión editorial, pero impiden que un error de estructura o de cálculo llegue al sitio.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="card p-5">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                <FileCheck2 size={13} /> npm run data:validate
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-4 text-[11px] leading-relaxed text-ink-2">
                <li>ISO3, duplicados y campos obligatorios de países e indicadores.</li>
                <li>Años ordenados, sin duplicados y dentro de un rango plausible.</li>
                <li>Porcentajes entre 0 y 100; conteos no negativos.</li>
                <li>Coherencia entre la cobertura declarada y la serie publicada.</li>
                <li>GRFC: historial ordenado, últimas cifras coherentes, sin textos «nan».</li>
                <li>Perfiles, medidas y titulares validados con esquemas Zod.</li>
              </ul>
            </div>
            <div className="card p-5">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                <CheckCircle2 size={13} /> npm test
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-4 text-[11px] leading-relaxed text-ink-2">
                <li>Consulta por año exacto: un año ausente devuelve null, no un valor interpolado.</li>
                <li>Deciles: mínimo, mediana y máximo caen en los niveles 1, 5 y 10.</li>
                <li>Con menos de 30 países no se asigna nivel.</li>
                <li>YEM usa MSFI como sustituto explícito; AFG usa PoU; un país sin datos no recibe desafío.</li>
                <li>PSE usa la sustitución del PMA y no presenta 2022 como actual.</li>
                <li>La evaluación detecta cobertura, vacíos y falta de protección en conflicto.</li>
              </ul>
            </div>
          </div>
          <p className="mt-3 text-[10px] leading-relaxed text-muted">
            Si una comprobación falla, el proceso termina con código de error y no se debe publicar el build
            hasta corregirla.
          </p>
        </section>

        {/* Limitaciones */}
        <section className="mt-14" id="limitaciones">
          <p className="kicker text-terracotta">Limitaciones</p>
          <h2 className="display mt-2 text-3xl sm:text-4xl">Lo que esta aplicación no puede decir</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
            Un dato correcto puede sostener una conclusión incorrecta si se usa fuera de su alcance. Estas son
            las limitaciones principales, en orden de importancia.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[
              {
                title: "Los promedios nacionales ocultan desigualdades",
                text: "Un país puede reducir su prevalencia media y mantener bolsas de hambre severa en zonas rurales, barrios informales o comunidades desplazadas. La base no tiene datos subnacionales sistemáticos.",
              },
              {
                title: "La PoU es una estimación modelizada",
                text: "No es un conteo de personas. Depende de balances alimentarios, encuestas y supuestos sobre la distribución del consumo. La incertidumbre es mayor donde hay pocas encuestas.",
              },
              {
                title: "La FIES es autoinformada",
                text: "Mide experiencias declaradas de acceso a alimentos. Está influida por el contexto cultural y por cómo se aplica la encuesta. No mide ingesta calórica ni estado nutricional.",
              },
              {
                title: "El IPC no es una prevalencia anual",
                text: "Clasifica una situación aguda en un periodo y un área determinados. Dos países con el mismo porcentaje pueden tener poblaciones analizadas y momentos del año distintos.",
              },
              {
                title: "La cobertura es desigual",
                text: "Muchos países carecen de datos recientes de PoU, FIES, Gini o pobreza. La aplicación muestra el hueco. No se usan modelos propios para completarlo.",
              },
              {
                title: "Los datos pueden ser antiguos",
                text: "La serie país-año de PoU termina en 2024 y la de personas subalimentadas, en 2023. En países en crisis, un dato de 2021 puede describir una realidad que ya cambió. Se marca cuando corresponde.",
              },
              {
                title: "Las fuentes operativas no son evaluaciones de impacto",
                text: "Las páginas del PMA describen necesidades, planes y alcance operativo. Que una intervención alcance a un millón de personas no demuestra que reduzca la prevalencia de hambre. La aplicación distingue necesidad, ejecución y resultado.",
              },
              {
                title: "Solo 12 países tienen perfil verificado",
                text: "Los demás conservan sus datos y, cuando existen, los conductores del GRFC. No reciben causas genéricas ni una respuesta de la ONU inventada. Es una limitación de cobertura editorial, no un juicio sobre su importancia.",
              },
              {
                title: "Las causas no son una relación causal demostrada",
                text: "Que el GRFC identifique el conflicto como conductor principal no implica que sea la única causa ni que eliminarlo resuelva el hambre. Las etiquetas de evidencia describen lo que la fuente permite afirmar.",
              },
              {
                title: "La escala 1–10 es relativa",
                text: "Depende de los países con dato en ese año. No es una medida absoluta, clínica ni comparable entre indicadores distintos. Nivel 1 no significa ausencia de hambre.",
              },
              {
                title: "Las proyecciones no son observaciones",
                text: "Las cifras a 2030 y las alertas de hambruna son proyecciones condicionadas a supuestos. Se presentan como tales y no como resultados actuales.",
              },
              {
                title: "Los límites del mapa no son una posición política",
                text: "Las geometrías de Natural Earth son cartográficas. La aplicación no toma partido en disputas territoriales ni presenta fronteras como definitivas.",
              },
            ].map((l) => (
              <div key={l.title} className="rounded-xl border border-ink/10 bg-[#fffdf8] p-4">
                <p className="font-serif text-base leading-tight">{l.title}</p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-muted">{l.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Cierre */}
        <section className="mt-14 rounded-2xl border border-ink/10 bg-paper-2/50 p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="kicker text-terracotta">Sigue explorando</p>
              <h2 className="display mt-2 text-3xl">Leer el dato es solo el principio</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
                Ahora que conoces las definiciones y los límites, vuelve al mapa o compara países. Si una cifra
                te sorprende, comprueba su año, su indicador y su fuente antes de sacar una conclusión.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/mapa" className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-[12px] font-semibold text-paper hover:bg-ink/90">
                  Explorar el mapa <ArrowRight size={14} />
                </Link>
                <Link href="/datos" className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2.5 text-[12px] font-medium hover:bg-ink/5">
                  Ver estadísticas <Scale size={14} />
                </Link>
                <Link href="/metodologia#fuentes" className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2.5 text-[12px] font-medium hover:bg-ink/5">
                  Revisar fuentes <BookOpen size={14} />
                </Link>
              </div>
            </div>
            <div className="rounded-xl border border-ink/10 bg-[#fffdf8] p-4">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                <ShieldCheck size={13} /> Transparencia
              </p>
              <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-muted">
                <li>Sin claves de API ni servicios de pago.</li>
                <li>Sin rastreo ni perfilado de usuarios.</li>
                <li>Datos separados de la interfaz y versionados en el repositorio.</li>
                <li>Errores y huecos visibles, no maquillados.</li>
                <li>Proyecto educativo independiente, no una publicación oficial de la ONU.</li>
              </ul>
            </div>
          </div>
        </section>

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-5 text-[10px] text-muted">
          <p className="flex items-center gap-1.5">
            <GitBranch size={12} /> Metodología versionada con la base de datos · {headlines.asOf}
          </p>
          <p className="flex items-center gap-1.5">
            <Info size={12} /> Las cifras pueden ser revisadas por sus organismos de origen.
          </p>
        </footer>
      </article>
    </main>
  );
}

function Rule({ title, text }: { title: string; text: string }) {
  return (
    <div className="card p-4">
      <p className="flex items-start gap-2 font-serif text-lg leading-tight">
        <Info size={15} className="mt-1 shrink-0 text-terracotta" />
        {title}
      </p>
      <p className="mt-2 text-[12px] leading-relaxed text-muted">{text}</p>
    </div>
  );
}
