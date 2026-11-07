# Fuentes de datos

Inventario de las fuentes que alimentan Hunger Map. Todas son públicas y gratuitas. No se usa ninguna API de pago, ninguna clave privada ni ningún dato comprado.

**Fecha de consulta de las series y páginas citadas:** noviembre de 2026. Las ediciones y vendimias pueden cambiar; cada archivo de la base conserva su propia fecha en el campo `fetchedAt`, `generatedAt` o `vintage` cuando corresponde.

## 1. SOFI 2026 — cifras titulares

- **Título:** *The State of Food Security and Nutrition in the World 2026*
- **Publicación:** FAO, FIDA, UNICEF, PMA y OMS, 21 de julio de 2026
- **DOI:** <https://doi.org/10.4060/cd8306en>
- **Nota de prensa:** <https://www.fao.org/newsroom/detail/un-report--global-hunger-levels-ease-for-third-consecutive-year-as-regional-disparities-persist/en>
- **Uso:** cifras globales y regionales de hambre, inseguridad alimentaria moderada o grave, dieta saludable inasequible y proyección a 2030.
- **Archivo:** `data/headlines.json` → `public/data/headlines.json`.

Cifras registradas:

| Concepto | Valor | Año |
| --- | --- | --- |
| Personas con hambre (PoU) | 645 millones | 2025 |
| Prevalencia de hambre | 7,8 % | 2025 |
| Personas con inseguridad alimentaria moderada o grave | 2100 millones | 2025 |
| Prevalencia de inseguridad alimentaria moderada o grave | 25,8 % | 2025 |
| Personas que no pueden permitirse una dieta saludable | 2690 millones | 2025 |
| Personas con hambre en África | 309 millones (20,0 %) | 2025 |
| Personas con hambre en Asia | 292 millones | 2025 |
| Proyección de personas con hambre en 2030 | 510–520 millones | 2030 |

> Estas cifras no se mezclan con la serie país-año del Banco Mundial, que termina en 2024 para la PoU. Son ediciones y años distintos. La aplicación lo advierte en las páginas de metodología y estadísticas.

## 2. Banco Mundial — World Development Indicators

- **Portal:** <https://data.worldbank.org>
- **API:** <https://api.worldbank.org/v2/> (pública, sin clave)
- **Uso:** series país-año de los 12 indicadores de la base.
- **Archivos crudos:** `data/raw/worldbank/*.json` (respuesta original de la API).
- **Archivo normalizado:** `public/data/series.json`, `public/data/world.json`, `public/data/indicators.json`.

Los indicadores del WDI remiten a su vez a FAO, UNICEF, OMS y al propio Banco Mundial. La aplicación cita la fuente primaria en cada ficha.

| ID | Código WDI | Indicador | Cobertura | Países | Valores |
| --- | --- | --- | --- | --- | --- |
| `pou` | `SN.ITK.DEFC.ZS` | Prevalencia de subalimentación (ODS 2.1.1) | 2001–2024 | 168 | 3990 |
| `msfi` | `SN.ITK.MSFI.ZS` | Inseguridad alimentaria moderada o grave (ODS 2.1.2) | 2015–2024 | 157 | 1280 |
| `sfi` | `SN.ITK.SVFI.ZS` | Inseguridad alimentaria grave (ODS 2.1.2) | 2015–2024 | 155 | 1260 |
| `undernourished_n` | `SN.ITK.DEFC` | Personas subalimentadas (número) | 2001–2023 | 138 | 2710 |
| `stunting` | `SH.STA.STNT.ZS` | Retraso del crecimiento en menores de 5 años (ODS 2.2.1) | 2000–2024 | 161 | 851 |
| `wasting` | `SH.STA.WAST.ZS` | Emaciación en menores de 5 años (ODS 2.2.2) | 2000–2024 | 162 | 850 |
| `population` | `SP.POP.TOTL` | Población total | 2000–2025 | 217 | 5642 |
| `poverty` | `SI.POV.DDAY` | Pobreza bajo el umbral internacional de 3,00 USD/día (PPA 2021) | 2000–2025 | 168 | 1866 |
| `gdp_pc` | `NY.GDP.PCAP.PP.KD` | PIB per cápita (PPA, USD internacionales constantes de 2021) | 2000–2025 | 199 | 5101 |
| `food_prod` | `AG.PRD.FOOD.XD` | Índice de producción de alimentos (2014–2016 = 100) | 2000–2024 | 195 | 4834 |
| `gini` | `SI.POV.GINI` | Índice de Gini | 2000–2025 | 168 | 1866 |
| `agri_land` | `AG.LND.AGRI.ZS` | Superficie agrícola (% del área terrestre) | 2000–2024 | 210 | 5210 |

### Advertencias sobre estas series

- **PoU:** estimación modelizada de la FAO, publicada como promedio trienal. No es un conteo de personas. Los valores inferiores al 2,5 % se informan como «< 2,5 %»; la serie los registra como 2,5 y la interfaz los muestra como «< 2,5 %» para no dar una precisión que la fuente no tiene.
- **FIES (MSFI/SFI):** encuesta autoinformada de ocho preguntas. Mide experiencias de acceso a alimentos, no ingesta calórica. Sus valores son mucho más altos que la PoU y no son equivalentes.
- **Personas subalimentadas:** serie oficial `SN.ITK.DEFC`. Puede terminar en un año distinto al de la prevalencia (2023 frente a 2024). La aplicación indica el año de cada cifra.
- **Pobreza y Gini:** cobertura desigual y encuestas separadas por años. No se usan para calcular hambre ni para imputar valores.
- **Población:** se usa como contexto. Nunca se multiplica por una prevalencia para fabricar una cifra de personas.

