/**
 * Construye la base de datos pública de la aplicación a partir de:
 *  - data/raw/worldbank/*.json  (series oficiales del Banco Mundial/FAO)
 *  - data/indicators.json       (registro metodológico de indicadores)
 *  - raw/ne_countries.geojson   (nombres en español y continente)
 *
 * Salidas (public/data/):
 *  - countries.json  metadatos de países y territorios
 *  - series.json     { iso3: { indicador: [[año, valor], ...] } }
 *  - world.json      agregados mundiales publicados (no calculados aquí)
 *  - indicators.json registro de indicadores + cobertura observada
 *
 * Regla: este script NO estima valores ausentes. Solo normaliza, redondea y
 * elimina duplicados exactos. Los huecos se conservan como huecos.
 */
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const RAW = path.join(ROOT, "data", "raw", "worldbank");
const OUT = path.join(ROOT, "public", "data");
const MIN_YEAR = 2000;

const registry = JSON.parse(await fs.readFile(path.join(ROOT, "data", "indicators.json"), "utf8"));
const indicatorById = Object.fromEntries(registry.indicators.map((i) => [i.id, i]));

const REGION_ES = {
  EAS: "Asia Oriental y el Pacífico",
  ECS: "Europa y Asia Central",
  LCN: "América Latina y el Caribe",
  MEA: "Oriente Medio y Norte de África",
  NAC: "América del Norte",
  SAS: "Asia Meridional",
  SSF: "África Subsahariana",
};
const REGION_CONTINENT = {
  EAS: "Asia",
  ECS: "Europa",
  LCN: "América",
  MEA: "África",
  NAC: "América",
  SAS: "Asia",
  SSF: "África",
};
const INCOME_ES = {
  HIC: "Ingreso alto",
  UMC: "Ingreso medio-alto",
  LMC: "Ingreso medio-bajo",
  LIC: "Ingreso bajo",
};
const CONTINENT_ES = {
  Africa: "África",
  Asia: "Asia",
  Europe: "Europa",
  "North America": "América",
  "South America": "América",
  Oceania: "Oceanía",
  Antarctica: "Antártida",
};

const readJson = async (p) => JSON.parse(await fs.readFile(p, "utf8"));

await fs.mkdir(OUT, { recursive: true });

// ---------- Países ----------
const wbCountries = await readJson(path.join(RAW, "countries.json"));
const ne = await readJson(path.join(ROOT, "raw", "ne_countries.geojson"));
const neByIso = new Map();
for (const f of ne.features) {
  const p = f.properties;
  let iso = p.ISO_A3_EH && p.ISO_A3_EH !== "-99" ? p.ISO_A3_EH : p.ISO_A3;
  if (!iso || iso === "-99") {
    if (p.ADM0_A3 === "SOL") iso = "SOM";
    else if (p.ADM0_A3 === "KOS") iso = "XKX";
    else if (p.ADM0_A3 === "CYN") iso = "CYP";
  }
  if (iso && iso !== "-99" && !neByIso.has(iso)) {
    neByIso.set(iso, { nameEs: p.NAME_ES || p.NAME, continent: CONTINENT_ES[p.CONTINENT] ?? null });
  }
}

const countries = [];
for (const c of wbCountries) {
  if (!c.id || c.region?.id === "NA") continue;
  const meta = neByIso.get(c.id);
  const region = c.region?.id ?? "";
  countries.push({
    iso3: c.id,
    iso2: c.iso2Code ?? "",
    name: c.name,
    nameEs: meta?.nameEs ?? c.name,
    wbRegion: c.region?.value ?? "",
    wbRegionId: region,
    regionEs: REGION_ES[region] ?? c.region?.value ?? "",
    continent: meta?.continent ?? REGION_CONTINENT[region] ?? "Otros",
    income: c.incomeLevel?.value ?? "",
    incomeId: c.incomeLevel?.id ?? "",
    incomeEs: INCOME_ES[c.incomeLevel?.id] ?? c.incomeLevel?.value ?? "",
    lat: c.latitude ? Number(c.latitude) : null,
    lon: c.longitude ? Number(c.longitude) : null,
    capital: c.capitalCity ?? "",
  });
}
countries.sort((a, b) => a.nameEs.localeCompare(b.nameEs, "es"));

// ---------- Series ----------
const series = {};
for (const c of countries) series[c.iso3] = {};

const coverage = {};
for (const [id, ind] of Object.entries(indicatorById)) {
  const file = path.join(RAW, `${ind.wbCode}.json`);
  let payload;
  try {
    payload = await readJson(file);
  } catch {
    console.warn(`⚠ Sin archivo para ${id} (${ind.wbCode})`);
    continue;
  }
  const byCountry = new Map();
  let duplicates = 0;
  for (const r of payload.rows) {
    if (r.value == null || !r.iso3) continue;
    if (r.date < MIN_YEAR) continue;
    if (!series[r.iso3]) continue; // agrega o territorio no listado
    if (!byCountry.has(r.iso3)) byCountry.set(r.iso3, []);
    const arr = byCountry.get(r.iso3);
    const existing = arr.find((p) => p[0] === r.date);
    if (existing) {
      duplicates++;
      continue;
    }
    let v = r.value;
    const d = ind.decimals ?? 1;
    v = d === 0 ? Math.round(v) : Number(v.toFixed(d));
    arr.push([r.date, v]);
  }
  let n = 0;
  const years = new Set();
  for (const [iso3, arr] of byCountry) {
    arr.sort((a, b) => a[0] - b[0]);
    series[iso3][id] = arr;
    n += arr.length;
    arr.forEach((p) => years.add(p[0]));
  }
  coverage[id] = {
    countries: byCountry.size,
    values: n,
    firstYear: years.size ? Math.min(...years) : null,
    lastYear: years.size ? Math.max(...years) : null,
    duplicatesRemoved: duplicates,
    vintage: payload.fetchedAt?.slice(0, 10) ?? null,
  };
  console.log(`  ${id.padEnd(16)} ${String(n).padStart(6)} valores · ${byCountry.size} países · ${Math.min(...years)}-${Math.max(...years)}`);
}

// ---------- Agregados mundiales publicados ----------
const world = {};
for (const ind of registry.indicators) {
  try {
    const w = await readJson(path.join(RAW, `WLD_${ind.wbCode}.json`));
    const arr = w.rows
      .filter((r) => r.value != null && r.date >= MIN_YEAR)
      .map((r) => [r.date, Number(Number(r.value).toFixed(ind.decimals ?? 1))])
      .sort((a, b) => a[0] - b[0]);
    if (arr.length) world[ind.id] = arr;
  } catch {
    /* indicador sin agregado mundial */
  }
}

// ---------- Indicadores con cobertura ----------
const publicRegistry = {
  ...registry,
  indicators: registry.indicators.map((i) => ({ ...i, coverage: coverage[i.id] ?? null })),
};

await fs.writeFile(path.join(OUT, "countries.json"), JSON.stringify(countries));
await fs.writeFile(path.join(OUT, "series.json"), JSON.stringify({ generatedAt: new Date().toISOString(), series }));
await fs.writeFile(path.join(OUT, "world.json"), JSON.stringify(world));
await fs.writeFile(path.join(OUT, "indicators.json"), JSON.stringify(publicRegistry, null, 1));

const size = (await fs.stat(path.join(OUT, "series.json"))).size;
console.log(`\n✓ ${countries.length} países · ${(size / 1024).toFixed(0)} KB de series · salida en public/data/`);
