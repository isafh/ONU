"use client";

import { AlertTriangle, Info, TrendingDown, TrendingUp } from "lucide-react";
import type { ScaleView } from "@/lib/country";
import { fmtNumber, fmtPct, fmtSignedPct } from "@/lib/format";
import { DataNote } from "./ui";

const COLORS = [
  "#f1e8d3",
  "#ecd9ae",
  "#e7c98a",
  "#dfb264",
  "#d99a2b",
  "#c9802d",
  "#bb642c",
  "#a8492c",
  "#8f3524",
  "#7f2b19",
];

const LEVEL_LABELS = [
  "el 10 % con menor prevalencia",
  "el siguiente 10 %",
  "el 20-30 % más bajo",
  "el 30-40 %",
  "el 40-50 % (mitad inferior)",
  "el 50-60 % (mitad superior)",
  "el 60-70 %",
  "el 70-80 %",
  "el 80-90 %",
  "el 10 % con mayor prevalencia",
];

export default function SeverityScale({
  scale,
  countryIso,
  countryName,
  value,
  year,
  indicatorLabel,
}: {
  scale: ScaleView;
  countryIso: string;
  countryName: string;
  value: number;
  year: number;
  indicatorLabel: string;
}) {
  const dec = scale.decile;
  const diffWorld = scale.world ? value - scale.world.value : null;

  if (!dec) {
    return (
      <div className="rounded-2xl border border-dashed border-ink/20 bg-paper-2/40 p-6">
        <div className="flex gap-2.5">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-terracotta" />
          <div>
            <p className="font-serif text-xl">Clasificación comparable no disponible</p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              En {year} solo hay {scale.nCountries} países con dato de {indicatorLabel.toLowerCase()} en la
              base. La escala 1-10 se calcula con deciles de la distribución mundial y requiere al menos 30
              países para no producir una clasificación engañosa. No asignamos un nivel con esa muestra.
            </p>
            <p className="mt-3 text-[11px] leading-relaxed text-muted">
              El dato del país sigue siendo válido: {fmtPct(value)}. Lo que no es posible es situarlo en una
              escala relativa con garantías.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const ranges = Array.from({ length: 10 }, (_, i) => {
    const lo = i === 0 ? 0 : dec.thresholds[i - 1];
    const hi = i === 9 ? null : dec.thresholds[i];
    return { level: i + 1, lo, hi };
  });
  const current = ranges[dec.level - 1];

  const peers = [...scale.regionPeers];
  if (!peers.some((p) => p.iso3 === countryIso)) {
    peers.push({ iso3: countryIso, nameEs: countryName, value });
    peers.sort((a, b) => b.value - a.value);
  }
  const peerMax = Math.max(...peers.map((p) => p.value), 1);

  return (
    <div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="card p-5 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                Nivel de gravedad relativo
              </p>
              <p className="display mt-1 text-6xl text-terracotta">
                {dec.level}
                <span className="text-2xl text-muted"> / 10</span>
              </p>
              <p className="mt-1 text-sm text-ink-2">
                {countryName} está en {LEVEL_LABELS[dec.level - 1]} de los países con dato en {year}.
              </p>
            </div>
            <div className="rounded-xl border border-ink/10 bg-paper-2/50 px-4 py-3 text-right">
              <p className="text-[10px] uppercase tracking-wider text-muted">Percentil</p>
              <p className="tabular text-2xl font-semibold">{fmtNumber(dec.percentile, 0)}</p>
              <p className="text-[10px] text-muted">de {dec.n} países</p>
            </div>
          </div>

          <div className="mt-7 flex gap-1" role="img" aria-label={`Nivel ${dec.level} de 10 según deciles de ${dec.n} países`}>
            {COLORS.map((c, i) => {
              const active = i + 1 === dec.level;
              return (
                <div key={i} className="flex-1">
                  <div
                    className={`h-12 rounded-md transition-all ${active ? "ring-2 ring-ink ring-offset-2 ring-offset-[#fffdf8]" : "opacity-70"}`}
                    style={{ background: c }}
                    title={`Nivel ${i + 1}: ${LEVEL_LABELS[i]}`}
                  />
                  <p className={`mt-1.5 text-center text-[10px] tabular ${active ? "font-bold text-ink" : "text-muted"}`}>
                    {i + 1}
                  </p>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-center text-[10px] text-muted">
            Nivel 1 = menor prevalencia relativa · Nivel 10 = mayor prevalencia relativa
          </p>

          <div className="mt-5 rounded-lg bg-ink/[0.04] p-3.5">
            <p className="text-[11px] leading-relaxed text-ink-2">
              El nivel <strong>{dec.level}</strong> agrupa a los países cuya prevalencia está en el intervalo{" "}
              <strong className="tabular">
                {fmtNumber(current.lo, 1)} %{current.hi == null ? " o más" : ` – ${fmtNumber(current.hi, 1)} %`}
              </strong>{" "}
              de la distribución de {year}. Es un criterio relativo y reproducible: no es una clasificación
              clínica ni un umbral absoluto de hambre.
            </p>
          </div>

          <details className="mt-4 text-[11px] text-muted">
            <summary className="cursor-pointer select-none font-medium text-ink-2 hover:text-terracotta">
              Ver los cortes de los 10 niveles
            </summary>
            <div className="mt-3 grid gap-1 sm:grid-cols-2">
              {ranges.map((r) => (
                <div
                  key={r.level}
                  className={`flex items-center justify-between rounded px-2 py-1 ${
                    r.level === dec.level ? "bg-terracotta/10 font-semibold text-rust" : ""
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-[2px]" style={{ background: COLORS[r.level - 1] }} />
                    Nivel {r.level}
                  </span>
                  <span className="tabular">
                    {fmtNumber(r.lo, 1)} %{r.hi == null ? " +" : ` – ${fmtNumber(r.hi, 1)} %`}
                  </span>
                </div>
              ))}
            </div>
          </details>

          <DataNote>
            Cálculo: deciles de la distribución de los {dec.n} países con dato de {indicatorLabel.toLowerCase()}{" "}
            en {year}. El percentil usa el rango medio para tratar los empates. Fuente de los datos: FAO/Banco
            Mundial; elaboración propia del cálculo relativo.
          </DataNote>
        </div>

        <div className="space-y-5">
          <div className="card p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Comparación mundial</p>
            {scale.world && diffWorld != null ? (
              <>
                <p className="display mt-1 text-3xl">{fmtPct(scale.world.value)}</p>
                <p className="text-[11px] text-muted">
                  promedio mundial publicado · {scale.world.year}
                  {!scale.world.exact && " (año más cercano disponible)"}
                </p>
                <p className="mt-3 flex items-start gap-1.5 text-[12px] leading-relaxed">
                  {diffWorld > 0 ? (
                    <TrendingUp size={14} className="mt-0.5 shrink-0 text-terracotta" />
                  ) : (
                    <TrendingDown size={14} className="mt-0.5 shrink-0 text-olive" />
                  )}
                  <span>
                    {countryName} está <strong className="tabular">{fmtSignedPct(diffWorld)}</strong>{" "}
                    {diffWorld > 0 ? "por encima" : diffWorld < 0 ? "por debajo" : "igual"} del promedio
                    mundial.
                  </span>
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm">Datos no disponibles para el promedio mundial.</p>
            )}
            <DataNote>
              El promedio mundial procede del agregado publicado por FAO/Banco Mundial, no de la media de los
              países. Es una comparación descriptiva.
            </DataNote>
          </div>

          <div className="card p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              Comparación regional · {scale.regionName}
            </p>
            {scale.regionMedian != null ? (
              <>
                <p className="display mt-1 text-3xl">{fmtPct(scale.regionMedian)}</p>
                <p className="text-[11px] text-muted">
                  mediana de {scale.regionTotal} países con dato · {year}
                </p>
                {scale.regionRank && (
                  <p className="mt-3 text-[12px] leading-relaxed">
                    Puesto <strong className="tabular">{scale.regionRank}</strong> de {scale.regionTotal} en{" "}
                    {scale.regionName}, de mayor a menor prevalencia.
                  </p>
                )}
                <div className="mt-4 space-y-2 border-t border-ink/10 pt-3">
                  {peers.map((p) => (
                    <div key={p.iso3} className="flex items-center gap-2 text-[11px]">
                      <span className={`w-24 shrink-0 truncate ${p.iso3 === countryIso ? "font-semibold" : "text-muted"}`}>
                        {p.nameEs}
                      </span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/8">
                        <div
                          className={`h-full rounded-full ${p.iso3 === countryIso ? "bg-terracotta" : "bg-ink/25"}`}
                          style={{ width: `${(p.value / peerMax) * 100}%` }}
                        />
                      </div>
                      <span className="tabular w-12 text-right">{fmtNumber(p.value, 1)} %</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm">Datos no disponibles para la comparación regional.</p>
            )}
            <DataNote>
              La comparación regional usa el continente de Natural Earth y la mediana de los países con dato,
              no una media ponderada por población. No coincide necesariamente con las regiones de SOFI.
            </DataNote>
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2.5 rounded-xl border border-ink/10 bg-paper-2/40 p-4 text-[11px] leading-relaxed text-muted">
        <Info size={15} className="mt-0.5 shrink-0 text-terracotta" />
        <p>
          La escala 1-10 es una herramienta de lectura, no un diagnóstico. Un país con nivel 4 puede tener más
          personas afectadas que uno con nivel 8 si su población es mucho mayor. Por eso el nivel se muestra
          junto al porcentaje, el número de personas y el contexto.
        </p>
      </div>
    </div>
  );
}
