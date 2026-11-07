import type {
  CauseTag,
  Country,
  CountryProfile,
  GrfcCountry,
  IndicatorId,
  IndicatorMeta,
  Measure,
  Series,
  SeriesPoint,
} from "./types";
import {
  decileLevel,
  latestAvailableYear,
  latestPoint,
  latestUntil,
  median,
  pointsFor,
  valuesInYear,
  type DecileResult,
} from "./analysis";
import { fmtPeople } from "./format";

/** Indicador utilizado en el desafío: PoU si existe; si no, MSFI con aviso. */
export interface ChallengeView {
  id: IndicatorId;
  name: string;
  shortName: string;
  sdg?: string;
  definition: string;
  source: string;
  year: number;
  value: number;
  stale: boolean;
  staleReason?: string;
  isFallback: boolean;
  fallbackReason?: string;
  people: { value: number; year: number } | null;
  population: { value: number; year: number } | null;
}

export interface ScaleView {
  year: number;
  indicatorId: IndicatorId;
  decile: DecileResult | null;
  nCountries: number;
  world: { value: number; year: number; exact: boolean } | null;
  regionName: string;
  regionMedian: number | null;
  regionRank: number | null;
  regionTotal: number;
  regionPeers: { iso3: string; nameEs: string; value: number }[];
}

export interface ContextItem {
  id: IndicatorId;
  name: string;
  shortName: string;
  value: number;
  year: number;
  unit: string;
  decimals: number;
  source: string;
  note?: string;
}

export interface AcuteView {
  origin: "grfc" | "pma-override";
  year: number;
  phase3plus: number | null;
  phase3plusPct: number | null;
  analysedPop: number | null;
  period: string;
  sourceLabel: string;
  url: string;
  note?: string;
  stale: boolean;
}

export interface Evaluation {
  coveragePct: number;
  coveredTags: CauseTag[];
  uncovered: { title: string; tag?: CauseTag; type: string }[];
  horizon: { inmediato: number; "corto plazo": number; "largo plazo": number };
  evidence: { fuerte: number; moderada: number; limitada: number };
  highCost: number;
  strengths: string[];
  gaps: string[];
  tradeoffs: string[];
}

const MAIN_IDS: IndicatorId[] = ["pou", "msfi"];

function metaFor(indicators: IndicatorMeta[], id: IndicatorId): IndicatorMeta {
  const m = indicators.find((i) => i.id === id);
  if (!m) throw new Error(`Indicador no registrado: ${id}`);
  return m;
}

export function pickChallenge(
  country: Country,
  series: Series,
  indicators: IndicatorMeta[],
): ChallengeView | null {
  const pou = latestPoint(pointsFor(series, country.iso3, "pou"));
  const msfi = latestPoint(pointsFor(series, country.iso3, "msfi"));

  let id: IndicatorId;
  let point: SeriesPoint;
  let isFallback = false;
  let fallbackReason: string | undefined;

  if (pou) {
    id = "pou";
    point = pou;
  } else if (msfi) {
    id = "msfi";
    point = msfi;
    isFallback = true;
    fallbackReason =
      "No hay un dato reciente de prevalencia de subalimentación (PoU) para este país en la base. Para no inventar una cifra, el desafío usa la inseguridad alimentaria moderada o grave (FIES), que mide otra dimensión: acceso a los alimentos, no ingesta energética.";
  } else {
    return null;
  }

  const meta = metaFor(indicators, id);
  const lastYear = latestAvailableYear(series, id);
  const stale = lastYear != null && point[0] < lastYear - 2;
  const staleReason = stale
    ? `El dato más reciente disponible para este indicador es de ${point[0]}, mientras que la serie llega hasta ${lastYear}. No es un dato actual y puede no reflejar la situación presente.`
    : undefined;

  const peoplePoint =
    id === "pou" ? latestUntil(pointsFor(series, country.iso3, "undernourished_n"), point[0]) : null;
  const popPoint = latestPoint(pointsFor(series, country.iso3, "population"));

  return {
    id,
    name: meta.name,
    shortName: meta.shortName,
    sdg: meta.sdg,
    definition: meta.definition,
    source: meta.source,
    year: point[0],
    value: point[1],
    stale,
    staleReason,
    isFallback,
    fallbackReason,
    people: peoplePoint ? { value: peoplePoint[1], year: peoplePoint[0] } : null,
    population: popPoint ? { value: popPoint[1], year: popPoint[0] } : null,
  };
}

