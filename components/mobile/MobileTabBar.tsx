"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Home, Map, Sparkles } from "lucide-react";

const TABS = [
  { href: "/movil", label: "Inicio", icon: Home },
  { href: "/movil/mapa", label: "Mapa", icon: Map },
  { href: "/movil/desafio", label: "Desafío", icon: Sparkles },
  { href: "/movil/datos", label: "Datos", icon: BarChart3 },
];

export default function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación móvil"
      className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[430px] border-t border-ink/10 bg-paper/95 pb-[max(env(safe-area-inset-bottom),6px)] pt-1.5 backdrop-blur-md"
    >
      <ul className="grid grid-cols-4">
        {TABS.map((tab) => {
          const active =
            tab.href === "/movil" ? pathname === "/movil" || pathname === "/movil/" : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 rounded-lg py-1.5 text-[10px] font-medium transition-colors ${
                  active ? "text-terracotta" : "text-muted hover:text-ink"
                }`}
              >
                <span className={`rounded-full px-3 py-1 ${active ? "bg-terracotta/10" : ""}`}>
                  <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
