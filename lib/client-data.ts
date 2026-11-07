"use client";

import { useEffect, useState } from "react";

const cache = new Map<string, Promise<unknown>>();

/**
 * URL de un archivo de `public/` que respeta el basePath.
 *
 * En GitHub Pages un sitio de proyecto vive en `/repositorio/`. Next añade ese
 * prefijo a las páginas y a `/_next/`, pero no a un `fetch("/data/...")`
 * absoluto, que acabaría en la raíz del dominio y devolvería 404.
 *
 * Se usa la variable de build si existe. Si no, se deduce del primer script de
 * Next presente en el documento, de modo que también funcione cuando el
 * basePath lo inyecta el flujo de trabajo de GitHub Pages sin exportar la
 * variable al cliente.
 */
export function assetUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const configured = process.env.NEXT_PUBLIC_BASE_PATH;
  if (configured) return `${configured}${normalized}`;

  if (typeof document !== "undefined") {
    const src =
      document.querySelector<HTMLScriptElement>('script[src*="/_next/"]')?.getAttribute("src") ?? "";
    const marker = "/_next/";
    const index = src.indexOf(marker);
    if (index > 0) return `${src.slice(0, index)}${normalized}`;
  }

  return normalized;
}

export function fetchJson<T>(file: string): Promise<T> {
  if (!cache.has(file)) {
    cache.set(
      file,
      fetch(assetUrl(`/data/${file}`)).then((r) => {
        if (!r.ok) throw new Error(`No se pudo cargar ${file} (${r.status})`);
        return r.json();
      }),
    );
  }
  return cache.get(file) as Promise<T>;
}

type State<T> =
  | { status: "loading"; data: null; error: null }
  | { status: "ready"; data: T; error: null }
  | { status: "error"; data: null; error: string };

export function useJson<T>(file: string): State<T> {
  const [state, setState] = useState<State<T>>({ status: "loading", data: null, error: null });

  useEffect(() => {
    let alive = true;
    fetchJson<T>(file)
      .then((data) => alive && setState({ status: "ready", data, error: null }))
      .catch((err: Error) => alive && setState({ status: "error", data: null, error: err.message }));
    return () => {
      alive = false;
    };
  }, [file]);

  return state;
}
