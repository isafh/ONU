/**
 * Convierte Natural Earth 1:110m (dominio público) a TopoJSON simplificado.
 * Conserva el nombre en español, el código ISO3 y el continente.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { topology } from "topojson-server";
import { presimplify, simplify, quantile } from "topojson-simplify";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "raw", "ne_countries.geojson");
const OUT = path.join(ROOT, "public", "data", "world-110m.topo.json");

const SPECIAL_ISO = {
  "-99": null,
  CYN: "CYP", // Chipre del Norte
  SOL: "SOM", // Somalilandia (sin reconocimiento; se agrega a Somalia para no inventar datos)
  KOS: "XKX",
};

const CONTINENT_ES = {
  Africa: "África",
  Asia: "Asia",
  Europe: "Europa",
  "North America": "América del Norte",
  "South America": "América del Sur",
  Oceania: "Oceanía",
  Antarctica: "Antártida",
  "Seven seas (open ocean)": "Océanos",
};

const geojson = JSON.parse(await fs.readFile(SRC, "utf8"));
const features = [];

for (const f of geojson.features) {
  const p = f.properties;
  if (p.CONTINENT === "Antarctica" || p.CONTINENT === "Seven seas (open ocean)") continue;
  let iso3 = p.ISO_A3_EH && p.ISO_A3_EH !== "-99" ? p.ISO_A3_EH : p.ISO_A3;
  if (!iso3 || iso3 === "-99") iso3 = SPECIAL_ISO[p.ADM0_A3] ?? null;
  if (!iso3) continue;
  features.push({
    type: "Feature",
    properties: {
      iso3,
      name: p.NAME,
      nameEs: p.NAME_ES || p.NAME,
      continent: CONTINENT_ES[p.CONTINENT] ?? p.CONTINENT,
    },
    geometry: f.geometry,
  });
}

let topo = topology({ countries: { type: "FeatureCollection", features } }, 1e4);
topo = presimplify(topo);
const minWeight = quantile(topo, 0.35);
topo = simplify(topo, minWeight);

await fs.mkdir(path.dirname(OUT), { recursive: true });
await fs.writeFile(OUT, JSON.stringify(topo));
const stat = await fs.stat(OUT);
console.log(`✓ ${features.length} países/territorios → ${path.relative(ROOT, OUT)} (${(stat.size / 1024).toFixed(0)} KB)`);
