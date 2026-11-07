"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { geoEqualEarth, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { colorFor } from "@/lib/map-scale";
import type { IndicatorId } from "@/lib/types";
import { fmtPct, fmtPou } from "@/lib/format";

const W = 960;
const H = 520;

interface CountryFeature {
  type: "Feature";
  properties: { iso3: string; name: string; nameEs: string; continent: string };
  geometry: GeoJSON.Geometry;
}

export interface WorldMapProps {
  topology: unknown;
  values: Record<string, number | null>;
  names: Record<string, string>;
  indicator: IndicatorId;
  selected: string | null;
  onSelect: (iso3: string) => void;
  accentLabel: string;
  /**
   * Modo «a ciegas»: todos los países comparten relleno neutro y ni el tooltip
   * ni la etiqueta accesible revelan el dato. Se usa en el desafío.
   */
  blind?: boolean;
}

export default function WorldMap({
  topology,
  values,
  names,
  indicator,
  selected,
  onSelect,
  accentLabel,
  blind = false,
}: WorldMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ k: 1, x: 0, y: 0 });
  const [hover, setHover] = useState<{ iso3: string; x: number; y: number } | null>(null);
  const drag = useRef<{ startX: number; startY: number; viewX: number; viewY: number } | null>(null);
  const movedRef = useRef(false);
  const [dragging, setDragging] = useState(false);
  // Punteros activos y estado del gesto de pellizco (dos dedos).
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; k: number; viewX: number; viewY: number } | null>(null);

  const { features, pathFor } = useMemo(() => {
    const topo = topology as {
      objects: { countries: unknown };
      type: string;
    };
    const collection = feature(topo as never, topo.objects.countries as never) as unknown as {
      features: CountryFeature[];
    };
    const projection = geoEqualEarth().fitExtent(
      [
        [6, 6],
        [W - 6, H - 6],
      ],
      collection as never,
    );
    const path = geoPath(projection);
    const map = new Map<string, string>();
    for (const f of collection.features) {
      map.set(f.properties.iso3, path(f as never) ?? "");
    }
    return {
      features: collection.features,
      pathFor: (iso3: string) => map.get(iso3) ?? "",
    };
  }, [topology]);

  const clampView = (k: number, x: number, y: number) => {
    const kk = Math.min(12, Math.max(1, k));
    return {
      k: kk,
      x: Math.min(0, Math.max(W - W * kk, x)),
      y: Math.min(0, Math.max(H - H * kk, y)),
    };
  };

  const zoomAt = (factor: number, cx = W / 2, cy = H / 2) => {
    setView((v) => {
      const k2 = Math.min(12, Math.max(1, v.k * factor));
      const x2 = cx - (cx - v.x) * (k2 / v.k);
      const y2 = cy - (cy - v.y) * (k2 / v.k);
      return clampView(k2, x2, y2);
    });
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * W;
      const py = ((e.clientY - rect.top) / rect.height) * H;
      setView((v) => {
        const k2 = Math.min(12, Math.max(1, v.k * Math.exp(-e.deltaY * 0.0015)));
        const x2 = px - (px - v.x) * (k2 / v.k);
        const y2 = py - (py - v.y) * (k2 / v.k);
        return clampView(k2, x2, y2);
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.button !== 0) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Dos dedos: empezar pellizco. Se cancelan el arrastre y la selección.
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        k: view.k,
        viewX: view.x,
        viewY: view.y,
      };
      movedRef.current = true;
      drag.current = null;
      setDragging(true);
      try {
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      } catch {
        /* puntero no capturable */
      }
      return;
    }
    if (pointers.current.size > 2) {
      movedRef.current = true;
      return;
    }

    movedRef.current = false;
    drag.current = {
      startX: e.clientX,
      startY: e.clientY,
      viewX: view.x,
      viewY: view.y,
    };
    setDragging(true);
    // La captura mantiene el arrastre aunque el puntero salga del mapa. Si el
    // navegador no la admite, el arrastre sigue funcionando dentro del SVG.
    try {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {
      /* puntero no capturable: no es un error para la navegación */
    }
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    if (pointers.current.has(e.pointerId)) {
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    const p = pinch.current;
    if (p && pointers.current.size >= 2) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const k2 = Math.min(12, Math.max(1, p.k * (dist / p.dist)));
      const px = (((a.x + b.x) / 2 - rect.left) / rect.width) * W;
      const py = (((a.y + b.y) / 2 - rect.top) / rect.height) * H;
      setView(
        clampView(
          k2,
          px - (px - p.viewX) * (k2 / p.k),
          py - (py - p.viewY) * (k2 / p.k),
        ),
      );
      return;
    }

    const d = drag.current;
    if (!d) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sx = W / rect.width;
    const sy = H / rect.height;
    const dx = (e.clientX - d.startX) * sx;
    const dy = (e.clientY - d.startY) * sy;
    // Umbral en píxeles de pantalla, no en unidades del SVG: un clic con algo
    // de temblor del ratón no debe convertirse en un arrastre.
    if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > 5) movedRef.current = true;
    setView((v) => clampView(v.k, d.viewX + dx, d.viewY + dy));
  };

  const onPointerUp = (e: ReactPointerEvent) => {
    const wasPinch = pinch.current !== null;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;

    const hadDrag = drag.current !== null;
    const wasMoved = movedRef.current;
    setDragging(false);
    drag.current = null;
    if (wasPinch || !hadDrag || wasMoved) return;

    // Los eventos de puntero pueden reajustarse al SVG cuando se captura el
    // puntero, de modo que el click no llegue al path del país. Se resuelve
    // el país con la posición real del puntero al soltar.
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const target = el?.closest?.("[data-iso3]") as Element | null;
    const iso3 = target?.getAttribute("data-iso3");
    if (iso3) onSelect(iso3);
  };

  const hovered = hover ? { iso3: hover.iso3, name: names[hover.iso3] ?? hover.iso3, value: values[hover.iso3] } : null;

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none overflow-hidden rounded-2xl border border-ink/10 bg-[#f2ecdf]"
      onPointerMove={(e) => {
        if (drag.current || pinch.current) onPointerMove(e);
      }}
      onPointerUp={onPointerUp}
      onPointerCancel={(e) => {
        pointers.current.delete(e.pointerId);
        if (pointers.current.size < 2) pinch.current = null;
        setDragging(false);
        drag.current = null;
      }}
      onPointerLeave={() => {
        setHover(null);
        setDragging(false);
        drag.current = null;
      }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        style={{ touchAction: "none", cursor: dragging ? "grabbing" : "grab" }}
        role="img"
        aria-label={
          blind
            ? "Mapa mundial sin datos visibles. Elige un país para hacer tu estimación."
            : `Mapa mundial de ${accentLabel}. Usa el buscador o la lista para seleccionar un país.`
        }
        onPointerDown={onPointerDown}
        onDoubleClick={(e) => {
          const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
          const px = ((e.clientX - rect.left) / rect.width) * W;
          const py = ((e.clientY - rect.top) / rect.height) * H;
          zoomAt(1.7, px, py);
        }}
      >
        <g transform={`translate(${view.x},${view.y}) scale(${view.k})`}>
          {features.map((f) => {
            const iso3 = f.properties.iso3;
            const value = values[iso3] ?? null;
            const isSelected = selected === iso3;
            return (
              <path
                key={iso3}
                d={pathFor(iso3)}
                data-iso3={iso3}
                fill={blind ? (isSelected ? "#cdbfa4" : "#e6ddcb") : colorFor(value, indicator)}
                stroke={isSelected ? "#17130e" : blind ? "#b9ab92" : "#f7f3ea"}
                strokeWidth={isSelected ? 1.8 / view.k : blind ? 0.7 / view.k : 0.6 / view.k}
                className={`map-country${blind ? " is-blind" : ""}`}
                aria-label={
                  blind
                    ? `${f.properties.nameEs}: dato oculto hasta confirmar tu estimación`
                    : `${f.properties.nameEs}: ${value == null ? "datos no disponibles" : indicator === "pou" ? fmtPou(value) : fmtPct(value)}`
                }
                onMouseEnter={(e) => {
                  const rect = containerRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  setHover({ iso3, x: e.clientX - rect.left, y: e.clientY - rect.top });
                }}
                onMouseMove={(e) => {
                  const rect = containerRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  setHover({ iso3, x: e.clientX - rect.left, y: e.clientY - rect.top });
                }}
                onMouseLeave={() => setHover(null)}
                onClick={() => {
                  if (movedRef.current) return;
                  onSelect(iso3);
                }}
              />
            );
          })}
        </g>
      </svg>

      {/* Tooltip */}
      {hovered && (
        <div
          className="pointer-events-none absolute z-20 max-w-[220px] -translate-x-1/2 -translate-y-[calc(100%+14px)] rounded-lg bg-ink px-3 py-2 text-paper shadow-xl"
          style={{
            left: Math.min(Math.max(hover!.x, 80), (containerRef.current?.clientWidth ?? 300) - 80),
            top: hover!.y,
          }}
        >
          <p className="text-[13px] font-semibold leading-tight">{hovered.name}</p>
          {blind ? (
            <>
              <p className="mt-0.5 text-[11px] leading-snug text-amber-soft">Dato oculto en este modo</p>
              <p className="mt-0.5 text-[10px] text-paper/50">Se revela al confirmar tu estimación</p>
            </>
          ) : (
            <>
              <p className="tabular mt-0.5 text-[12px] text-amber-soft">
                {hovered.value == null ? "Datos no disponibles" : indicator === "pou" ? fmtPou(hovered.value) : fmtPct(hovered.value)}
              </p>
              <p className="mt-0.5 text-[10px] text-paper/50">{accentLabel}</p>
            </>
          )}
        </div>
      )}

      {/* Controles */}
      <div className="absolute right-3 top-3 flex flex-col overflow-hidden rounded-lg border border-ink/15 bg-paper/95 shadow-sm">
        <button type="button" onClick={() => zoomAt(1.5)} className="p-2.5 hover:bg-ink/5" aria-label="Acercar">
          <Plus size={16} />
        </button>
        <button type="button" onClick={() => zoomAt(1 / 1.5)} className="border-t border-ink/10 p-2.5 hover:bg-ink/5" aria-label="Alejar">
          <Minus size={16} />
        </button>
        <button
          type="button"
          onClick={() => setView({ k: 1, x: 0, y: 0 })}
          className="border-t border-ink/10 p-2.5 hover:bg-ink/5"
          aria-label="Restablecer vista"
        >
          <RotateCcw size={15} />
        </button>
      </div>

      <div className="pointer-events-none absolute bottom-2.5 left-3 rounded-full bg-paper/85 px-2.5 py-1 text-[9px] text-muted sm:text-[10px]">
        <span className="sm:hidden">Pellizca para acercar · Toca un país</span>
        <span className="hidden sm:inline">Arrastra para mover · Rueda o doble clic para acercar</span>
      </div>
    </div>
  );
}
