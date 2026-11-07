export type IndicatorId =
  | "pou"
  | "msfi"
  | "sfi"
  | "undernourished_n"
  | "stunting"
  | "wasting"
  | "population"
  | "poverty"
  | "gdp_pc"
  | "food_prod"
  | "gini"
  | "agri_land";

export type SeriesPoint = [year: number, value: number];
export type CountrySeries = Partial<Record<IndicatorId, SeriesPoint[]>>;
export type Series = Record<string, CountrySeries>;

export interface Country {
  iso3: string;
  iso2: string;
  name: string;
  nameEs: string;
  wbRegion: string;
  wbRegionId: string;
  regionEs: string;
  continent: string;
  income: string;
  incomeId: string;
  incomeEs: string;
  lat: number | null;
  lon: number | null;
  capital: string;
}

export interface IndicatorCoverage {
  countries: number;
  values: number;
  firstYear: number | null;
  lastYear: number | null;
  duplicatesRemoved: number;
  vintage: string | null;
}

export interface IndicatorMeta {
  id: IndicatorId;
  wbCode: string;
  name: string;
  shortName: string;
  unit: string;
  valueType: "percent" | "count" | "currency" | "index";
  decimals: number;
  direction: "higher-is-worse" | "lower-is-worse" | "neutral";
  sdg?: string;
  definition: string;
  methodology: string;
  source: string;
  sourceUrl: string;
  aggregation: string;
  comparability: string;
  isPrimary: boolean;
  coverage: IndicatorCoverage | null;
}

export interface GrfcHistoryPoint {
  year: number;
  edition: number;
  phase3plus: number | null;
  phase3plusPct: number | null;
  phase4: number | null;
  phase5: number | null;
  analysedPop: number | null;
  totalPop: number | null;
  period: string | null;
  source: string | null;
  methodology: string | null;
  area: string | null;
}

export interface GrfcCountry {
  name: string;
  region: string;
  regionEs: string;
  history: GrfcHistoryPoint[];
  latest: GrfcHistoryPoint & { latestYear: number };
  drivers: {
    primary: string | null;
    secondary: string | null;
    tertiary: string | null;
    year: number | null;
  };
  protracted: boolean;
  displacement?: {
    year: number;
    total: number;
    idps: number;
    refugeesAsylum: number;
    source: string;
  };
  nutrition?: {
    year: number;
    gamBurden: number | null;
    samBurden: number | null;
    period: string | null;
    classification: string | null;
    source: string;
  };
}

export type GrfcData = {
  meta: {
    title: string;
    publisher: string;
    indicator: string;
    indicatorNote: string;
    url: string;
    hdx: string;
    downloadedAt: string;
    coverage: string;
  };
  countries: Record<string, GrfcCountry>;
};

export type CauseTag =
  | "conflict"
  | "economic"
  | "climate"
  | "production"
  | "access"
  | "poverty"
  | "inequality"
  | "displacement"
  | "nutrition"
  | "infrastructure";

export type EvidenceType = "documented" | "contributing" | "hypothesis";

export interface CauseItem {
  type: EvidenceType;
  title: string;
  detail: string;
  source: string;
  url?: string;
  year?: number;
  tag?: CauseTag;
}

export type ProgrammeStatus = "propuesta" | "anunciada" | "en-ejecucion" | "resultados";

export interface ProgrammeResult {
  claim: string;
  source: string;
  url: string;
  year: number;
}

export interface Measure {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  summary: string;
  description: string;
  objective: string;
  beneficiaries: string;
  agencies: string[];
  implementedIn: string[];
  results: ProgrammeResult[];
  limitations: string[];
  addresses: CauseTag[];
  horizon: "inmediato" | "corto plazo" | "largo plazo";
  evidence: "fuerte" | "moderada" | "limitada";
  cost: "alto" | "medio" | "bajo";
  coverage: "amplia" | "media" | "focalizada";
}

export interface UNIntervention {
  programme: string;
  agencies: string[];
  status: ProgrammeStatus;
  statusNote?: string;
  measureIds?: string[];
  objectives: string;
  interventions: string;
  results: string;
  limitations: string;
  sources: { label: string; url: string; year: number }[];
}

/**
 * Dato de inseguridad alimentaria aguda que sustituye al del GRFC cuando la
 * base de datos no recoge una evaluación reciente (p. ej., Palestina). Debe
 * incluir siempre fuente, periodo y año: nunca se usa para rellenar huecos.
 */
export interface AcuteOverride {
  year: number;
  phase3plus: number | null;
  phase3plusPct: number | null;
  period: string;
  source: string;
  url: string;
  note?: string;
}

export interface CountryProfile {
  iso3: string;
  updated: string;
  context: string;
  causes: CauseItem[];
  hypotheses?: CauseItem[];
  acuteOverride?: AcuteOverride;
  hiddenIndicators?: IndicatorId[];
  unResponse: UNIntervention[];
  adaptation?: {
    country: string;
    organisation: string;
    strategy: string;
    results: string;
    applicability: string;
    source: { label: string; url: string; year: number };
  };
  caveat?: string;
}

export interface CountryProfiles {
  version: string;
  note: string;
  profiles: Record<string, CountryProfile>;
}

export interface Headlines {
  asOf: string;
  edition: string;
  reportTitle: string;
  publisher: string;
  published: string;
  doi: string;
  pressRelease: string;
  figures: {
    hungerPeople: number;
    hungerPrevalence: number;
    hungerPeoplePrevYear: number;
    hungerPrevalence2024: number;
    hungerPrevalence2022: number;
    msfiPrevalence: number;
    msfiPeople: number;
    msfiPrevalence2024: number;
    msfiPrevalence2020: number;
    unaffordableHealthyDietPeople: number;
    unaffordableHealthyDietPrevalence: number;
    healthyDietCostPpp: number;
    africaHungryPeople: number;
    africaHungerPrevalence: number;
    africaHungerPrevalence2024: number;
    asiaHungryPeople: number;
    stuntedChildren: number;
    projection2030Low: number;
    projection2030High: number;
  };
  regionalMsfi: { region: string; prevalence: number }[];
  notes: string[];
}
