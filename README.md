# Hunger Map

Experiencia web interactiva y educativa para leer el hambre en el mundo con datos oficiales. No es una publicación de las Naciones Unidas: es un proyecto independiente de divulgación que remite cada cifra a su fuente, su año y su indicador.

El sitio está en español, funciona como sitio estático y no necesita claves de API ni servicios de pago.

## Qué incluye

| Ruta | Contenido |
| --- | --- |
| `/` | Panorama global: cifras de SOFI 2026, series mundiales y acceso al mapa. |
| `/mapa/` | Mapa coropleta de todos los países, con indicador y año seleccionables, búsqueda, zoom y panel de país. |
| `/desafio/` | Desafío de estimación sobre un mapa en blanco: elige un país, predice su prevalencia y revela el dato oficial sin ver antes los colores. |
| `/movil/` | Versión móvil separada: portada compacta, mapa táctil con pellizco, desafío por pasos y rankings. Tiene su propia navegación inferior; el chrome de escritorio no se muestra. |
| `/pais/[iso3]/` | Experiencia por país: estimación → dato oficial → escala 1–10 → causas → simulador de soluciones → evaluación → respuesta documentada de la ONU. |
| `/datos/` | Rankings, filtros, comparación regional, series multipaís y exportación CSV. |
| `/metodologia/` | Definiciones, registro de indicadores, fuentes, comparabilidad, proceso de actualización, validación y limitaciones. |

La base cubre **217 países**, **12 indicadores**, **35 460 valores país-año**, **72 países y territorios** con datos de crisis alimentaria aguda (GRFC), **12 perfiles de país verificados** y **10 medidas** de respuesta.

La **versión móvil** (`/movil`) es una ruta separada con navegación inferior propia, mapa táctil con zoom de pellizco, panel deslizante y desafío en tres pasos. No muestra la cabecera ni el pie de escritorio; desde ella se puede saltar a la ficha completa de cualquier país.

## Stack

- **Next.js 15.5.29** (App Router, exportación estática con `output: "export"`)
- **React 19.3.1** y **TypeScript**
- **Tailwind CSS 4.1.13** (versión fijada: la 4.3.4, probada en este entorno, arrastra `magic-string` 1.4.5, que es ESM-only y Node 20 no puede `require()`)
- **d3-geo** y **topojson-client** para el mapa SVG (sin librería de mapas externa)
- **Recharts 3.10.1** solo donde aporta gráficos interactivos
- **Zod 4** para validar la base de datos y los archivos curados

No hay backend, base de datos en producción ni llamadas a APIs en tiempo de ejecución. Todo se genera antes del build y se sirve como JSON estático desde `public/data/`.

## Requisitos

- Node.js 20 o superior
- npm
- Python 3.12 con `pandas` y `openpyxl` **solo** si vas a regenerar el GRFC desde `raw/grfc.xlsx`

## Puesta en marcha

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`. El repositorio ya incluye la base publicada en `public/data/`, así que no hace falta regenerar datos para desarrollar la interfaz.

Para comprobar la versión estática:

```bash
npm run build
npx serve out
```

El resultado queda en `out/`. Cualquier servidor estático sirve; no requiere reescrituras ni funciones del servidor.

## Regenerar los datos

La secuencia completa es:

```bash
npm run data:worldbank   # descarga series del WDI a data/raw/worldbank/
npm run data:grfc        # normaliza raw/grfc.xlsx a public/data/grfc.json
npm run data:geo         # convierte Natural Earth en topojson y nombres en español
npm run data:curated     # valida y copia perfiles, medidas y titulares
npm run data:build       # fusiona todo y genera series país-año y mundiales
npm run data:validate    # comprueba estructura, rangos y coherencia
npm test                 # validación + pruebas de cálculo
npm run build            # compila el sitio estático
```

`npm run data` ejecuta los cinco pasos de generación en orden.

### Qué hace cada paso

- `data:worldbank` descarga los indicadores del Banco Mundial con su API pública. No usa clave ni rastrea al usuario. Los archivos crudos quedan en `data/raw/worldbank/` para poder auditar la descarga.
- `data:grfc` lee `raw/grfc.xlsx` (GRFC 2026, actualización de mitad de año) y genera un historial por país con población en Fase 3 o superior del IPC, conductores, desplazamiento y nutrición. Limpia valores `NaN` para que no aparezcan como texto.
- `data:geo` convierte `raw/ne_countries.geojson` (Natural Earth 1:110m) en `public/data/world-110m.topo.json` y un diccionario de nombres en español.
- `data:curated` valida con Zod los archivos editados a mano (`data/measures.json`, `data/country-profiles.json`, `data/headlines.json`) y los copia a `public/data/`.
- `data:build` construye el modelo definitivo: países, series, agregados mundiales y metadatos de cobertura.

> **Orden importante:** si editas un archivo de `data/`, ejecuta `npm run data:curated` antes de `npm run build`. La aplicación lee siempre `public/data/`.

## Estructura del proyecto

```text
app/                         rutas y layout (App Router)
  page.tsx                   portada
  mapa/page.tsx              mapa interactivo
  desafio/page.tsx           desafío de estimación sobre mapa en blanco
  movil/                     versión móvil separada (layout propio y pestañas)
  movil/page.tsx             portada móvil
  movil/mapa/page.tsx        mapa táctil con panel deslizante
  movil/desafio/page.tsx     desafío móvil en tres pasos
  movil/datos/page.tsx       rankings compactos
  datos/page.tsx             estadísticas y rankings
  metodologia/page.tsx       metodología y fuentes
  pais/[iso3]/page.tsx       ficha de país (225 páginas estáticas)
