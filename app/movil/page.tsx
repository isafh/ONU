import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Info, Map, Sparkles } from "lucide-react";
import { getHeadlines } from "@/lib/data-server";
import { fmtNumber, fmtPeople } from "@/lib/format";

export const metadata: Metadata = {
  title: "El hambre en el mundo",
  description:
    "Versión para teléfonos de Hunger Map: cifras clave de SOFI 2026, mapa táctil del hambre y desafío de estimación por pasos.",
};

export default function MovilHomePage() {
  const { figures: F, regionalMsfi } = getHeadlines();
  const maxRegion = Math.max(...regionalMsfi.map((r) => r.prevalence));

  return (
    <div className="px-4 pb-10 pt-6">
      <p className="kicker text-terracotta">Datos abiertos · edición 2026</p>
      <h1 className="display mt-3 text-[2.35rem] leading-[0.98]">
        El hambre en el mundo, en tu bolsillo
      </h1>
      <p className="mt-4 text-[13px] leading-relaxed text-ink-2">
        <strong className="font-semibold text-ink">{fmtPeople(F.hungerPeople)}</strong> de personas no
        tuvieron suficiente comida en 2025. Explora el mapa, pon a prueba tu percepción y compara con los
        datos oficiales.
      </p>

      <div className="mt-5 grid gap-2">
        <Link
          href="/movil/mapa"
          className="inline-flex items-center justify-between gap-2 rounded-2xl bg-terracotta px-4 py-3.5 text-sm font-semibold text-white"
        >
          <span className="inline-flex items-center gap-2">
            <Map size={17} /> Abrir el mapa táctil
          </span>
          <ArrowRight size={17} />
        </Link>
        <Link
          href="/movil/desafio"
          className="inline-flex items-center justify-between gap-2 rounded-2xl border border-ink/15 bg-[#fffdf8] px-4 py-3.5 text-sm font-semibold text-ink"
        >
          <span className="inline-flex items-center gap-2">
            <Sparkles size={17} className="text-terracotta" /> Hacer el desafío
          </span>
          <ArrowRight size={17} className="text-muted" />
        </Link>
      </div>

      <section className="mt-7" aria-labelledby="cifras">
        <div className="flex items-baseline justify-between">
          <h2 id="cifras" className="kicker text-muted">
            El mundo en cifras · 2025
          </h2>
          <span className="text-[10px] text-muted">SOFI 2026</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-deep p-4 text-paper">
            <p className="display text-3xl text-amber-soft">{fmtNumber(F.hungerPrevalence, 1)} %</p>
            <p className="mt-1 text-[11px] leading-snug text-paper/75">de la población mundial padece hambre</p>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-[#fffdf8] p-4">
            <p className="display text-3xl text-terracotta">{fmtNumber(F.msfiPrevalence, 1)} %</p>
            <p className="mt-1 text-[11px] leading-snug text-muted">
              con inseguridad alimentaria moderada o grave
            </p>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-[#fffdf8] p-4">
            <p className="display text-2xl text-ink">{fmtPeople(F.msfiPeople)}</p>
            <p className="mt-1 text-[11px] leading-snug text-muted">
              personas con inseguridad alimentaria moderada o grave
            </p>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-[#fffdf8] p-4">
            <p className="display text-2xl text-ink">{fmtPeople(F.unaffordableHealthyDietPeople)}</p>
            <p className="mt-1 text-[11px] leading-snug text-muted">no pueden permitirse una dieta saludable</p>
          </div>
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-muted">
          Cifras publicadas en SOFI 2026. «Hambre» equivale a subalimentación (ODS 2.1.1).
        </p>
      </section>

      <section className="mt-8" aria-labelledby="definiciones">
        <h2 id="definiciones" className="kicker text-muted">
          No son lo mismo
        </h2>
        <div className="mt-3 space-y-2">
          {[
            {
              tag: "Crónico · ODS 2.1.1",
              title: "Subalimentación",
              text: "Insuficiencia habitual de energía alimentaria durante un año.",
              cls: "border-l-terracotta",
            },
            {
              tag: "Crónico · ODS 2.1.2",
              title: "Inseguridad alimentaria",
              text: "Hogares que reducen la calidad o cantidad de alimentos por falta de recursos.",
              cls: "border-l-amber",
            },
            {
              tag: "Agudo · IPC",
              title: "Crisis alimentaria aguda",
              text: "Población en Fase 3 o superior durante un periodo concreto.",
              cls: "border-l-olive",
            },
          ].map((d) => (
            <article key={d.title} className={`rounded-xl border border-ink/10 border-l-[3px] bg-[#fffdf8] p-3.5 ${d.cls}`}>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-muted">{d.tag}</p>
              <p className="mt-1 text-sm font-semibold">{d.title}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{d.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="regiones">
        <div className="flex items-baseline justify-between">
          <h2 id="regiones" className="kicker text-muted">
            Inseguridad alimentaria por región
          </h2>
          <span className="text-[10px] text-muted">2025</span>
        </div>
        <div className="mt-3 space-y-3 rounded-2xl border border-ink/10 bg-[#fffdf8] p-4">
          {regionalMsfi.map((r) => (
            <div key={r.region}>
              <div className="flex items-baseline justify-between gap-2 text-[11px]">
                <span className={r.region === "Mundo" ? "font-semibold text-ink" : "text-ink-2"}>{r.region}</span>
                <span className="tabular text-muted">{fmtNumber(r.prevalence, 1)} %</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink/5">
                <div
                  className={`h-full rounded-full ${r.region === "Mundo" ? "bg-amber" : "bg-terracotta"}`}
                  style={{ width: `${(r.prevalence / maxRegion) * 100}%` }}
                />
              </div>
            </div>
          ))}
          <p className="border-t border-ink/10 pt-2 text-[10px] leading-relaxed text-muted">
            Porcentaje de la población de cada región. Las regiones no son comparables en tamaño de población.
          </p>
        </div>
      </section>

      <div className="mt-8 flex gap-2 rounded-xl border border-ink/10 bg-paper-2/50 p-3.5 text-[11px] leading-relaxed text-muted">
        <Info size={14} className="mt-0.5 shrink-0 text-terracotta" />
        <p>
          Esta es la versión móvil. La versión completa, con fichas de país, metodología y estadísticas
          detalladas, sigue disponible en{" "}
          <Link href="/" className="underline decoration-line underline-offset-2 hover:text-terracotta">
            la web principal
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