## 3. GRFC 2026 — Global Report on Food Crises

- **Productor:** Red Global contra las Crisis Alimentarias (GNAFC) / FSIN, con datos de IPC, Cadre Harmonisé y GIEWS.
- **Portal:** <https://www.fsinplatform.org/global-report-food-crises>
- **Base descargada:** HDX, *Global Report on Food Crises 2026 Mid-Year Update*, dataset `018f4de3-0a27-43e1-b294-582027411c95`.
- **Archivo crudo:** `raw/grfc.xlsx`.
- **Archivo normalizado:** `public/data/grfc.json`.
- **Cobertura:** 72 países y territorios con evaluación de inseguridad alimentaria aguda.

Campos normalizados por país:

- `history[]`: año, edición, población en Fase 3+, porcentaje sobre población analizada, Fase 4, Fase 5, población analizada, población total, periodo, fuente, metodología y área analizada.
- `latest`: último registro del historial, con las mismas cifras.
- `drivers`: conductores identificados (conflicto, clima extremo, crisis económica, plagas) y su año.
- `displacement`: personas desplazadas cuando la fuente lo publica.
- `nutrition`: clasificación nutricional y periodo.

> El porcentaje de Fase 3+ se calcula sobre la **población analizada**, no sobre la población total del país. No es comparable con la PoU ni con la FIES. Los periodos duran pocos meses y la cobertura varía.

## 4. IPC — Integrated Food Security Phase Classification

- **Portal:** <https://www.ipcinfo.org>
- **Uso:** marco de referencia de las Fases 1 a 5 y de la clasificación de hambruna. El GRFC armoniza las evaluaciones IPC/CH disponibles.
- **Aclaración:** la aplicación no reclasifica países por su cuenta. Solo muestra la población en Fase 3+ que publica el GRFC/IPC.

## 5. PMA / WFP — páginas de país

- **Portal:** <https://www.wfp.org/countries>
- **Uso:** perfiles de país, respuesta operativa, personas alcanzadas, necesidades proyectadas y limitaciones de acceso.
- **Aplicación:** sostiene los bloques de respuesta de la ONU y la sustitución explícita de Palestina.

> Las páginas del PMA son fuentes operativas, no evaluaciones de impacto independientes. Una cifra de personas alcanzadas describe cobertura, no reducción demostrada de la prevalencia de hambre. La aplicación separa necesidad, ejecución y resultado.

### Sustitución explícita de Palestina (PSE)

El GRFC no contiene una evaluación reciente de Palestina; su último registro es de 2022. Para no presentar ese dato como actual, el perfil `PSE` incluye un `acuteOverride` con el dato del PMA de 2026: **1,4 millones de personas en Gaza, alrededor del 60,9 % de la población de Gaza**. Se muestra en un bloque separado, con periodo, fuente, URL y una advertencia de que no es una serie comparable con el GRFC.

La validación exige que todo `acuteOverride` vaya acompañado de un `caveat`.

## 6. UNICEF, OMS y Banco Mundial — Joint Child Malnutrition Estimates

- **Portal:** <https://data.unicef.org/topic/nutrition/malnutrition/>
- **Uso:** retraso del crecimiento y emaciación en menores de cinco años, distribuidos por el WDI.
- **Limitación:** los años de encuesta varían entre países. No se interpolan.

## 7. Natural Earth

- **Portal:** <https://www.naturalearthdata.com>
- **Archivo crudo:** `raw/ne_countries.geojson` (escala 1:110m).
- **Uso:** geometrías del mapa, nombres en español y agrupación por continente.
- **Advertencia:** los límites son cartográficos y no implican una posición política.

## 8. Biblioteca de medidas y perfiles de país

No son fuentes de datos estadísticos, sino **curaduría editorial** basada en las fuentes anteriores:

- `data/measures.json`: 10 medidas de respuesta. Cada una declara objetivo, beneficiarios, organismos, resultados documentados con URL y año, limitaciones, dimensión que aborda, horizonte, evidencia, coste y cobertura.
- `data/country-profiles.json`: 12 perfiles verificados (AFG, BGD, COD, GTM, HTI, MWI, NGA, PSE, SDN, SOM, SSD, YEM). Cada causa se etiqueta como `documented`, `contributing` o `hypothesis` y cita fuente y año.

Los demás países no reciben un perfil genérico: muestran sus datos y, si existen, los conductores del GRFC, junto con un aviso de que no hay un perfil verificado.

## Cómo citar

Si reutilizas una cifra, cita la fuente original y la edición, no este repositorio:

> FAO, FIDA, UNICEF, PMA y OMS. *The State of Food Security and Nutrition in the World 2026*. Roma, 2026. <https://doi.org/10.4060/cd8306en>

> Banco Mundial. *World Development Indicators*. Consulta: noviembre de 2026. <https://data.worldbank.org>

> FSIN/GNAFC. *Global Report on Food Crises 2026 — Mid-Year Update*. 2026.
