/**
 * Pruebas de las funciones de cálculo que sostienen la experiencia:
 * búsqueda por año exacto, escala de deciles, desafío de estimación,
 * evaluación de medidas y sustitución explícita de datos agudos.
 *
 * No usa interpolación: varias pruebas comprueban precisamente que un hueco
 * devuelve null en lugar de un valor inventado.
 *
 * Ejecutar: node scripts/test-calculations.mjs
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const ROOT = process.cwd();
const require = createRequire(import.meta.url);

/** Transpila lib/*.ts a CommonJS en un directorio temporal para poder probarlo. */
function loadLib() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hunger-map-test-"));
  for (const file of ["analysis.ts", "format.ts", "country.ts"]) {
    const src = fs.readFileSync(path.join(ROOT, "lib", file), "utf8");
    const out = ts.transpileModule(src, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
      fileName: file,
    });
    fs.writeFileSync(path.join(dir, file.replace(/\.ts$/, ".js")), out.outputText);
  }
  return {
    analysis: require(path.join(dir, "analysis.js")),
    country: require(path.join(dir, "country.js")),
    format: require(path.join(dir, "format.js")),
  };
}

const { analysis, country, format } = loadLib();
const read = (name) => JSON.parse(fs.readFileSync(path.join(ROOT, "public", "data", name), "utf8"));

const countries = read("countries.json");
const series = read("series.json").series;
const world = read("world.json");
const indicators = read("indicators.json").indicators;
const grfc = read("grfc.json");
const measures = read("measures.json").measures;
const profiles = read("country-profiles.json").profiles;

const byIso = (iso3) => countries.find((c) => c.iso3 === iso3);
const measure = (id) => measures.find((m) => m.id === id);

let passed = 0;
let failed = 0;

