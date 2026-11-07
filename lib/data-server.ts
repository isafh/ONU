import fs from "node:fs";
import path from "node:path";
import type {
  Country,
  CountryProfiles,
  GrfcData,
  Headlines,
  IndicatorMeta,
  Measure,
  Series,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "public", "data");
const jsonCache = new Map<string, unknown>();

function readJson<T>(file: string): T {
  if (!jsonCache.has(file)) {
    jsonCache.set(file, JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf8")));
  }
  return jsonCache.get(file) as T;
}

let cache: {
  countries?: Country[];
  series?: Series;
  world?: Record<string, [number, number][]>;
  indicators?: IndicatorMeta[];
  grfc?: GrfcData;
} = {};

export function getCountries(): Country[] {
  cache.countries ??= readJson<Country[]>("countries.json");
  return cache.countries;
}

export function getSeries(): Series {
  cache.series ??= readJson<{ series: Series }>("series.json").series;
  return cache.series;
}

export function getWorld(): Record<string, [number, number][]> {
  cache.world ??= readJson<Record<string, [number, number][]>>("world.json");
  return cache.world;
}

export function getIndicators(): IndicatorMeta[] {
  cache.indicators ??= readJson<{ indicators: IndicatorMeta[] }>("indicators.json").indicators;
  return cache.indicators;
}

export function getGrfc(): GrfcData {
  cache.grfc ??= readJson<GrfcData>("grfc.json");
  return cache.grfc;
}

export function getMeasures(): Measure[] {
  return readJson<{ measures: Measure[] }>("measures.json").measures;
}

export function getProfiles(): CountryProfiles {
  return readJson<CountryProfiles>("country-profiles.json");
}

export function getHeadlines(): Headlines {
  return readJson<Headlines>("headlines.json");
}

export function getCountry(iso3: string): Country | undefined {
  return getCountries().find((c) => c.iso3 === iso3.toUpperCase());
}

export function getIndicator(id: string): IndicatorMeta | undefined {
  return getIndicators().find((i) => i.id === id);
}