export function buildScale(
  country: Country,
  countries: Country[],
  series: Series,
  indicatorId: IndicatorId,
  year: number,
  value: number,
  world: Record<string, [number, number][]>,
): ScaleView {
  const vals = valuesInYear(countries, series, indicatorId, year);
  const decile = decileLevel(value, vals.map((v) => v.value));

  const worldSeries = world[indicatorId] ?? [];
  const exact = worldSeries.find((p) => p[0] === year);
  const prior = latestUntil(worldSeries, year);
  const worldPoint = exact ?? prior;
  const worldView = worldPoint
    ? { value: worldPoint[1], year: worldPoint[0], exact: Boolean(exact) }
    : null;

  const peers = vals
    .filter((v) => {
      const c = countries.find((x) => x.iso3 === v.iso3);
      return c?.continent === country.continent;
    })
    .sort((a, b) => b.value - a.value);

  const rank = peers.findIndex((p) => p.iso3 === country.iso3);

  return {
    year,
    indicatorId,
    decile,
    nCountries: vals.length,
    world: worldView,
    regionName: country.continent,
    regionMedian: peers.length ? median(peers.map((p) => p.value)) : null,
    regionRank: rank >= 0 ? rank + 1 : null,
    regionTotal: peers.length,
    regionPeers: peers.slice(0, 6).map((p) => ({
      iso3: p.iso3,
      nameEs: countries.find((c) => c.iso3 === p.iso3)?.nameEs ?? p.iso3,
      value: p.value,
    })),
  };
}

const CONTEXT_IDS: IndicatorId[] = [
  "msfi",
  "sfi",
  "stunting",
  "wasting",
  "poverty",
  "gdp_pc",
  "food_prod",
  "gini",
  "agri_land",
  "population",
];

export function buildContext(
  country: Country,
  series: Series,
  indicators: IndicatorMeta[],
  challengeId: IndicatorId | null,
  hidden: IndicatorId[] = [],
): ContextItem[] {
  const items: ContextItem[] = [];
  for (const id of CONTEXT_IDS) {
    if (id === challengeId) continue;
    if (hidden.includes(id)) continue;
    if (id === "pou") continue;
    const p = latestPoint(pointsFor(series, country.iso3, id));
    if (!p) continue;
    // No mostrar contexto anterior a 2015: describe una realidad que ya no existe.
    if (p[0] < 2015) continue;
    const meta = metaFor(indicators, id);
    items.push({
      id,
      name: meta.name,
      shortName: meta.shortName,
      value: p[1],
      year: p[0],
      unit: meta.unit,
      decimals: meta.decimals,
      source: meta.source,
      note:
        id === "poverty" || id === "gini"
          ? "Encuesta de hogares; el año de referencia varía y no hay datos anuales."
          : undefined,
    });
  }
  return items;
}

export function buildAcute(
  profile: CountryProfile | null,
  grfc: GrfcCountry | null,
  maxGrfcYear: number,
): AcuteView | null {
  if (profile?.acuteOverride) {
    const o = profile.acuteOverride;
    return {
      origin: "pma-override",
      year: o.year,
      phase3plus: o.phase3plus,
      phase3plusPct: o.phase3plusPct,
      analysedPop: null,
      period: o.period,
      sourceLabel: o.source,
      url: o.url,
      note: o.note,
      stale: o.year < maxGrfcYear - 1,
    };
  }
  if (!grfc) return null;
  const l = grfc.latest;
  return {
    origin: "grfc",
    year: l.year,
    phase3plus: l.phase3plus,
    phase3plusPct: l.phase3plusPct,
    analysedPop: l.analysedPop,
    period: l.period ?? "Periodo no especificado",
    sourceLabel: `GRFC 2026 · ${l.source ?? "IPC/CH/GIEWS"}`,
    url: "https://www.fsinplatform.org/global-report-food-crises",
    note: "El porcentaje se calcula sobre la población analizada, no sobre la población total del país. No equivale a la prevalencia de subalimentación.",
    stale: l.year < maxGrfcYear - 1,
  };
}

