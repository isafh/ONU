import type {
  Country,
  CountrySeries,
  GrfcData,
  IndicatorId,
  Series,
  SeriesPoint,
} from "./types";

export const MIN_COUNTRIES_FOR_DECILES = 30;

export function pointsFor(series: Series, iso3: string, id: IndicatorId): SeriesPoint[] {
  return series[iso3]?.[id] ?? [];
}

/** Valor exacto de un año concreto. No interpola ni rellena huecos. */
export function valueInYear(points: SeriesPoint[], year: number): number | null {
  const p = points.find((x) => x[0] === year);
  return p ? p[1] : null;
}

/** Último valor disponible (con su año). */
export function latestPoint(points: SeriesPoint[]): SeriesPoint | null {
  if (!points.length) return null;
  return points[points.length - 1];
}

/** Último valor disponible hasta un año inclusive. */
export function latestUntil(points: SeriesPoint[], year: number): SeriesPoint | null {
  let found: SeriesPoint | null = null;
  for (const p of points) {
    if (p[0] <= year) found = p;
    else break;
  }
  return found;
}

export function firstAvailableYear(series: Series, id: IndicatorId): number | null {
  let min: number | null = null;
  for (const iso3 of Object.keys(series)) {
    for (const p of series[iso3]?.[id] ?? []) {
      if (min == null || p[0] < min) min = p[0];
    }
  }
  return min;
}

export function latestAvailableYear(series: Series, id: IndicatorId): number | null {
  let max: number | null = null;
  for (const iso3 of Object.keys(series)) {
    for (const p of series[iso3]?.[id] ?? []) {
      if (max == null || p[0] > max) max = p[0];
    }
  }
  return max;
}

/** Años con al menos un dato para el indicador, ordenados. */
export function yearsWithData(series: Series, id: IndicatorId): number[] {
  const years = new Set<number>();
  for (const iso3 of Object.keys(series)) {
    for (const [y] of series[iso3]?.[id] ?? []) years.add(y);
  }
  return [...years].sort((a, b) => a - b);
}

/** Todos los valores de todos los países en un año (para rankings y deciles). */
export function valuesInYear(
  countries: Country[],
  series: Series,
  id: IndicatorId,
  year: number,
): { iso3: string; value: number }[] {
  const out: { iso3: string; value: number }[] = [];
  for (const c of countries) {
    const v = valueInYear(pointsFor(series, c.iso3, id), year);
    if (v != null) out.push({ iso3: c.iso3, value: v });
  }
  return out;
}

export function quantileSorted(sorted: number[], q: number): number {
  if (!sorted.length) return Number.NaN;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

export function median(values: number[]): number {
  if (!values.length) return Number.NaN;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export interface DecileResult {
  level: number;
  percentile: number;
  n: number;
  thresholds: number[];
  below: number;
  /** Nivel 1 = 10 % con menor prevalencia; nivel 10 = 10 % con mayor. */
  label: string;
}

/**
 * Clasificación en deciles de la distribución mundial de países con dato.
 * Criterio explícito y reproducible: el nivel es el decil de la posición del
 * país en la distribución (no una escala clínica). Requiere al menos 30 países.
 */
export function decileLevel(value: number, allValues: number[]): DecileResult | null {
  const sorted = allValues.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  const n = sorted.length;
  if (n < MIN_COUNTRIES_FOR_DECILES) return null;
  const below = sorted.filter((v) => v < value).length;
  // Percentil por rango medio para manejar empates de forma estable.
  const equal = sorted.filter((v) => v === value).length;
  const percentile = ((below + equal / 2) / n) * 100;
  const level = Math.min(10, Math.max(1, Math.ceil(percentile / 10) || 1));
  const thresholds = Array.from({ length: 9 }, (_, i) => quantileSorted(sorted, (i + 1) / 10));
  const labels = [
    "el 10 % de países con menor prevalencia",
    "el siguiente 10 %",
    "el 20-30 % más bajo",
    "el 30-40 %",
    "el 40-50 % (mitad inferior)",
    "el 50-60 % (mitad superior)",
    "el 60-70 %",
    "el 70-80 %",
    "el 80-90 %",
    "el 10 % de países con mayor prevalencia",
  ];
  return { level, percentile, n, thresholds, below, label: labels[level - 1] };
}

export function weightedMean(pairs: { value: number; weight: number }[]): number | null {
  const valid = pairs.filter((p) => Number.isFinite(p.value) && Number.isFinite(p.weight) && p.weight > 0);
  const w = valid.reduce((s, p) => s + p.weight, 0);
  if (!w) return null;
  return valid.reduce((s, p) => s + p.value * p.weight, 0) / w;
}

export interface Trend {
  firstYear: number;
  lastYear: number;
  first: number;
  last: number;
  change: number;
  relative: number | null;
  years: number;
}

export function trend(points: SeriesPoint[], window = 10): Trend | null {
  if (points.length < 2) return null;
  const last = points[points.length - 1];
  const target = last[0] - window;
  let first = points[0];
  for (const p of points) {
    if (p[0] >= target) {
      first = p;
      break;
    }
  }
  if (first[0] === last[0]) return null;
  const change = last[1] - first[1];
  return {
    firstYear: first[0],
    lastYear: last[0],
    first: first[1],
    last: last[1],
    change,
    relative: first[1] !== 0 ? (change / first[1]) * 100 : null,
    years: last[0] - first[0],
  };
}

export function regionalPeers(
  countries: Country[],
  series: Series,
  iso3: string,
  id: IndicatorId,
  year: number,
): { iso3: string; value: number }[] {
  const country = countries.find((c) => c.iso3 === iso3);
  if (!country) return [];
  return valuesInYear(countries, series, id, year)
    .filter((v) => countries.find((c) => c.iso3 === v.iso3)?.continent === country.continent)
    .sort((a, b) => b.value - a.value);
}

export function rankOf(values: { iso3: string; value: number }[], iso3: string): number | null {
  const idx = values.findIndex((v) => v.iso3 === iso3);
  return idx === -1 ? null : idx + 1;
}

export function grfcCountry(grfc: GrfcData | null, iso3: string) {
  return grfc?.countries?.[iso3] ?? null;
}

export function hasGrfc(grfc: GrfcData | null, iso3: string): boolean {
  return Boolean(grfc?.countries?.[iso3]);
}

/** Diferencia en puntos porcentuales estimación vs dato real. */
export function estimateDifference(estimate: number, real: number) {
  const diff = estimate - real;
  return {
    diff,
    abs: Math.abs(diff),
    ratio: real > 0 ? estimate / real : null,
    direction: diff > 0 ? ("over" as const) : diff < 0 ? ("under" as const) : ("exact" as const),
  };
}

export function countrySeries(series: Series, iso3: string): CountrySeries {
  return series[iso3] ?? {};
}
