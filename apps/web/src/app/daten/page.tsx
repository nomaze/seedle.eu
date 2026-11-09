import type { Metadata } from "next";
import { Suspense } from "react";
import { StandortWahlView } from "@/components/daten/StandortWahlView";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { getDmkRegions } from "@/server/services/dmk";

export const metadata: Metadata = {
  title: "Regionale Sortenversuche (Demo-Datensatz)",
  description:
    "Regionale Sortenversuche (Demo-Datensatz) mit modellierten Mehrjahres-Ergebnissen und Einstufungen für Maissorten in Deutschland — 100% frei zugänglich.",
};

export default function DatenPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DatenContent />
    </Suspense>
  );
}

async function DatenContent() {
  const regions = getDmkRegions();

  return (
    <StandortWahlView
      initialRegions={regions}
      initialPlz=""
    />
  );
}