export function evaluateMeasures(
  selected: Measure[],
  profile: CountryProfile | null,
  country: Country,
  hasNutritionData: boolean,
): Evaluation {
  const causes = profile?.causes ?? [];
  const documented = causes.filter((c) => c.type === "documented");
  const relevant = causes.filter((c) => c.type !== "hypothesis" && c.tag);
  const tags = [...new Set(relevant.map((c) => c.tag as CauseTag))];
  const addressed = new Set<CauseTag>();
  for (const m of selected) for (const t of m.addresses) addressed.add(t);
  const coveredTags = tags.filter((t) => addressed.has(t));
  const coveragePct = tags.length ? Math.round((coveredTags.length / tags.length) * 100) : 0;

  const horizon = { inmediato: 0, "corto plazo": 0, "largo plazo": 0 };
  const evidence = { fuerte: 0, moderada: 0, limitada: 0 };
  let highCost = 0;
  for (const m of selected) {
    horizon[m.horizon] += 1;
    evidence[m.evidence] += 1;
    if (m.cost === "alto") highCost += 1;
  }

  const strengths: string[] = [];
  const gaps: string[] = [];
  const tradeoffs: string[] = [];
  const unfinished = relevant.filter((c) => c.tag && !addressed.has(c.tag));

  if (selected.length === 0) {
    return {
      coveragePct: 0,
      coveredTags,
      uncovered: unfinished.map((c) => ({ title: c.title, tag: c.tag, type: c.type })),
      horizon,
      evidence,
      highCost,
      strengths: ["Todavía no has seleccionado ninguna medida."],
      gaps: ["Sin medidas no es posible evaluar la respuesta: elige al menos dos para ver cómo se complementan."],
      tradeoffs: [],
    };
  }

  if (coveredTags.length > 0) {
    strengths.push(
      `Tus medidas abordan ${coveredTags.length} de ${tags.length} dimensiones identificadas en las causas del país (${coveragePct} % de cobertura).`,
    );
  }
  if (horizon.inmediato > 0 && horizon["largo plazo"] > 0) {
    strengths.push("Combinas respuesta inmediata con medidas estructurales: es la combinación que la evidencia sugiere para crisis prolongadas.");
  }
  if (horizon["corto plazo"] > 0 && horizon.inmediato === 0 && horizon["largo plazo"] === 0) {
    strengths.push("Priorizas medidas de corto plazo que pueden sostener el consumo mientras se preparan soluciones estructurales.");
  }
  if (evidence.fuerte >= 3) {
    strengths.push("Tres o más de tus medidas cuentan con evidencia evaluada como fuerte en la biblioteca de programas.");
  }
  if (selected.some((m) => m.id === "conflict_protection") && tags.includes("conflict")) {
    strengths.push("Incluyes protección y acceso humanitario, una condición previa en contextos de conflicto.");
  }
  if (selected.some((m) => m.id === "nutrition") && (hasNutritionData || tags.includes("nutrition"))) {
    strengths.push("Incorporas nutrición infantil, que reduce el riesgo de muerte y secuelas incluso cuando la ayuda alimentaria llega tarde.");
  }

  for (const c of unfinished) {
    gaps.push(`No hay una medida seleccionada que aborde de forma directa «${c.title}» (${c.type === "documented" ? "causa documentada" : "factor contribuyente"}).`);
  }
  if (tags.includes("conflict") && !selected.some((m) => m.id === "conflict_protection")) {
    gaps.push("En un contexto de conflicto, ninguna medida seleccionada se ocupa de la protección o del acceso humanitario.");
  }
  if (horizon["largo plazo"] === 0 && (documented.length >= 2 || tags.includes("poverty"))) {
    gaps.push("No incluyes medidas de largo plazo: la ayuda de emergencia por sí sola no reduce la vulnerabilidad estructural.");
  }
  if (horizon.inmediato === 0 && tags.includes("conflict")) {
    gaps.push("No incluyes respuesta inmediata en un contexto donde la población puede estar en riesgo de muerte por hambre.");
  }
  if (selected.some((m) => m.id === "cash") && tags.includes("conflict") && !selected.some((m) => m.id === "conflict_protection")) {
    gaps.push("Las transferencias monetarias dependen de mercados funcionales; sin acceso y protección, su viabilidad disminuye.");
  }

  if (highCost >= 3 && (country.incomeId === "LIC" || country.incomeId === "LMC")) {
    tradeoffs.push(`Has elegido ${highCost} medidas de coste alto en un país de ${country.incomeEs.toLowerCase()}. La capacidad fiscal y la financiación internacional serán un límite real.`);
  }
  if (horizon.inmediato > 0 && horizon["largo plazo"] === 0) {
    tradeoffs.push("La respuesta inmediata puede salvar vidas, pero crea dependencia si no se conecta con producción, empleo o protección social.");
  }
  if (horizon["largo plazo"] > 0 && horizon.inmediato === 0) {
    tradeoffs.push("Las medidas estructurales tardan años en dar fruto; si la crisis es aguda, pueden llegar demasiado tarde para las personas en Fase 4 o 5.");
  }
  if (selected.some((m) => m.id === "emergency_food") && selected.some((m) => m.id === "smallholders")) {
    tradeoffs.push("La ayuda alimentaria y el apoyo a la producción local pueden complementarse, pero también competir por los mismos recursos y mercados si no se coordinan.");
  }
  if (selected.some((m) => m.id === "infrastructure")) {
    tradeoffs.push("La infraestructura exige mantenimiento y gobernanza; sin ellos, la inversión puede no traducirse en acceso para los hogares más pobres.");
  }
  if (selected.some((m) => m.id === "climate_adaptation") && tags.includes("conflict")) {
    tradeoffs.push("La adaptación climática no protege frente a la violencia: en un conflicto, la seguridad y el acceso humanitario siguen siendo el cuello de botella.");
  }
  if (selected.some((m) => m.id === "school_meals") && !selected.some((m) => m.id === "nutrition")) {
    tradeoffs.push("La alimentación escolar no llega a los niños no escolarizados ni sustituye el tratamiento de la desnutrición aguda.");
  }

  return {
    coveragePct,
    coveredTags,
    uncovered: unfinished.map((c) => ({ title: c.title, tag: c.tag, type: c.type })),
    horizon,
    evidence,
    highCost,
    strengths,
    gaps,
    tradeoffs,
  };
}

