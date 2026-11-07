# Cómo actualizar la base de datos

Esta guía describe el proceso completo para actualizar series, cifras titulares, perfiles de país y medidas de respuesta sin romper la comparabilidad ni publicar datos sin verificar.

## Antes de empezar

1. Anota la **edición** y la **fecha de consulta** de cada fuente que vayas a usar.
2. Comprueba si el organismo **revisó la serie completa** o solo añadió un año. No mezcles una edición nueva con una descarga antigua.
3. Si una cifra no se puede verificar en una fuente primaria, **no se publica**. Se deja el hueco y la interfaz muestra «Datos no disponibles».
4. Ejecuta `npm test` antes de tocar nada para confirmar que la base de partida es válida.

## 1. Actualizar las series del Banco Mundial

```bash
npm run data:worldbank
npm run data:build
```

- El primero descarga los 12 indicadores y los agregados mundiales a `data/raw/worldbank/`. Guárdalos: permiten auditar qué respondió la API y cuándo.
- El segundo reconstruye `public/data/series.json`, `countries.json`, `world.json` e `indicators.json`.
- La cobertura (`countries`, `values`, `firstYear`, `lastYear`) se recalcula en cada ejecución y se escribe en `public/data/indicators.json`.

### Si añades un indicador

1. Añade su código WDI a `INDICATORS` en `scripts/fetch-worldbank.mjs`.
2. Añade su ficha completa en `data/indicators.json` (id, código, nombre, unidad, tipo, decimales, dirección, definición, método, fuente, agregación, comparabilidad, cobertura).
3. Añade el id a las listas correspondientes de `components/data/DataExplorer.tsx` si debe aparecer en la página de estadísticas.
4. Ejecuta `npm run data` y después `npm run data:validate`. La validación exige que la cobertura declarada coincida con la serie publicada.

## 2. Actualizar el GRFC

1. Descarga la nueva edición (o actualización de mitad de año) desde HDX.
2. Sustituye `raw/grfc.xlsx`.
3. Revisa que las columnas que usa el script sigan existiendo. Las principales son `ISO Code 3`, `Data availability`, `GRFC edition`, `Year of reference`, `Analysis period`, `Source`, `Methodology` y la población en Fase 3+.
4. Ejecuta:

```bash
npm run data:grfc
```

- El script convierte `NaN`, `None` y cadenas vacías en `null`. **No debe quedar el texto `"nan"` en el JSON.** La validación falla si aparece.
- Una misma evaluación puede repetirse en dos filas con distinto «año de referencia». Si el periodo y las cifras son idénticos, el script conserva la fila más reciente para no dibujar dos observaciones donde hay una.

5. Comprueba el resultado:

```bash
node -e "const g=require('./public/data/grfc.json'); console.log(g.meta); console.log(Object.keys(g.countries).length)"
```

### Reglas del GRFC

- El porcentaje de Fase 3+ se calcula sobre la **población analizada**, no sobre la población total.
- El dato más reciente puede cubrir solo una parte del año y un área concreta.
- No se compara con la PoU ni con la FIES.
- Si un país desaparece de la nueva edición, su ficha mostrará «Datos no disponibles»; no se conserva el dato viejo como si fuera actual.

## 3. Actualizar las cifras titulares de SOFI

Edita `data/headlines.json`. Campos obligatorios:

- `asOf`: fecha de consulta en formato `AAAA-MM-DD`.
- `edition`, `reportTitle`, `publisher`, `published`, `doi`, `pressRelease`.
- `figures`: personas y prevalencias de hambre, inseguridad alimentaria moderada o grave, dieta saludable, regiones, desnutrición y proyección 2030.
- `regionalMsfi`: al menos tres regiones con su prevalencia.
- `notes`: notas metodológicas visibles en la interfaz.

Después:

```bash
npm run data:curated
npm run data:validate
```

La validación comprueba que las prevalencias estén entre 0 y 100, que las cifras sean positivas, que el rango de proyección no esté invertido y que la serie de hambre descienda respecto al año anterior cuando la edición lo indique.

> **No mezcles** las cifras de SOFI con la serie país-año del WDI en un mismo gráfico. SOFI 2026 publica 7,8 % para 2025; la serie del WDI termina en 2024 con 8,1 %. Son ediciones y años distintos.

## 4. Actualizar o añadir un perfil de país

Los perfiles viven en `data/country-profiles.json`. Solo deben existir países con evidencia verificable suficiente. El `iso3` debe coincidir con `countries.json`.

Estructura mínima:

```json
{
  "iso3": "SDN",
  "updated": "2026-11-04",
  "context": "Texto de contexto con cifras fechadas y fuente.",
  "causes": [
    {
      "type": "documented",
      "title": "Conflicto armado",
      "detail": "Descripción con evidencia y periodo.",
      "source": "GRFC 2026",
      "url": "https://www.fsinplatform.org/global-report-food-crises",
      "year": 2026,
      "tag": "conflict"
    }
  ],
  "unResponse": [
    {
      "programme": "Nombre del programa",
      "agencies": ["PMA (WFP)"],
      "status": "en-ejecucion",
      "statusNote": "Qué se verificó y qué no.",
      "measureIds": ["emergency_food"],
      "objectives": "Objetivo documentado.",
      "interventions": "Qué hace la intervención.",
      "results": "Resultados verificables o necesidad descrita, sin confundirlos.",
      "limitations": "Limitaciones de acceso, financiación o datos.",
      "sources": [
        { "label": "PMA — Sudán", "url": "https://www.wfp.org/countries/sudan", "year": 2026 }
      ]
    }
  ],
  "caveat": "Advertencia si se usa una sustitución de datos.",
  "hiddenIndicators": ["poverty"]
}
```

### Taxonomía de causas

| Tipo | Significado |
| --- | --- |
| `documented` | La fuente primaria identifica el factor de forma explícita para ese país y periodo. |
| `contributing` | La fuente lo señala como factor que agrava la situación, sin atribuirle el papel principal. |
| `hypothesis` | Hipótesis razonada que la fuente no confirma. Debe presentarse como tal. |

La etiqueta describe el **nivel de evidencia**, no la importancia política del factor.

### Taxonomía de la respuesta

| Estado | Significado |
| --- | --- |
| `propuesta` | Recomendación o diseño que no consta como adoptado ni financiado. |
| `anunciada` | Meta o programa anunciado; no se verificó su ejecución completa. |
| `en-ejecucion` | Operación en curso. Las cifras pueden describir necesidad o alcance, no efecto medido. |
| `resultados` | Existe al menos un resultado cuantitativo verificable en la fuente citada. |

No uses `resultados` para una proyección de necesidad ni para el número de personas alcanzadas. Alcance no es impacto.

### Sustituciones explícitas (`acuteOverride`)

Solo se permiten cuando la base principal no tiene un dato reciente y existe una fuente alternativa verificable. Requieren:

- `year`, `phase3plus`, `phase3plusPct`, `period`, `source`, `url`.
- Un `caveat` en el perfil que explique por qué se sustituye y por qué no es comparable.
- Una `note` que indique el denominador y el ámbito geográfico.

Casos actuales: `PSE` (dato del PMA 2026 para Gaza). La validación rechaza un `acuteOverride` sin `caveat`.

### Ocultar indicadores poco fiables

`hiddenIndicators` permite ocultar un indicador en la ficha de un país cuando la cobertura de la encuesta es implausible o no representa al país. Debe usarse con criterio y documentarse en el `caveat`. Caso actual: `poverty` en `PSE`.

## 5. Actualizar o añadir medidas de respuesta

Edita `data/measures.json`. Cada medida debe declarar:

- `id` en minúsculas y guiones bajos.
- `name`, `shortName`, `summary`, `description`, `objective`, `beneficiaries`.
- `agencies` e `implementedIn`.
- `results`: lista de resultados con `claim`, `source`, `url` y `year`. **Puede estar vacía** si no hay un resultado cuantitativo verificado; no se inventa uno.
- `limitations`: al menos una.
- `addresses`: dimensiones de causa que aborda.
- `horizon`, `evidence`, `cost`, `coverage`.

Si una medida no tiene resultados verificados, deja `results: []` y explica en `limitations` qué falta. La interfaz mostrará la medida sin atribuirle impacto.

## 6. Propagar y validar

Siempre en este orden:

```bash
npm run data:curated   # copia perfiles, medidas y titulares a public/data/
npm run data:validate  # estructura, rangos, coherencia
npm test               # validación + pruebas de cálculo
npm run build          # exportación estática
```

`npm run data:curated` no transforma el contenido: valida la estructura mínima y falla si falta un campo obligatorio. `npm run data:validate` aplica los esquemas Zod completos.

## 7. Errores frecuentes

| Síntoma | Causa probable | Solución |
| --- | --- | --- |
| La ficha no refleja un cambio en `data/` | No se ejecutó `data:curated` | `npm run data:curated && npm run build` |
| `indicators.json declara X valores, series.json tiene Y` | Serie regenerada sin actualizar cobertura | `npm run data:build` de nuevo |
| Aparece `"nan"` en el GRFC | Columna nueva o texto vacío | Revisar `txt()` en `scripts/build-grfc.py` y regenerar |
| El build falla en `/pais/[iso3]` | Perfil con ISO3 que no existe en `countries.json` | Corregir el ISO3 o el perfil |
| `acuteOverride` rechazado | Falta `caveat` | Añadir la advertencia al perfil |
| Una medida no aparece en el simulador | `id` no está en la biblioteca o el perfil la referencia mal | Revisar `measureIds` y `measures.json` |

## 8. Versionado editorial

- La fecha de consulta global está en `data/headlines.json` (`asOf`).
- Cada perfil tiene su propio `updated`.
- Cada descarga del WDI conserva `fetchedAt` y `sourceApi` en el JSON crudo.
- Cada intervención y cada resultado citan su año y su URL.

Cuando publiques una actualización, anota en el historial de cambios qué edición entra, qué serie se regeneró y qué cifras cambiaron. No sobrescribas una serie sin dejar rastro de la vendimia anterior.