function check(name, condition, detail = "") {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function equal(name, actual, expected) {
  check(name, Object.is(actual, expected), `esperado ${JSON.stringify(expected)}, obtenido ${JSON.stringify(actual)}`);
}

console.log("\n1. Consulta por año exacto (sin interpolación)");
{
  const points = [
    [2000, 10],
    [2002, 30],
  ];
  equal("valueInYear devuelve el valor exacto", analysis.valueInYear(points, 2002), 30);
  equal("valueInYear no interpola un año ausente", analysis.valueInYear(points, 2001), null);
  equal("valueInYear devuelve null fuera de la serie", analysis.valueInYear(points, 1999), null);
  equal("latestUntil respeta el límite", analysis.latestUntil(points, 2001)[1], 10);
  equal("latestPoint devuelve el último punto", analysis.latestPoint(points)[0], 2002);
  equal("latestPoint de una serie vacía es null", analysis.latestPoint([]), null);
}

console.log("\n2. Deciles de la distribución mundial");
{
  const values = Array.from({ length: 100 }, (_, i) => i + 1);
  const low = analysis.decileLevel(1, values);
  const mid = analysis.decileLevel(50, values);
  const high = analysis.decileLevel(100, values);
  equal("el valor mínimo cae en el nivel 1", low.level, 1);
  equal("la mediana cae en el nivel 5", mid.level, 5);
  equal("el valor máximo cae en el nivel 10", high.level, 10);
  equal("se registran 100 países", high.n, 100);
  equal("hay 9 cortes de decil", high.thresholds.length, 9);
  check(
    "los cortes están ordenados",
    high.thresholds.every((v, i, a) => i === 0 || v >= a[i - 1]),
  );
  equal("con menos de 30 países no se asigna nivel", analysis.decileLevel(50, values.slice(0, 29)), null);
  check(
    "el percentil usa el rango medio",
    Math.abs(mid.percentile - 49.5) < 1e-9,
    `percentil ${mid.percentile}`,
  );
}

console.log("\n3. Selección del indicador del desafío");
{
  const afg = country.pickChallenge(byIso("AFG"), series, indicators);
  equal("AFG usa PoU (no el sustituto)", afg.id, "pou");
  equal("AFG no está marcado como fallback", afg.isFallback, false);
  equal("AFG tiene cifra oficial de personas", Boolean(afg.people), true);

  const yem = country.pickChallenge(byIso("YEM"), series, indicators);
  equal("YEM usa MSFI como sustituto explícito", yem.id, "msfi");
  equal("YEM está marcado como fallback", yem.isFallback, true);
  check("YEM explica por qué se usa el sustituto", Boolean(yem.fallbackReason));
  equal("YEM no inventa una cifra de personas", yem.people, null);

  const and = country.pickChallenge(byIso("AND"), series, indicators);
  equal("un país sin datos no recibe un desafío inventado", and, null);
}

console.log("\n4. Escala relativa 1-10");
{
  const afg = byIso("AFG");
  const challenge = country.pickChallenge(afg, series, indicators);
  const scale = country.buildScale(afg, countries, series, "pou", 2024, challenge.value, world);
  check("la escala existe con cobertura suficiente", scale.decile !== null);
  check("hay al menos 30 países con dato", scale.nCountries >= 30);
  equal("el promedio mundial de 2024 es 8,1", scale.world.value, 8.1);
  equal("el promedio mundial es del año exacto", scale.world.exact, true);
  equal("la región es Asia", scale.regionName, "Asia");
  check("hay mediana regional", Number.isFinite(scale.regionMedian));
  check("hay puesto regional", Number.isInteger(scale.regionRank));
  check("los pares regionales están ordenados de mayor a menor", scale.regionPeers.every((p, i, a) => i === 0 || p.value <= a[i - 1].value));
  check(
    "el nivel corresponde al decil calculado",
    scale.decile.level >= 1 && scale.decile.level <= 10,
  );
}

console.log("\n5. Contexto del país");
{
  const pse = byIso("PSE");
  const challenge = country.pickChallenge(pse, series, indicators);
  const context = country.buildContext(pse, series, indicators, challenge.id, profiles.PSE.hiddenIndicators);
  check("no se repite el indicador del desafío", context.every((c) => c.id !== challenge.id));
  check("no se muestra pobreza en PSE", context.every((c) => c.id !== "poverty"));
  check("no se muestran datos anteriores a 2015", context.every((c) => c.year >= 2015));
  check("no se muestra PoU cuando el desafío usa MSFI", context.every((c) => c.id !== "pou"));
  check("todos los elementos tienen fuente y año", context.every((c) => c.source && c.year));
}

console.log("\n6. Inseguridad alimentaria aguda y sustituciones");
{
  const maxYear = Math.max(...Object.values(grfc.countries).flatMap((c) => c.history.map((h) => h.year)));
  const sdn = country.buildAcute(profiles.SDN, grfc.countries.SDN, maxYear);
  equal("SDN usa el GRFC", sdn.origin, "grfc");
  equal("SDN tiene el dato agudo más reciente", sdn.year, 2026);
  check("SDN indica el periodo", Boolean(sdn.period));

  const pse = country.buildAcute(profiles.PSE, grfc.countries.PSE, maxYear);
  equal("PSE usa una sustitución explícita", pse.origin, "pma-override");
  equal("PSE usa el año del PMA", pse.year, 2026);
  check("PSE explica la sustitución", Boolean(pse.note));
  check("PSE no presenta el dato de 2022 como actual", pse.year > 2022);
}

console.log("\n7. Evaluación de medidas");
{
  const sdn = byIso("SDN");
  const empty = country.evaluateMeasures([], profiles.SDN, sdn, true);
  equal("sin medidas la cobertura es 0", empty.coveragePct, 0);
  check("sin medidas hay un aviso", empty.gaps.length > 0);

  const onlyFood = country.evaluateMeasures([measure("emergency_food")], profiles.SDN, sdn, true);
  check("una medida de emergencia cubre alguna dimensión", onlyFood.coveragePct > 0);
  check(
    "se detecta la falta de protección en un conflicto",
    onlyFood.gaps.some((g) => g.includes("protección") || g.includes("acceso humanitario")),
  );

  const combo = country.evaluateMeasures(
    [measure("emergency_food"), measure("conflict_protection"), measure("nutrition"), measure("cash")],
    profiles.SDN,
    sdn,
    true,
  );
  check("una combinación amplia tiene más cobertura", combo.coveragePct >= onlyFood.coveragePct);
  check("la combinación incluye respuesta inmediata", combo.horizon.inmediato > 0);
  check(
    "ya no falta protección con la combinación",
    !combo.gaps.some((g) => g.includes("protección o del acceso humanitario")),
  );
  check("hay tensiones o trade-offs documentados", combo.tradeoffs.length > 0);

  const noProfile = country.evaluateMeasures([measure("emergency_food")], null, byIso("AND"), false);
  equal("sin perfil no se atribuye cobertura de causas", noProfile.coveragePct, 0);
}

console.log("\n8. Comparación con la respuesta de la ONU");
{
  const selected = [measure("emergency_food"), measure("school_meals")];
  const sdn = country.matchWithUN(selected, profiles.SDN);
  check("la ayuda de emergencia coincide con Sudán", sdn.matched.includes("emergency_food"));
  check("la alimentación escolar no consta para Sudán", sdn.userOnly.includes("school_meals"));
  check("hay medidas de la ONU fuera de la selección", sdn.unOnly.length > 0);

  const none = country.matchWithUN(selected, null);
  equal("sin perfil no hay coincidencias", none.matched.length, 0);
}

console.log("\n9. Formato de cifras");
{
  equal("645 millones se muestra en español", format.fmtPeople(645_000_000), "645 millones");
  equal("1,4 millones conserva el decimal", format.fmtPeople(1_400_000), "1,4 millones");
  equal("12 millones no arrastra decimales", format.fmtPeople(12_000_000), "12 millones");
  equal("2,1 mil millones se muestra completo", format.fmtPeople(2_100_000_000), "2,1 mil millones");
  equal("una cifra ausente se declara", format.fmtPeople(null), "Datos no disponibles");
  equal("los porcentajes llevan coma decimal", format.fmtNumber(8.1, 1), "8,1");
  equal("la cota de la FAO se muestra como «< 2,5 %»", format.fmtPou(2.5), "< 2,5 %");
  equal("fmtPou no altera otros valores", format.fmtPou(8.1), "8,1 %");
  equal("la diferencia firmada usa puntos porcentuales", format.fmtSignedPct(2.3), "+2,3 pp");
}

console.log("\n10. Integridad de las series usadas en las pruebas");
{
  const afgPou = series.AFG.pou;
  check("AFG tiene PoU en 2024", afgPou.some(([y]) => y === 2024));
  check("YEM no tiene PoU", !series.YEM.pou || series.YEM.pou.length === 0);
  check("YEM tiene MSFI", series.YEM.msfi.length > 0);
  check("la serie de personas subalimentadas es oficial", series.AFG.undernourished_n.length > 0);
}

console.log(`\n${failed === 0 ? "✓" : "✗"} ${passed} pruebas superadas, ${failed} fallidas.`);
if (failed > 0) process.exit(1);
