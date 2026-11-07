/**
 * Validación de la base de datos publicada en public/data/.
 *
 * Comprueba estructura, rangos, coherencia temporal y que la base curada
 * (perfiles, medidas y titulares) cumpla el esquema que consumen las páginas.
 * Falla con código 1 si encuentra un error: así un dato roto no llega al build.
 *
 * Ejecutar: npm run data:validate
 */
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

const ROOT = process.cwd();
const DATA = path.join(ROOT, "public", "data");

const problems = [];
const warnings = [];
const fail = (msg) => problems.push(msg);
const warn = (msg) => warnings.push(msg);

function read(name) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA, name), "utf8"));
  } catch (err) {
    console.error(`✗ No se pudo leer ${name}: ${err.message}`);
    process.exit(1);
  }
}

const countries = read("countries.json");
const seriesFile = read("series.json");
const world = read("world.json");
const indicatorsFile = read("indicators.json");
const grfc = read("grfc.json");
const measuresFile = read("measures.json");
const profilesFile = read("country-profiles.json");
const headlines = read("headlines.json");

const series = seriesFile.series;
const indicators = indicatorsFile.indicators;
const indicatorIds = new Set(indicators.map((i) => i.id));
const iso3Set = new Set(countries.map((c) => c.iso3));

/* ------------------------------- Países ------------------------------- */

const countrySchema = z.object({
  iso3: z.string().regex(/^[A-Z]{3}$/, "ISO3 inválido"),
  iso2: z.string().regex(/^[A-Z]{2}$/, "ISO2 inválido"),
  name: z.string().min(1),
  nameEs: z.string().min(1),
  wbRegion: z.string().min(1),
  wbRegionId: z.string().min(1),
  regionEs: z.string().min(1),
  continent: z.string().min(1),
  income: z.string().min(1),
  incomeId: z.string().min(1),
  incomeEs: z.string().min(1),
  lat: z.number().min(-90).max(90).nullable(),
  lon: z.number().min(-180).max(180).nullable(),
  capital: z.string(),
});

const countrySeen = new Set();
for (const c of countries) {
  const parsed = countrySchema.safeParse(c);
  if (!parsed.success) {
    fail(`País inválido ${c.iso3 ?? "?"}: ${parsed.error.issues.map((i) => i.message).join(", ")}`);
    continue;
  }
  if (countrySeen.has(c.iso3)) fail(`ISO3 duplicado en countries.json: ${c.iso3}`);
  countrySeen.add(c.iso3);
}
if (countries.length < 190) fail(`Solo hay ${countries.length} países; se esperaban al menos 190.`);

/* ----------------------------- Indicadores ----------------------------- */

const coverageSchema = z.object({
  countries: z.number().int().nonnegative(),
  values: z.number().int().nonnegative(),
  firstYear: z.number().int().nullable(),
  lastYear: z.number().int().nullable(),
  duplicatesRemoved: z.number().int().nonnegative(),
  vintage: z.string().nullable(),
});

const indicatorSchema = z.object({
  id: z.string().min(1),
  wbCode: z.string().min(1),
  name: z.string().min(1),
  shortName: z.string().min(1),
  unit: z.string().min(1),
  valueType: z.enum(["percent", "count", "currency", "index"]),
  decimals: z.number().int().min(0).max(3),
  direction: z.enum(["higher-is-worse", "lower-is-worse", "neutral"]),
  sdg: z.string().optional(),
  definition: z.string().min(20),
  methodology: z.string().min(20),
  source: z.string().min(3),
  sourceUrl: z.string().url(),
  aggregation: z.string().min(3),
  comparability: z.string().min(20),
  isPrimary: z.boolean(),
  coverage: coverageSchema.nullable(),
});

const indicatorSeen = new Set();
for (const ind of indicators) {
  const parsed = indicatorSchema.safeParse(ind);
  if (!parsed.success) {
    fail(`Indicador inválido ${ind.id ?? "?"}: ${parsed.error.issues.map((i) => i.message).join(", ")}`);
    continue;
  }
  if (indicatorSeen.has(ind.id)) fail(`Indicador duplicado: ${ind.id}`);
  indicatorSeen.add(ind.id);
}
if (indicators.length !== 12) fail(`Se esperaban 12 indicadores registrados; hay ${indicators.length}.`);

/* -------------------------------- Series -------------------------------- */

const PERCENT_IDS = new Set(["pou", "msfi", "sfi", "stunting", "wasting", "poverty", "agri_land"]);
const counts = Object.fromEntries([...indicatorIds].map((id) => [id, { values: 0, countries: new Set(), min: null, max: null }]));

