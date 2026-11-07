import type { Metadata } from "next";
import { getCountries, getIndicators, getWorld } from "@/lib/data-server";
import MobileData from "@/components/mobile/MobileData";

export const metadata: Metadata = {
  title: "Datos móviles",
  description:
    "Rankings por país y promedio mundial de subalimentación e inseguridad alimentaria, en una vista compacta para teléfonos.",
};

export default function MovilDatosPage() {
  return <MobileData countries={getCountries()} indicators={getIndicators()} world={getWorld()} />;
}
