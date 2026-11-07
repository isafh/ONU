/**
 * Ruta base del sitio. En GitHub Pages los sitios de proyecto se publican en
 * https://usuario.github.io/repositorio/, no en la raíz del dominio.
 * El flujo de trabajo pasa este valor a `next.config.mjs` mediante PAGES_BASE_PATH.
 */
const rawBasePath = process.env.PAGES_BASE_PATH ?? "";
// Next no admite "/" ni barras finales en basePath.
const basePath = rawBasePath === "/" ? "" : rawBasePath.replace(/\/+$/, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  reactStrictMode: true,
  basePath,
  // Next solo añade el basePath a las rutas que gestiona. Las descargas hechas
  // con fetch() desde el cliente necesitan el mismo prefijo; se inyecta aquí.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
