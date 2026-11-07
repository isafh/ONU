"use client";

import Link from "next/link";
import { Monitor } from "lucide-react";

function Mark() {
  return (
    <svg width="24" height="24" viewBox="0 0 30 30" aria-hidden="true">
      <circle cx="15" cy="15" r="13.2" fill="none" stroke="currentColor" strokeWidth="1.1" opacity="0.55" />
      <path d="M15 24V11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M15 14c-3.2 0-5-2.1-5-5.1 3.2 0 5 2 5 5.1Z" fill="currentColor" opacity="0.85" />
      <path d="M15 17c3.2 0 5-2.1 5-5.1-3.2 0-5 2-5 5.1Z" fill="currentColor" opacity="0.55" />
      <path d="M15 21c-2.5 0-4-1.7-4-4.1 2.5 0 4 1.6 4 4.1Z" fill="currentColor" opacity="0.35" />
    </svg>
  );
}

export default function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/95 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between gap-3 px-4">
        <Link href="/movil" className="flex items-center gap-2 text-ink" aria-label="Hunger Map, versión móvil">
          <Mark />
          <span className="text-[15px] font-semibold tracking-tight">Hunger Map</span>
          <span className="rounded-full bg-terracotta/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-rust">
            Móvil
          </span>
        </Link>
        <Link
          href="/"
          aria-label="Ver versión de escritorio"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 text-muted"
          title="Versión de escritorio"
        >
          <Monitor size={15} />
        </Link>
      </div>
    </header>
  );
}