components/
  home/                      portada
  map/                       mapa SVG y panel de país
  challenge/                 mapa en blanco y predicción del desafío
  mobile/                    cabecera, pestañas y vistas de la versión móvil
  country/                   desafío, escala, causas, simulador, evaluación, ONU
  data/                      rankings, filtros y gráfico multipaís
  charts/                    series mundiales
lib/
  types.ts                   tipos del dominio
  analysis.ts                consultas por año exacto, deciles, tendencias
  country.ts                 selección de indicador, escala, contexto, evaluación
  data-server.ts             lectura de datos en build
  client-data.ts             carga de JSON en el navegador
  format.ts                  formato español (coma decimal, millones)
  map-scale.ts               bins y colores del mapa
data/
  raw/                       descargas originales (WDI) y Natural Earth
  measures.json              biblioteca de medidas de respuesta
  country-profiles.json      perfiles verificados (12 países)
  headlines.json             cifras titulares de SOFI 2026
  indicators.json            metadatos de los 12 indicadores
public/data/                 base publicada que consume el sitio
scripts/                     descarga, normalización, validación y pruebas
docs/                        documentación ampliada
```

## Modelo de datos

`public/data/series.json` tiene la forma:

```json
{
  "generatedAt": "2026-11-05T...",
  "series": {
    "AFG": {
      "pou": [[2001, 48.2], [2002, 47.1]],
      "msfi": [[2015, 60.1]],
      "population": [[2000, 20100000]]
    }
  }
}
```

Cada punto es `[año, valor]`. Reglas:

- Solo observaciones publicadas. **No se interpola** ni se rellena un año ausente.
- Cada indicador declara unidad, método, fuente, agregación y límites de comparabilidad en `indicators.json`.
- La cobertura declarada en `indicators.json` debe coincidir exactamente con la serie publicada; la validación falla si no.
- Los archivos curados usan ISO3 como clave y Zod como contrato.

Archivos principales de `public/data/`:

| Archivo | Contenido |
| --- | --- |
| `series.json` | Serie país-año por indicador |
| `countries.json` | País, ISO2/ISO3, región del Banco Mundial, continente, ingreso, coordenadas y capital |
| `world.json` | Agregados mundiales publicados |
| `indicators.json` | Registro metodológico de los 12 indicadores |
| `grfc.json` | Crisis alimentaria aguda: historial, conductores, desplazamiento y nutrición |
| `measures.json` | Medidas de respuesta con evidencia y limitaciones |
| `country-profiles.json` | Perfiles de país verificados |
| `headlines.json` | Cifras titulares de la edición SOFI vigente |
| `world-110m.topo.json` | Geometrías del mapa |

## Reglas estadísticas que aplica la interfaz

1. **Tres medidas distintas.** Subalimentación (PoU, ODS 2.1.1), inseguridad alimentaria moderada o grave (FIES, ODS 2.1.2) e inseguridad alimentaria aguda (IPC/CH, Fase 3+) se muestran por separado y nunca se suman ni se presentan como equivalentes.
2. **Sin interpolación.** Una consulta a un año sin observación devuelve «Datos no disponibles». Los gráficos dejan huecos visibles.
3. **Sin cálculos propios de personas.** La cifra de personas subalimentadas usa la serie oficial `SN.ITK.DEFC`. Nunca se multiplica la prevalencia por la población.
4. **Escala 1–10 relativa.** Es el decil de la distribución mundial de países con dato para el mismo indicador y año. Requiere al menos 30 países. Nivel 1 no significa «sin hambre».
5. **Mapa honesto.** El gris significa «sin dato para ese año», no «sin hambre». Los cortes de color son fijos y están documentados en la leyenda.
6. **Perfiles verificados.** Solo 12 países tienen causas y respuesta de la ONU curadas. El resto muestra sus datos y los conductores del GRFC, con un aviso explícito de que no existe un perfil verificado.
7. **Estados de las intervenciones.** `propuesta`, `anunciada`, `en-ejecucion` y `resultados`. Un resultado solo se etiqueta como tal si la fuente citada incluye una cifra verificable.

## Verificación

```bash
npm run data:validate   # estructura, rangos, coherencia y esquemas
npm test                # validación + 69 pruebas de cálculo
npm run build           # exportación estática
```

`scripts/validate-data.mjs` comprueba ISO3, duplicados, orden temporal, porcentajes entre 0 y 100, conteos no negativos, coherencia de cobertura, limpieza del GRFC y los esquemas de perfiles, medidas y titulares.

`scripts/test-calculations.mjs` transpila `lib/` a CommonJS en un directorio temporal y prueba la lógica real: consulta por año exacto, deciles, selección del indicador del desafío, sustituciones explícitas, evaluación de medidas y formato español.

## Documentación

- [`docs/fuentes.md`](docs/fuentes.md) — inventario de fuentes, indicadores y vendimias.
- [`docs/actualizacion.md`](docs/actualizacion.md) — cómo actualizar series, perfiles y medidas sin romper la comparabilidad.
- [`docs/limitaciones.md`](docs/limitaciones.md) — qué puede y qué no puede afirmar la aplicación.

La página `/metodologia/` contiene la versión pública y resumida de esta documentación.

## Despliegue

El build genera archivos estáticos en `out/`. Sirve esa carpeta con cualquier CDN o hosting estático. No hay variables de entorno, secretos ni funciones serverless.

### GitHub Pages (sitio compilado)

GitHub Pages publica archivos, no ejecuta `next build`. La vía más simple —y la única que no exige tocar rutas— es un repositorio de usuario:

1. Crea un repositorio **público** llamado `TUUSUARIO.github.io`.
2. Sube **el contenido** de `out/` (no la carpeta `out`) a la raíz del repositorio.
3. Comprueba que existe `.nojekyll` en la raíz. Ya se genera desde `public/.nojekyll`; sin él, Pages ignora la carpeta `_next/` y el sitio queda sin estilos ni JavaScript.
4. En el repositorio: **Settings → Pages → Source: Deploy from a branch**, rama `main`, carpeta `/ (root)`.
5. El sitio queda en `https://TUUSUARIO.github.io/` y la versión móvil en `https://TUUSUARIO.github.io/movil/`.

La aplicación usa rutas absolutas (`/_next/...`, `/data/...`, `/movil/`), así que **no funciona en la URL de un proyecto** (`TUUSUARIO.github.io/mi-repo/`) sin configurar `basePath` y prefijar también las rutas de `public/data/`. Para un repositorio con nombre distinto, usa Vercel o Netlify, que publican en la raíz del dominio.

### Código fuente en GitHub

El repositorio de código no es un sitio web: quien lo abra necesita Node.js 20 o superior y ejecutar `npm install && npm run dev`. El `.gitignore` excluye `node_modules/` (428 MB), `.next/`, `out/` y la caché de TypeScript, de modo que solo se sube el código y la base de `data/` y `public/data/`.

Si publicas el proyecto, conserva los enlaces a las fuentes originales y la advertencia de que no es una publicación oficial de la ONU.

## Créditos y uso de los datos

Los datos pertenecen a sus organismos de origen: FAO/FIDA/UNICEF/PMA/OMS (SOFI y FAOSTAT), Banco Mundial (WDI), FSIN/GNAFC, IPC, PMA y UNICEF/OMS/Banco Mundial (JME). Natural Earth aporta las geometrías. Este repositorio solo los normaliza y los presenta; cita siempre la fuente original y la edición consultada.