let seriesCountries = 0;
for (const [iso3, byIndicator] of Object.entries(series)) {
  seriesCountries++;
  if (!iso3Set.has(iso3)) fail(`series.json contiene un ISO3 que no está en countries.json: ${iso3}`);
  for (const [id, points] of Object.entries(byIndicator)) {
    if (!indicatorIds.has(id)) {
      fail(`Indicador desconocido en series.json (${iso3}): ${id}`);
      continue;
    }
    if (!Array.isArray(points) || points.length === 0) {
      fail(`Serie vacía en ${iso3}/${id}`);
      continue;
    }
    let prevYear = -Infinity;
    for (const p of points) {
      if (!Array.isArray(p) || p.length !== 2) {
        fail(`Punto mal formado en ${iso3}/${id}`);
        break;
      }
      const [year, value] = p;
      if (!Number.isInteger(year) || year < 1990 || year > 2026) {
        fail(`Año fuera de rango en ${iso3}/${id}: ${year}`);
      }
      if (year <= prevYear) {
        fail(`Serie no ordenada o año duplicado en ${iso3}/${id}: ${year}`);
      }
      prevYear = year;
      if (typeof value !== "number" || !Number.isFinite(value)) {
        fail(`Valor no numérico en ${iso3}/${id} (${year})`);
        continue;
      }
      if (PERCENT_IDS.has(id) && (value < 0 || value > 100)) {
        fail(`Porcentaje fuera de 0-100 en ${iso3}/${id} (${year}): ${value}`);
      }
      if (id === "gini" && (value < 0 || value > 100)) {
        fail(`Gini fuera de 0-100 en ${iso3}/${id} (${year}): ${value}`);
      }
      if (["undernourished_n", "population"].includes(id) && value < 0) {
        fail(`Conteo negativo en ${iso3}/${id} (${year}): ${value}`);
      }
      const c = counts[id];
      c.values++;
      c.countries.add(iso3);
      c.min = c.min == null ? year : Math.min(c.min, year);
      c.max = c.max == null ? year : Math.max(c.max, year);
    }
  }
}
if (seriesCountries < 190) fail(`series.json solo contiene ${seriesCountries} países.`);

// La cobertura declarada en indicators.json debe coincidir con la serie publicada.
for (const ind of indicators) {
  const c = counts[ind.id];
  if (!c || !ind.coverage) continue;
  if (c.values !== ind.coverage.values) {
    fail(`Cobertura de ${ind.id}: indicators.json declara ${ind.coverage.values} valores, series.json tiene ${c.values}.`);
  }
  if (c.countries.size !== ind.coverage.countries) {
    fail(`Cobertura de ${ind.id}: indicators.json declara ${ind.coverage.countries} países, series.json tiene ${c.countries.size}.`);
  }
  if (c.min !== ind.coverage.firstYear || c.max !== ind.coverage.lastYear) {
    fail(
      `Cobertura temporal de ${ind.id}: indicators.json declara ${ind.coverage.firstYear}-${ind.coverage.lastYear}, series.json tiene ${c.min}-${c.max}.`,
    );
  }
}

/* -------------------------------- Mundo -------------------------------- */

for (const [id, points] of Object.entries(world)) {
  if (!indicatorIds.has(id)) fail(`Indicador desconocido en world.json: ${id}`);
  if (!Array.isArray(points) || points.length < 2) {
    fail(`Serie mundial vacía o demasiado corta: ${id}`);
    continue;
  }
  let prev = -Infinity;
  for (const [year, value] of points) {
    if (!Number.isInteger(year) || year <= prev) fail(`Serie mundial no ordenada en ${id}: ${year}`);
    prev = year;
    if (typeof value !== "number" || !Number.isFinite(value)) fail(`Valor mundial no numérico en ${id} (${year})`);
    if (PERCENT_IDS.has(id) && (value < 0 || value > 100)) fail(`Porcentaje mundial fuera de rango en ${id} (${year}): ${value}`);
  }
}

/* --------------------------------- GRFC --------------------------------- */

