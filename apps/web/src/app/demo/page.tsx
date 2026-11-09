import type { Metadata } from "next";
import { Suspense } from "react";
import { DemoSettingsForm } from "@/components/demo/DemoSettingsForm";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { demoEinstellungen } from "@/server/demo";

export const metadata: Metadata = {
  title: "Demo-Einstellungen",
  description: "Marke, Funktionen und Simulationsdatum für Vorführungen konfigurieren.",
};

export default function DemoPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DemoContent />
    </Suspense>
  );
}

async function DemoContent() {
  const demo = await demoEinstellungen();

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: "/", label: "Startseite" }}
        eyebrow="Für Präsentationen & Tests"
        title="Demo-Einstellungen"
        lead="Schalte zwischen Marken-Designs um, teste Funktionen einzeln oder reise per Simulationsdatum durch das Vegetationsjahr."
      />
      <DemoSettingsForm initialSettings={demo} />
    </div>
  );
}
