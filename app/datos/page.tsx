import type { Metadata } from "next";
import { getCountries, getIndicators } from "@/lib/data-server";
import DataExplorer from "@/components/data/DataExplorer";

export const metadata: Metadata = {
  title: "Estadísticas globales del hambre",
  description:
    "Rankings por país, comparación regional, series temporales y descarga CSV de los indicadores de hambre e inseguridad alimentaria de FAO, UNICEF y el Banco Mundial.",
};

export default function DatosPage() {
  return (
    <main>
      <DataExplorer countries={getCountries()} indicators={getIndicators()} />
    </main>
  );
}
