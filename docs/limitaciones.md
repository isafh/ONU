# Limitaciones metodológicas

Hunger Map prioriza la trazabilidad sobre la apariencia de certeza. Esta página enumera lo que la aplicación **no** puede afirmar, incluso cuando muestra una cifra correcta.

## 1. Tres medidas, tres significados

| Medida | Qué mide | Qué no mide |
| --- | --- | --- |
| Subalimentación (PoU, ODS 2.1.1) | Proporción de la población cuya ingesta habitual de energía es insuficiente para una vida normal, activa y saludable. Estimación modelizada de la FAO. | No mide hambre sentida, calidad de la dieta ni crisis aguda. No identifica a las mismas personas que la FIES. |
| Inseguridad alimentaria moderada o grave (FIES, ODS 2.1.2) | Hogares donde un adulto declaró reducir la calidad o cantidad de alimentos por falta de recursos. | No mide ingesta calórica ni estado nutricional. Sus valores son mucho más altos que la PoU. |
| Inseguridad alimentaria aguda (IPC/CH, Fase 3+) | Población en crisis, emergencia o hambruna en un periodo y área analizados. | No es una prevalencia anual ni comparable con PoU o FIES. Su denominador es la población analizada. |

**Nunca se suman, restan ni intercambian.** Que un país mejore en una medida y empeore en otra es posible y no es una contradicción.

## 2. La PoU es una estimación modelizada

- No es un conteo de personas.
- Depende de balances de suministro y demanda de alimentos, encuestas de consumo y supuestos sobre la distribución del consumo.
- Se publica como promedio trienal para reducir el ruido estadístico.
- La incertidumbre es mayor donde hay pocas encuestas o balances incompletos.
- Los valores inferiores al 2,5 % se informan como «< 2,5 %»; la serie los registra como 2,5 y la interfaz los presenta como «< 2,5 %».

La aplicación muestra el valor puntual publicado. **No muestra intervalos de confianza** porque la serie descargada del WDI no los incluye a nivel país-año. Eso no significa que la cifra sea exacta.

## 3. La FIES es autoinformada

- Mide experiencias declaradas de acceso a alimentos, no ingesta ni antropometría.
- Está influida por el contexto cultural, la formulación y la aplicación de la encuesta.
- La cobertura cambia: no todos los países tienen encuesta cada año.
- No se interpola entre encuestas.

## 4. El IPC no es una prevalencia anual

- Clasifica una situación aguda en un periodo concreto (a menudo de pocos meses) y en un área analizada concreta.
- El porcentaje se calcula sobre la población analizada, que puede ser una región, una parte del país o un grupo de población.
- Dos países con el mismo porcentaje pueden tener denominadores y momentos del año distintos.
- La Fase 5 (hambruna) es una clasificación específica; no se deduce de otros indicadores.

## 5. Los promedios nacionales ocultan desigualdades

Un país puede reducir su prevalencia media y mantener bolsas de hambre severa en zonas rurales, barrios informales, campos de desplazados o comunidades remotas. La base no tiene datos subnacionales sistemáticos para todos los países, así que la aplicación no puede decir **quién** padece hambre dentro de un país.

## 6. La cobertura es desigual y los datos pueden ser antiguos

- La serie país-año de PoU termina en **2024**; la de personas subalimentadas, en **2023**.
- La FIES empieza en **2015** en la base.
- Pobreza y Gini dependen de encuestas separadas por años; algunos países tienen observaciones de hace más de una década.
- Varios países pequeños o de ingreso alto no tienen PoU ni FIES.
- La aplicación **no rellena** esos huecos con modelos propios. Muestra «Datos no disponibles» y, cuando corresponde, un aviso de antigüedad.

Consecuencia: un dato de 2021 en un país en crisis puede describir una realidad que ya cambió. El año se muestra siempre junto a la cifra.

## 7. Las ediciones no se mezclan

- **SOFI 2026** publica 7,8 % de hambre para 2025 y 25,8 % de inseguridad alimentaria moderada o grave.
- La serie país-año del WDI termina en 2024 con 8,1 % de PoU y 28,0 % de MSFI.
- Son la misma familia de indicadores, pero de **ediciones y años distintos**. No se presentan como una contradicción ni se dibujan en una única línea temporal sin advertirlo.

## 8. Las cifras de personas son series oficiales, no cálculos

- La aplicación usa `SN.ITK.DEFC` (personas subalimentadas) cuando existe.
- **Nunca** multiplica la prevalencia por la población para fabricar una cifra de personas.
- Si no hay serie oficial, muestra «Datos no disponibles».
- La serie de personas puede terminar en un año distinto al de la prevalencia; cada cifra indica su año.

