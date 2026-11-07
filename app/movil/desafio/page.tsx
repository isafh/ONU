import type { Metadata } from "next";
import { getCountries, getIndicators, getWorld } from "@/lib/data-server";
import MobileChallenge from "@/components/mobile/MobileChallenge";

export const metadata: Metadata = {
  title: "Desafío móvil",
  description:
    "Predice la prevalencia de hambre de un país en tres pasos: elige en el mapa en blanco, estima y compara con el dato oficial.",
};

export default function MovilDesafioPage() {
  return (
    <MobileChallenge countries={getCountries()} indicators={getIndicators()} world={getWorld()} />
  );
}