export function matchWithUN(selected: Measure[], profile: CountryProfile | null) {
  const unIds = new Set<string>();
  for (const u of profile?.unResponse ?? []) for (const id of u.measureIds ?? []) unIds.add(id);
  const userIds = new Set(selected.map((m) => m.id));
  const matched = [...userIds].filter((id) => unIds.has(id));
  const userOnly = [...userIds].filter((id) => !unIds.has(id));
  const unOnly = [...unIds].filter((id) => !userIds.has(id));
  return { matched, userOnly, unOnly, unIds };
}

export function peopleLabel(value: number | null, year: number | null): string {
  if (value == null) return "Datos no disponibles";
  return `${fmtPeople(value)}${year ? ` (${year})` : ""}`;
}

export interface GrfcSlim {
  history: {
    year: number;
    phase3plus: number | null;
    phase3plusPct: number | null;
    period: string | null;
  }[];
  drivers: { primary: string | null; secondary: string | null; tertiary: string | null; year: number | null };
  protracted: boolean;
}

export interface CountryView {
  country: Country;
  challenge: ChallengeView | null;
  scale: ScaleView | null;
  context: ContextItem[];
  profile: CountryProfile | null;
  acute: AcuteView | null;
  grfc: GrfcSlim | null;
  measures: Measure[];
  featured: { iso3: string; nameEs: string }[];
}

export { MAIN_IDS };