## 9. La escala 1–10 es relativa

- Es el decil de la distribución mundial de países **con dato** para el mismo indicador y año.
- Requiere al menos 30 países; con menos, no se asigna nivel.
- Nivel 1 no significa «sin hambre»; significa el 10 % con menor prevalencia relativa.
- Si cambia la cobertura de países, pueden cambiar los cortes y el nivel de un país.
- No es una clasificación clínica, absoluta ni comparable entre indicadores distintos.

## 10. El mapa no es un ranking absoluto

- Los colores usan cortes fijos y documentados en la leyenda.
- El gris significa «sin dato para ese año», **no** «sin hambre».
- Un país grande con prevalencia moderada puede tener más personas afectadas que un país pequeño con prevalencia alta. Por eso el mapa y la página de datos ofrecen ambas lecturas.

## 11. Las regiones de la aplicación no son las regiones de SOFI

- La comparación regional usa el continente de Natural Earth y la **mediana** de los países con dato.
- No es una media ponderada por población ni un agregado oficial.
- SOFI agrupa países de otra manera y publica sus propios agregados. No son intercambiables.

## 12. Solo 12 países tienen perfil verificado

AFG, BGD, COD, GTM, HTI, MWI, NGA, PSE, SDN, SOM, SSD y YEM tienen causas y respuesta de la ONU curadas con fuentes. El resto:

- conserva sus datos y, cuando existen, los conductores del GRFC;
- recibe un aviso explícito de que no hay un perfil verificado;
- **no** recibe causas genéricas ni una respuesta de la ONU inventada.

Es una limitación de cobertura editorial, no un juicio sobre la importancia de esos países.

## 13. Las causas no son una relación causal demostrada

- Que el GRFC identifique el conflicto como conductor principal no implica que sea la única causa ni que eliminarlo resuelva el hambre.
- Las etiquetas `documented`, `contributing` e `hypothesis` describen lo que la fuente permite afirmar.
- La evaluación de medidas calcula **cobertura de dimensiones**, no impacto. No es una nota ni una predicción.
- Los trade-offs y vacíos son ayudas para razonar, no resultados de un modelo causal.

## 14. Las fuentes operativas no son evaluaciones de impacto

Las páginas del PMA describen necesidades, planes, personas alcanzadas y limitaciones de acceso. Que una intervención alcance a un millón de personas **no demuestra** que reduzca la prevalencia de hambre. La aplicación distingue:

- **necesidad** (cuántas personas requieren asistencia),
- **ejecución** (qué se está haciendo),
- **resultado** (qué efecto cuantificado se verificó).

Solo el tercer caso se etiqueta como `resultados`.

## 15. Las proyecciones no son observaciones

Las cifras a 2030, las alertas de hambruna y las proyecciones de necesidad son escenarios condicionados a supuestos. Se presentan como tales y no como resultados actuales.

## 16. Los límites del mapa no son una posición política

Las geometrías provienen de Natural Earth (escala 1:110m). Son cartográficas y no implican una posición sobre disputas territoriales ni fronteras definitivas.

## 17. La base puede contener errores de normalización

Los scripts validan estructura, rangos, orden temporal, coherencia de cobertura y limpieza de textos. No pueden detectar un error que esté en la fuente original ni una interpretación editorial discutible. Si encuentras una discrepancia:

1. comprueba la fuente primaria y su edición;
2. revisa el archivo crudo en `data/raw/`;
3. abre una incidencia con la URL, la cifra y el año.

## 18. Qué preguntas puede responder esta aplicación

- ¿Cuántas personas padecen subalimentación según la última serie oficial?
- ¿Cómo se compara un país con el resto del mundo en un indicador y año concretos?
- ¿Qué conductores de crisis alimentaria aguda documenta el GRFC?
- ¿Qué medidas existen, qué evidencia las respalda y qué limitaciones tienen?
- ¿Qué está documentado sobre la respuesta de la ONU en 12 países?

## 19. Qué preguntas no puede responder

- ¿Cuántas personas pasan hambre **hoy** en un país sin datos recientes?
- ¿Quién pasa hambre dentro de un país?
- ¿Qué medida reducirá más el hambre?
- ¿Cuál es la causa única del hambre en un país?
- ¿Cuánto hambre habría si se aplicara una política concreta?

Para esas preguntas hacen falta datos subnacionales, evaluaciones de impacto y modelos causales que esta aplicación no tiene. La honestidad sobre ese límite es parte del producto.