if (!grfc.countries || Object.keys(grfc.countries).length < 50) {
  fail("grfc.json no contiene suficientes países.");
}
for (const [iso3, c] of Object.entries(grfc.countries ?? {})) {
  if (!/^[A-Z]{3}$/.test(iso3)) fail(`ISO3 inválido en grfc.json: ${iso3}`);
  if (!Array.isArray(c.history) || c.history.length === 0) {
    fail(`GRFC sin historial: ${iso3}`);
    continue;
  }
  let prev = -Infinity;
  c.history.forEach((h, i) => {
    if (h.year <= prev) fail(`Historial GRFC no ordenado en ${iso3}: ${h.year}`);
    prev = h.year;
    if (h.phase3plusPct != null && (h.phase3plusPct < 0 || h.phase3plusPct > 100)) {
      fail(`Porcentaje GRFC fuera de 0-100 en ${iso3} (${h.year}): ${h.phase3plusPct}`);
    }
    if (h.phase3plus != null && h.phase3plus < 0) fail(`Personas GRFC negativas en ${iso3} (${h.year})`);
    if (h.period != null && typeof h.period !== "string") fail(`Periodo GRFC no textual en ${iso3} (${h.year})`);
    if (h.period === "nan" || h.source === "nan") fail(`Texto 'nan' sin limpiar en GRFC ${iso3} (${h.year})`);
    const before = c.history[i - 1];
    if (
      before &&
      before.period != null &&
      before.period === h.period &&
      before.phase3plus === h.phase3plus &&
      before.phase3plusPct === h.phase3plusPct
    ) {
      fail(`Evaluación GRFC duplicada en ${iso3}: ${before.year} y ${h.year} (${h.period})`);
    }
  });
  const last = c.history[c.history.length - 1];
  if (!c.latest || c.latest.year !== last.year) {
    fail(`GRFC ${iso3}: latest no coincide con el último punto del historial.`);
  }
  if (c.latest.phase3plus !== last.phase3plus || c.latest.phase3plusPct !== last.phase3plusPct) {
    fail(`GRFC ${iso3}: las cifras de latest no coinciden con el historial.`);
  }
  if (c.drivers?.year != null && !c.history.some((h) => h.year === c.drivers.year)) {
    fail(`GRFC ${iso3}: el año de los conductores (${c.drivers.year}) no está en el historial.`);
  }
  if (c.nutrition?.classification === "nan") fail(`GRFC ${iso3}: clasificación nutricional 'nan'.`);
}

/* ------------------------------- Curados ------------------------------- */

const causeSchema = z.object({
  type: z.enum(["documented", "contributing", "hypothesis"]),
  title: z.string().min(3),
  detail: z.string().min(20),
  source: z.string().min(3),
  url: z.string().url().optional(),
  year: z.number().int().min(2000).max(2026).optional(),
  tag: z
    .enum([
      "conflict",
      "economic",
      "climate",
      "production",
      "access",
      "poverty",
      "inequality",
      "displacement",
      "nutrition",
      "infrastructure",
    ])
    .optional(),
});

const interventionSchema = z.object({
  programme: z.string().min(3),
  agencies: z.array(z.string().min(2)).min(1),
  status: z.enum(["propuesta", "anunciada", "en-ejecucion", "resultados"]),
  statusNote: z.string().optional(),
  measureIds: z.array(z.string()).optional(),
  objectives: z.string().min(10),
  interventions: z.string().min(10),
  results: z.string().min(10),
  limitations: z.string().min(10),
  sources: z
    .array(z.object({ label: z.string(), url: z.string().url(), year: z.number().int() }))
    .min(1),
});

const acuteOverrideSchema = z.object({
  year: z.number().int().min(2020).max(2026),
  phase3plus: z.number().int().nonnegative().nullable(),
  phase3plusPct: z.number().min(0).max(100).nullable(),
  period: z.string().min(3),
  source: z.string().min(3),
  url: z.string().url(),
  note: z.string().optional(),
});

const profileSchema = z.object({
  iso3: z.string().regex(/^[A-Z]{3}$/),
  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  context: z.string().min(80),
  causes: z.array(causeSchema).min(1),
  hypotheses: z.array(causeSchema).optional(),
  acuteOverride: acuteOverrideSchema.optional(),
  hiddenIndicators: z.array(z.string()).optional(),
  unResponse: z.array(interventionSchema),
  adaptation: z
    .object({
      country: z.string(),
      organisation: z.string(),
      strategy: z.string(),
      results: z.string(),
      applicability: z.string(),
      source: z.object({ label: z.string(), url: z.string().url(), year: z.number().int() }),
    })
    .optional(),
  caveat: z.string().optional(),
});

