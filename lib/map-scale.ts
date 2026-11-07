import type { IndicatorId } from "./types";

export interface Bin {
  min: number;
  max: number;
  color: string;
  label: string;
}

export const MAP_BINS: Partial<Record<IndicatorId, Bin[]>> = {
  pou: [
    { min: 0, max: 2.5, color: "#efe4c9", label: "Menos de 2,5 %" },
    { min: 2.5, max: 5, color: "#e7c98a", label: "2,5 – 5 %" },
    { min: 5, max: 10, color: "#d99a2b", label: "5 – 10 %" },
    { min: 10, max: 20, color: "#c2722f", label: "10 – 20 %" },
    { min: 20, max: 30, color: "#a8492c", label: "20 – 30 %" },
    { min: 30, max: Infinity, color: "#7f2b19", label: "30 % o más" },
  ],
  msfi: [
    { min: 0, max: 5, color: "#efe4c9", label: "Menos de 5 %" },
    { min: 5, max: 10, color: "#e7c98a", label: "5 – 10 %" },
    { min: 10, max: 20, color: "#d99a2b", label: "10 – 20 %" },
    { min: 20, max: 35, color: "#c2722f", label: "20 – 35 %" },
    { min: 35, max: 50, color: "#a8492c", label: "35 – 50 %" },
    { min: 50, max: Infinity, color: "#7f2b19", label: "50 % o más" },
  ],
};

export const NO_DATA_COLOR = "#d8d2c4";

export function binFor(value: number | null | undefined, indicator: IndicatorId): Bin | null {
  if (value == null) return null;
  const bins = MAP_BINS[indicator];
  if (!bins) return null;
  return bins.find((b) => value >= b.min && value < b.max) ?? bins[bins.length - 1];
}

export function colorFor(value: number | null | undefined, indicator: IndicatorId): string {
  return binFor(value, indicator)?.color ?? NO_DATA_COLOR;
}

export const MAP_INDICATORS = [
  {
    id: "pou" as IndicatorId,
    label: "Subalimentación",
    full: "Prevalencia de subalimentación (PoU)",
    sdg: "ODS 2.1.1",
    description:
      "Porcentaje de la población cuya ingesta habitual de energía es insuficiente. Es la medida que usa SOFI para hablar de «hambre».",
  },
  {
    id: "msfi" as IndicatorId,
    label: "Inseguridad alimentaria",
    full: "Inseguridad alimentaria moderada o grave (FIES)",
    sdg: "ODS 2.1.2",
    description:
      "Porcentaje de la población que redujo la calidad o la cantidad de alimentos por falta de recursos. Mide acceso, no ingesta calórica. No es equivalente a la subalimentación.",
  },
];
