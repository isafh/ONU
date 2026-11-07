import type { Metadata } from "next";
import { getCountries, getIndicators, getWorld } from "@/lib/data-server";
import ChallengeExplorer from "@/components/challenge/ChallengeExplorer";

export const metadata: Metadata = {
  title: "Desafío de estimación",
  description:
    "Predice la prevalencia de hambre de un país sobre un mapa en blanco, sin ver los colores ni la respuesta. Después compara tu estimación con el dato oficial que aparece en el mapa principal.",
};

export default function DesafioPage() {
  const countries = getCountries();
  const indicators = getIndicators();
  const world = getWorld();

  return (
    <main>
      <ChallengeExplorer countries={countries} indicators={indicators} world={world} />
    </main>
  );
}