const profileIds = Object.keys(profilesFile.profiles ?? {});
if (profileIds.length !== 12) fail(`Se esperaban 12 perfiles de país; hay ${profileIds.length}.`);
for (const [iso3, p] of Object.entries(profilesFile.profiles ?? {})) {
  const parsed = profileSchema.safeParse(p);
  if (!parsed.success) {
    fail(`Perfil ${iso3}: ${parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
  }
  if (p.iso3 !== iso3) fail(`Perfil ${iso3} declara iso3=${p.iso3}`);
  if (!iso3Set.has(iso3)) fail(`Perfil ${iso3} no existe en countries.json`);
  if (p.acuteOverride && !p.caveat) {
    fail(`Perfil ${iso3} usa acuteOverride sin caveat que explique la sustitución.`);
  }
  for (const id of p.hiddenIndicators ?? []) {
    if (!indicatorIds.has(id)) fail(`Perfil ${iso3} oculta un indicador inexistente: ${id}`);
  }
}

const measureSchema = z.object({
  id: z.string().regex(/^[a-z0-9_]+$/),
  name: z.string().min(3),
  shortName: z.string().min(3),
  icon: z.string().min(2),
  summary: z.string().min(20),
  description: z.string().min(40),
  objective: z.string().min(10),
  beneficiaries: z.string().min(10),
  agencies: z.array(z.string()).min(1),
  implementedIn: z.array(z.string()).min(1),
  results: z.array(
    z.object({
      claim: z.string().min(15),
      source: z.string().min(3),
      url: z.string().url(),
      year: z.number().int().min(2000).max(2026),
    }),
  ),
  limitations: z.array(z.string().min(10)).min(1),
  addresses: z
    .array(
      z.enum([
        "conflict",
        "economic",
        "climate",
        "production",
        "access",
        "poverty",
        "inequality",
        "displacement",
        "nutrition",
        "infrastructure",
      ]),
    )
    .min(1),
  horizon: z.enum(["inmediato", "corto plazo", "largo plazo"]),
  evidence: z.enum(["fuerte", "moderada", "limitada"]),
  cost: z.enum(["alto", "medio", "bajo"]),
  coverage: z.enum(["amplia", "media", "focalizada"]),
});

const measureIds = new Set();
if (!Array.isArray(measuresFile.measures) || measuresFile.measures.length < 6) {
  fail("measures.json no contiene suficientes medidas.");
}
for (const m of measuresFile.measures ?? []) {
  const parsed = measureSchema.safeParse(m);
  if (!parsed.success) {
    fail(`Medida ${m.id ?? "?"}: ${parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
  }
  if (measureIds.has(m.id)) fail(`Medida duplicada: ${m.id}`);
  measureIds.add(m.id);
}
for (const [iso3, p] of Object.entries(profilesFile.profiles ?? {})) {
  for (const u of p.unResponse ?? []) {
    for (const id of u.measureIds ?? []) {
      if (!measureIds.has(id)) fail(`Perfil ${iso3} referencia una medida inexistente: ${id}`);
    }
  }
}

/* ------------------------------- Titulares ------------------------------ */

const headlineSchema = z.object({
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  edition: z.string().min(4),
  reportTitle: z.string().min(10),
  publisher: z.string().min(5),
  published: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  doi: z.string().url(),
  pressRelease: z.string().url(),
  figures: z.object({
    hungerPeople: z.number().positive(),
    hungerPrevalence: z.number().min(0).max(100),
    hungerPeoplePrevYear: z.number().positive(),
    hungerPrevalence2024: z.number().min(0).max(100),
    hungerPrevalence2022: z.number().min(0).max(100),
    msfiPrevalence: z.number().min(0).max(100),
    msfiPeople: z.number().positive(),
    msfiPrevalence2024: z.number().min(0).max(100),
    msfiPrevalence2020: z.number().min(0).max(100),
    unaffordableHealthyDietPeople: z.number().positive(),
    unaffordableHealthyDietPrevalence: z.number().min(0).max(100),
    healthyDietCostPpp: z.number().positive(),
    africaHungryPeople: z.number().positive(),
    africaHungerPrevalence: z.number().min(0).max(100),
    africaHungerPrevalence2024: z.number().min(0).max(100),
    asiaHungryPeople: z.number().positive(),
    stuntedChildren: z.number().positive(),
    projection2030Low: z.number().positive(),
    projection2030High: z.number().positive(),
  }),
  regionalMsfi: z.array(z.object({ region: z.string(), prevalence: z.number().min(0).max(100) })).min(3),
  notes: z.array(z.string()).min(1),
});
const headlineParsed = headlineSchema.safeParse(headlines);
if (!headlineParsed.success) {
  fail(`headlines.json: ${headlineParsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
}
if (headlines.figures?.projection2030Low >= headlines.figures?.projection2030High) {
  fail("La proyección 2030 tiene un rango invertido.");
}
if (headlines.figures?.hungerPeoplePrevYear <= headlines.figures?.hungerPeople) {
  fail("Se esperaba que las personas con hambre hubieran disminuido respecto al año anterior.");
}

/* -------------------------------- Salida -------------------------------- */

console.log("Hunger Map · validación de datos");
console.log(`  Países: ${countries.length}`);
console.log(`  Indicadores: ${indicators.length}`);
console.log(`  Series: ${seriesCountries} países · ${Object.values(counts).reduce((s, c) => s + c.values, 0)} valores`);
console.log(`  GRFC: ${Object.keys(grfc.countries ?? {}).length} países y territorios`);
console.log(`  Perfiles: ${profileIds.length} · Medidas: ${measureIds.size}`);

if (warnings.length) {
  console.log(`\nAdvertencias (${warnings.length}):`);
  for (const w of warnings) console.log(`  ! ${w}`);
}

if (problems.length) {
  console.error(`\n✗ ${problems.length} error(es):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

console.log("\n✓ Base de datos válida.");
