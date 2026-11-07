const nf0 = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nfMax1 = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });
const nf2 = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 });

export function fmtNumber(value: number | null | undefined, decimals = 0): string {
  if (value == null || !Number.isFinite(value)) return "—";
  if (decimals === 0) return nf0.format(value);
  if (decimals === 1) return nf1.format(value);
  return nf2.format(value);
}

export function fmtPct(value: number | null | undefined, decimals = 1): string {
  if (value == null || !Number.isFinite(value)) return "Datos no disponibles";
  return `${fmtNumber(value, decimals)} %`;
}

/**
 * La FAO publica "menos del 2,5 %" como el valor 2,5 en la serie del Banco
 * Mundial. Mostrar "2,5 %" a secas daría una precisión que la fuente no tiene.
 */
export function fmtPou(value: number | null | undefined, decimals = 1): string {
  if (value === 2.5) return "< 2,5 %";
  return fmtPct(value, decimals);
}

export function fmtSignedPct(value: number, decimals = 1): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "±";
  return `${sign}${fmtNumber(Math.abs(value), decimals)} pp`;
}

/** Formato legible en español para cifras grandes de personas. */
export function fmtPeople(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "Datos no disponibles";
  if (value >= 1_000_000_000) return `${nf1.format(value / 1_000_000_000)} mil millones`;
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    // Menos de diez millones conserva un decimal (1,4 millones); a partir de
    // ahí el decimal no aporta y alarga la cifra sin necesidad.
    return `${millions < 10 ? nfMax1.format(millions) : nf0.format(millions)} millones`;
  }
  if (value >= 1_000) return `${nf0.format(value / 1_000)} mil`;
  return nf0.format(value);
}

export function fmtPeopleLong(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "Datos no disponibles";
  return `${nf0.format(value)} personas`;
}

export function fmtCompact(value: number | null | undefined, decimals = 1): string {
  if (value == null || !Number.isFinite(value)) return "—";
  if (Math.abs(value) >= 1_000_000_000) return `${nf1.format(value / 1_000_000_000)} MM`;
  if (Math.abs(value) >= 1_000_000) return `${nf1.format(value / 1_000_000)} M`;
  if (Math.abs(value) >= 1_000) return `${nf0.format(value / 1_000)} mil`;
  return nf0.format(value);
}

export function fmtYear(year: number | null | undefined): string {
  return year == null ? "—" : String(year);
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}
