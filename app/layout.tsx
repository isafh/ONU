import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/fraunces";
import "./globals.css";
import Chrome from "@/components/Chrome";

export const metadata: Metadata = {
  title: {
    default: "Hunger Map — El hambre en el mundo, en datos",
    template: "%s · Hunger Map",
  },
  description:
    "Experiencia interactiva sobre el hambre mundial: mapa por país, datos oficiales de FAO, PMA, UNICEF, FIDA y GRFC/IPC, causas documentadas, simulador de soluciones y respuesta real de la ONU.",
  keywords: [
    "hambre",
    "inseguridad alimentaria",
    "FAO",
    "SOFI",
    "PMA",
    "UNICEF",
    "ODS 2",
    "mapa",
    "datos abiertos",
  ],
  authors: [{ name: "Hunger Map" }],
  openGraph: {
    title: "El hambre en el mundo: ¿cuánto sabes realmente?",
    description:
      "645 millones de personas padecieron hambre en 2025. Explora el mapa, pon a prueba tu percepción y decide qué harías.",
    type: "website",
    locale: "es_ES",
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f3ea",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:text-sm focus:text-paper"
        >
          Saltar al contenido
        </a>
        <Chrome>{children}</Chrome>
      </body>
    </html>
  );
}
