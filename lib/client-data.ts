"use client";

import { useEffect, useState } from "react";

const cache = new Map<string, Promise<unknown>>();

export function fetchJson<T>(file: string): Promise<T> {
  if (!cache.has(file)) {
    cache.set(
      file,
      fetch(`/data/${file}`).then((r) => {
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
