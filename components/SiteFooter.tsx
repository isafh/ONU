import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-ink/10 bg-paper-2/60 no-print">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="kicker text-muted">Hunger Map</p>
            <p className="mt-3 max-w-md font-serif text-2xl leading-snug">
              Una herramienta educativa para leer el hambre con datos, no con impresiones.
            </p>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
              Proyecto independiente de divulgación. No es una publicación oficial de las Naciones Unidas.
              Todas las cifras remiten a su fuente original y a la fecha de consulta.
            </p>
          </div>
          <div>
            <p className="kicker text-muted">Explorar</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link className="hover:text-terracotta" href="/mapa">Mapa del hambre</Link></li>
              <li><Link className="hover:text-terracotta" href="/desafio">Desafío de estimación</Link></li>
              <li><Link className="hover:text-terracotta" href="/movil">Versión móvil</Link></li>
              <li><Link className="hover:text-terracotta" href="/datos">Estadísticas globales</Link></li>
              <li><Link className="hover:text-terracotta" href="/metodologia">Metodología y fuentes</Link></li>
              <li><Link className="hover:text-terracotta" href="/metodologia#actualizar">Actualizar los datos</Link></li>
            </ul>
          </div>
          <div>
            <p className="kicker text-muted">Fuentes principales</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li><a className="hover:text-terracotta" href="https://www.fao.org/faostat/en/#data/FS" target="_blank" rel="noreferrer">FAO — FAOSTAT / SOFI</a></li>
              <li><a className="hover:text-terracotta" href="https://www.wfp.org" target="_blank" rel="noreferrer">PMA / WFP</a></li>
              <li><a className="hover:text-terracotta" href="https://data.unicef.org" target="_blank" rel="noreferrer">UNICEF</a></li>
              <li><a className="hover:text-terracotta" href="https://www.ifad.org" target="_blank" rel="noreferrer">FIDA / IFAD</a></li>
              <li><a className="hover:text-terracotta" href="https://www.fsinplatform.org/global-report-food-crises" target="_blank" rel="noreferrer">GRFC / IPC</a></li>
              <li><a className="hover:text-terracotta" href="https://data.worldbank.org" target="_blank" rel="noreferrer">Banco Mundial</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col justify-between gap-3 border-t border-ink/10 pt-5 text-xs text-muted sm:flex-row">
          <p>Datos abiertos · Sin claves de API · Sin datos inventados</p>
          <p>Última actualización de la base: noviembre de 2026</p>
        </div>
      </div>
    </footer>
  );
}
