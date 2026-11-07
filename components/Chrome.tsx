"use client";

import { usePathname } from "next/navigation";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

/**
 * La versión móvil (/movil) tiene su propio chrome: cabecera compacta y barra
 * de pestañas inferior. El resto del sitio conserva la cabecera y el pie.
 */
export default function Chrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMobile = pathname === "/movil" || pathname.startsWith("/movil/");

  return (
    <>
      {!isMobile && <SiteHeader />}
      <div id="contenido">{children}</div>
      {!isMobile && <SiteFooter />}
    </>
  );
}
