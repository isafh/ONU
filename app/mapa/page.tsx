import type { Metadata } from "next";
import { getCountries, getGrfc, getIndicators } from "@/lib/data-server";
import MapExplorer from "@/components/map/MapExplorer";

export const metadata: Metadata = {
  title: "Mapa interactivo del hambre",
  description:
    "Explora país por país la prevalencia de subalimentación y de inseguridad alimentaria con datos oficiales de FAO y del Banco Mundial, y la inseguridad alimentaria aguda del IPC/GRFC.",
};

export default function MapaPage() {
  const countries = getCountries();
  const indicators = getIndicators();
  const grfc = getGrfc();

  // Solo los campos que necesita el panel del mapa, para no enviar todo el histórico.
  const slim: Record<string, { latest: unknown; drivers: unknown; displacement?: unknown }> = {};
  for (const [iso3, c] of Object.entries(grfc.countries)) {
    slim[iso3] = { latest: c.latest, drivers: c.drivers, displacement: c.displacement };
  }

  return (
    <main>
      <MapExplorer
        countries={countries}
        indicators={indicators}
        grfc={{ countries: slim as never }}
      />
    </main>
  );
}
