"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const NAV = [
  { href: "/", label: "Inicio" },
  { href: "/mapa", label: "Mapa" },
  { href: "/desafio", label: "Desafío" },
  { href: "/datos", label: "Datos" },
  { href: "/metodologia", label: "Metodología" },
];

function Mark() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
      <circle cx="15" cy="15" r="13.2" fill="none" stroke="currentColor" strokeWidth="1.1" opacity="0.55" />
      <path d="M15 24V11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M15 14c-3.2 0-5-2.1-5-5.1 3.2 0 5 2 5 5.1Z" fill="currentColor" opacity="0.85" />
      <path d="M15 17c3.2 0 5-2.1 5-5.1-3.2 0-5 2-5 5.1Z" fill="currentColor" opacity="0.55" />
      <path d="M15 21c-2.5 0-4-1.7-4-4.1 2.5 0 4 1.6 4 4.1Z" fill="currentColor" opacity="0.35" />
    </svg>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-paper/90 backdrop-blur-md no-print">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 text-ink" aria-label="Hunger Map, inicio">
          <Mark />
          <span className="flex flex-col leading-none">
            <span className="kicker text-[10px] text-muted">Hunger</span>
            <span className="text-[17px] font-semibold tracking-tight">Map</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Navegación principal">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  active ? "bg-ink text-paper" : "text-ink-2 hover:bg-ink/5"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/mapa"
            className="hidden rounded-full bg-terracotta px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rust sm:inline-flex"
          >
            Explorar el mapa
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 md:hidden"
            aria-expanded={open}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-ink/10 bg-paper px-4 py-3 md:hidden">
          <nav className="flex flex-col" aria-label="Navegación móvil">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-lg px-3 py-3 text-sm hover:bg-ink/5">
                {item.label}
              </Link>
            ))}
            <Link href="/mapa" className="mt-2 rounded-lg bg-terracotta px-3 py-3 text-center text-sm font-medium text-white">
              Explorar el mapa
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
