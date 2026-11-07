import type { Metadata } from "next";
import { getCountries, getGrfc, getIndicators } from "@/lib/data-server";
import MobileMap from "@/components/mobile/MobileMap";

export const metadata: Metadata = {
  title: "Mapa móvil del hambre",
  description:
    "Mapa táctil del hambre por país: zoom con dos dedos, búsqueda y panel deslizante con el dato oficial, la tendencia y la inseguridad alimentaria aguda.",
};

export default function MovilMapaPage() {
  const countries = getCountries();
  const indicators = getIndicators();
  const grfc = getGrfc();

  const slim: Record<string, { latest: unknown; drivers: unknown; displacement?: unknown }> = {};
  for (const [iso3, c] of Object.entries(grfc.countries)) {
    slim[iso3] = { latest: c.latest, drivers: c.drivers, displacement: c.displacement };
  }

  return <MobileMap countries={countries} indicators={indicators} grfc={{ countries: slim as never }} />;
}
