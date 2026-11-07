interface Props {
  total: number;
  africa: number;
  asia: number;
  rest: number;
}

/**
 * Cada punto = 1 millón de personas. Visualización estática (sin JS) de la
 * composición regional del hambre según SOFI 2026.
 */
export default function DotField({ total, africa, asia, rest }: Props) {
  const dots: { color: string; label: string }[] = [];
  for (let i = 0; i < africa; i++) dots.push({ color: "#b4472e", label: "África" });
  for (let i = 0; i < asia; i++) dots.push({ color: "#d99a2b", label: "Asia" });
  for (let i = 0; i < rest; i++) dots.push({ color: "#8b8272", label: "Resto del mundo" });

  const cols = 30;
  const size = 9;
  const gap = 4;
  const step = size + gap;
  const rows = Math.ceil(total / cols);
  const width = cols * step;
  const height = rows * step;

  return (
    <figure className="w-full">
      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-[#fffdf8] p-4 shadow-[var(--shadow-soft)] sm:p-5">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full"
          role="img"
          aria-label={`${total} millones de personas con hambre en 2025: ${africa} millones en África, ${asia} millones en Asia y ${rest} millones en el resto del mundo.`}
        >
          {dots.map((d, i) => (
            <rect
              key={i}
              x={(i % cols) * step}
              y={Math.floor(i / cols) * step}
              width={size}
              height={size}
              rx={2}
              fill={d.color}
              opacity={0.92}
            >
              <title>{`${d.label} · 1 millón de personas`}</title>
            </rect>
          ))}
        </svg>
      </div>
      <figcaption className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-[2px] bg-terracotta" /> África · {africa} M</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-[2px] bg-amber" /> Asia · {asia} M</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-[2px] bg-[#8b8272]" /> Resto · {rest} M</span>
        <span className="ml-auto">Cada punto = 1 millón de personas</span>
      </figcaption>
    </figure>
  );
}
