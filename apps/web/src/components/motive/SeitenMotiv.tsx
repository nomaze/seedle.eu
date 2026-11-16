"use client";

import { usePathname } from "next/navigation";
import { MotivFeldmosaik } from "./Feldmosaik";

/**
 * Seed of the self-drawing field mosaic per route, so each area gets its own field layout.
 * Map-heavy pages and pages that draw their own motifs (landing, about, why free) get none.
 */
function seedFuer(pfad: string): number | null {
  // Landing, about and why-free pages draw their own motifs in the content; map pages stay clean.
  if (
    pfad === "/" ||
    pfad === "/ueber-uns" ||
    pfad === "/warum-wir-das-machen" ||
    pfad === "/warum-kostenlos" ||
    pfad === "/feld/neu" ||
    pfad.endsWith("/grenze")
  )
    return null;
  if (pfad.endsWith("/ranking")) return 23;
  if (pfad.includes("/sorte/")) return 31;
  if (pfad.startsWith("/heute")) return 7;
  if (pfad.startsWith("/hof")) return 5;
  if (pfad.startsWith("/daten")) return 41;
  if (pfad.startsWith("/feld/")) return 11;
  return 17;
}

/** Background motif anchored bottom right behind the content; redraws on every navigation. */
export function SeitenMotiv() {
  const pfad = usePathname();
  const seed = seedFuer(pfad);
  if (seed === null) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed -right-[18vw] bottom-[6vh] -z-10 w-[86vw] opacity-30 sm:-right-[4vw] sm:w-[min(36vw,500px)] sm:opacity-40"
    >
      <MotivFeldmosaik key={pfad} variante="seite" seed={seed} />
    </div>
  );
}
