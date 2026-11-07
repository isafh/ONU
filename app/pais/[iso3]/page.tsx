import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getCountries,
  getCountry,
  getGrfc,
  getIndicators,
  getMeasures,
  getProfiles,
  getSeries,
  getWorld,
} from "@/lib/data-server";
import { buildAcute, buildContext, buildScale, pickChallenge, type CountryView } from "@/lib/country";
import CountryExperience from "@/components/country/CountryExperience";
import { fmtNumber } from "@/lib/format";

export const dynamicParams = false;

export function generateStaticParams() {
  return getCountries().map((c) => ({ iso3: c.iso3 }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ iso3: string }>;
}): Promise<Metadata> {
  const { iso3 } = await params;
  const country = getCountry(iso3);
  if (!country) return { title: "País no encontrado" };
  const challenge = pickChallenge(country, getSeries(), getIndicators());
  const hasProfile = Boolean(getProfiles().profiles[iso3]);
  const value = challenge
    ? `${challenge.id === "pou" && challenge.value === 2.5 ? "< 2,5" : fmtNumber(challenge.value, 1)} % de ${challenge.shortName.toLowerCase()} (${challenge.year})`
    : "datos no disponibles";
  return {
    title: hasProfile
      ? `${country.nameEs}: hambre, causas y respuesta de la ONU`
      : `${country.nameEs}: hambre e inseguridad alimentaria en datos`,
    description: hasProfile
      ? `Datos oficiales, causas documentadas y respuesta verificada de la ONU en ${country.nameEs}. Indicador principal: ${value}.`
      : `Datos oficiales de hambre e inseguridad alimentaria en ${country.nameEs}. Indicador principal: ${value}. Sin perfil verificado de causas ni respuesta de la ONU en esta edición.`,
  };
}

export default async function CountryPage({ params }: { params: Promise<{ iso3: string }> }) {
  const { iso3 } = await params;
  const country = getCountry(iso3);
  if (!country) notFound();

  const countries = getCountries();
  const series = getSeries();
  const indicators = getIndicators();
  const world = getWorld();
  const profiles = getProfiles();
  const measures = getMeasures();
  const grfc = getGrfc();

  const profile = profiles.profiles[country.iso3] ?? null;
  const challenge = pickChallenge(country, series, indicators);
  const scale = challenge
    ? buildScale(country, countries, series, challenge.id, challenge.year, challenge.value, world)
    : null;
  const context = buildContext(country, series, indicators, challenge?.id ?? null, profile?.hiddenIndicators ?? []);
  const grfcCountry = grfc.countries[country.iso3] ?? null;
  const maxGrfcYear = Math.max(
    ...Object.values(grfc.countries).flatMap((c) => c.history.map((h) => h.year)),
  );
  const acute = buildAcute(profile, grfcCountry, maxGrfcYear);

  const featured = Object.keys(profiles.profiles)
    .map((code) => {
      const c = countries.find((x) => x.iso3 === code);
      return c ? { iso3: code, nameEs: c.nameEs } : null;
    })
    .filter((x): x is { iso3: string; nameEs: string } => x !== null)
    .sort((a, b) => a.nameEs.localeCompare(b.nameEs, "es"));

  const view: CountryView = {
    country,
    challenge,
    scale,
    context,
    profile,
    acute,
    grfc: grfcCountry
      ? {
          history: grfcCountry.history.slice(-10).map((h) => ({
            year: h.year,
            phase3plus: h.phase3plus,
            phase3plusPct: h.phase3plusPct,
            period: h.period,
          })),
          drivers: grfcCountry.drivers,
          protracted: grfcCountry.protracted,
        }
      : null,
    measures,
    featured,
  };

  return (
    <main>
      <CountryExperience view={view} />
    </main>
  );
}
