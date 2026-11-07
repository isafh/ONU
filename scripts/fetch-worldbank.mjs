/**
 * Descarga los indicadores oficiales desde la API abierta del Banco Mundial
 * (World Development Indicators). No requiere clave ni autenticación.
 *
 * Los indicadores de hambre e inseguridad alimentaria de esta API provienen de
 * FAO/FAOSTAT (SOFI). Los de nutrición, de UNICEF/OMS/Banco Mundial (JME).
 * Los datos se guardan en bruto en data/raw/worldbank/ para poder auditar.
 */
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const RAW = path.join(ROOT, "data", "raw", "worldbank");
const API = "https://api.worldbank.org/v2";
const DATE_RANGE = "1990:2026";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const INDICATORS = [
  "SN.ITK.DEFC.ZS", // prevalencia de subalimentación (PoU, SDG 2.1.1)
  "SN.ITK.DEFC", // número de personas subalimentadas
  "SN.ITK.MSFI.ZS", // inseguridad alimentaria moderada o grave (FIES, SDG 2.1.2)
  "SN.ITK.SVFI.ZS", // inseguridad alimentaria grave (FIES)
  "SH.STA.STNT.ZS", // retraso del crecimiento en menores de 5 años
  "SH.STA.WAST.ZS", // emaciación en menores de 5 años
  "SP.POP.TOTL", // población total
  "SI.POV.DDAY", // pobreza bajo el umbral internacional
  "NY.GDP.PCAP.PP.KD", // PIB per cápita PPA
  "AG.PRD.FOOD.XD", // índice de producción de alimentos
  "SI.POV.GINI", // índice de Gini
  "AG.LND.AGRI.ZS", // superficie agrícola
];

async function apiGet(url, attempt = 1) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "hunger-map/1.0 (educational project)" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    if (attempt >= 4) throw err;
    await sleep(1200 * attempt);
    return apiGet(url, attempt + 1);
  }
}

async function fetchAllPages(pathname) {
  const first = await apiGet(`${API}/${pathname}${pathname.includes("?") ? "&" : "?"}format=json&per_page=20000`);
  if (!Array.isArray(first) || !first[1]) return [];
  const [meta, rows] = first;
  let all = rows;
  const pages = Number(meta.pages ?? 1);
  for (let p = 2; p <= pages; p++) {
    const next = await apiGet(`${API}/${pathname}${pathname.includes("?") ? "&" : "?"}format=json&per_page=20000&page=${p}`);
    all = all.concat(next[1] ?? []);
    await sleep(120);
  }
  return all;
}

await fs.mkdir(RAW, { recursive: true });

console.log("→ Descargando metadatos de países…");
const countriesRaw = await fetchAllPages("country");
await fs.writeFile(path.join(RAW, "countries.json"), JSON.stringify(countriesRaw, null, 0));

const vintage = {};
for (const code of INDICATORS) {
  console.log(`→ ${code}`);
  const rows = await fetchAllPages(`country/all/indicator/${code}?date=${DATE_RANGE}`);
  const payload = {
    indicator: code,
    fetchedAt: new Date().toISOString(),
    sourceApi: `${API}/country/all/indicator/${code}?format=json&date=${DATE_RANGE}`,
    rows: rows.map((r) => ({
      iso3: r.countryiso3code,
      country: r.country?.value,
      date: Number(r.date),
      value: r.value,
      unit: r.unit ?? "",
      obsStatus: r.obs_status ?? "",
    })),
  };
  vintage[code] = payload.fetchedAt;
  await fs.writeFile(path.join(RAW, `${code}.json`), JSON.stringify(payload, null, 0));
  await sleep(250);
}

// Agregados mundiales y regionales publicados por el propio Banco Mundial/FAO.
for (const code of INDICATORS) {
  const rows = await fetchAllPages(`country/WLD/indicator/${code}?date=${DATE_RANGE}`);
  await fs.writeFile(
    path.join(RAW, `WLD_${code}.json`),
    JSON.stringify({ indicator: code, rows: rows.map((r) => ({ date: Number(r.date), value: r.value })) }, null, 0),
  );
}

await fs.writeFile(
  path.join(RAW, "_manifest.json"),
  JSON.stringify(
    {
      source: "World Bank — World Development Indicators (API abierta v2)",
      license: "CC BY 4.0 (Banco Mundial); indicadores FAO/UNICEF/OMS según se indica",
      dateRange: DATE_RANGE,
      downloadedAt: new Date().toISOString(),
      indicators: INDICATORS,
    },
    null,
    2,
  ),
);
console.log("✓ Datos del Banco Mundial descargados en data/raw/worldbank/");
