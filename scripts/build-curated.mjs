/**
 * Copia la base de conocimiento curada (perfiles de país, medidas y titulares)
 * desde data/ a public/data/, donde la consumen las páginas y los componentes.
 *
 * No transforma el contenido: valida la estructura mínima y falla si un archivo
 * no es JSON válido o si falta un campo obligatorio. Así se evita publicar una
 * base incompleta sin darse cuenta.
 */
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const DATA = path.join(ROOT, "data");
const OUT = path.join(ROOT, "public", "data");

const read = async (name) => JSON.parse(await fs.readFile(path.join(DATA, name), "utf8"));

const fail = (msg) => {
  console.error(`✗ ${msg}`);
  process.exit(1);
};

const measures = await read("measures.json");
const profiles = await read("country-profiles.json");
const headlines = await read("headlines.json");

if (!Array.isArray(measures.measures) || measures.measures.length === 0) fail("measures.json no contiene medidas");
if (!profiles.profiles || typeof profiles.profiles !== "object") fail("country-profiles.json no contiene perfiles");

const requiredMeasure = ["id", "name", "summary", "objective", "beneficiaries", "agencies", "results", "limitations", "addresses", "horizon", "evidence", "cost", "coverage"];
for (const m of measures.measures) {
  for (const key of requiredMeasure) {
    if (m[key] == null) fail(`La medida ${m.id ?? "?"} no tiene el campo ${key}`);
  }
  if (!Array.isArray(m.results)) fail(`La medida ${m.id} debe tener results como array (puede estar vacío)`);
}

const ids = new Set();
for (const [iso3, p] of Object.entries(profiles.profiles)) {
  if (!/^[A-Z]{3}$/.test(iso3)) fail(`Código ISO3 inválido en perfiles: ${iso3}`);
  if (p.iso3 !== iso3) fail(`El perfil ${iso3} declara iso3=${p.iso3}`);
  if (!Array.isArray(p.causes) || p.causes.length === 0) fail(`El perfil ${iso3} no tiene causas`);
  if (!Array.isArray(p.unResponse)) fail(`El perfil ${iso3} no tiene unResponse`);
  for (const c of p.causes) {
    if (!["documented", "contributing", "hypothesis"].includes(c.type)) fail(`Tipo de evidencia inválido en ${iso3}: ${c.type}`);
  }
  for (const u of p.unResponse) {
    if (!["propuesta", "anunciada", "en-ejecucion", "resultados"].includes(u.status)) fail(`Estado inválido en ${iso3}: ${u.status}`);
    if (!Array.isArray(u.sources) || u.sources.length === 0) fail(`La intervención de ${iso3} no tiene fuentes`);
  }
  ids.add(iso3);
}

if (!headlines.figures?.hungerPeople) fail("headlines.json no contiene las cifras principales");

await fs.mkdir(OUT, { recursive: true });
for (const [src, dest] of [
  ["measures.json", "measures.json"],
  ["country-profiles.json", "country-profiles.json"],
  ["headlines.json", "headlines.json"],
]) {
  const content = await fs.readFile(path.join(DATA, src), "utf8");
  await fs.writeFile(path.join(OUT, dest), content);
}

console.log(`✓ Base curada: ${measures.measures.length} medidas · ${ids.size} perfiles de país · titulares SOFI`);
console.log(`  Perfiles: ${[...ids].sort().join(", ")}`);
