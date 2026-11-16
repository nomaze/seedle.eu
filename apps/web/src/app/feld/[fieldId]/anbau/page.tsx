import type { Metadata } from "next";
import { Suspense } from "react";
import { AnbauCropUsageSection } from "@/components/feld/AnbauCropUsageSection";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { num } from "@/lib/format";
import { requireField } from "@/server/pages";
export { generateFieldStaticParams as generateStaticParams } from "@/server/static-params";

export const metadata: Metadata = { title: "Was willst du 2027 anbauen?" };

export default function AnbauPage({ params }: PageProps<"/feld/[fieldId]/anbau">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Anbau params={params} />
    </Suspense>
  );
}

export async function Anbau({ params }: { params: Promise<{ fieldId: string }> }) {
  const { fieldId } = await params;
  const { field } = await requireField(fieldId);
  const flaecheHa = field.areaHa;

  return (
    <div className="space-y-section">
      <PageHeader
        back={{ href: `/feld/${field.id}`, label: "Dein Feld" }}
        eyebrow={`Schritt 2 · ${field.name} (${num(flaecheHa)} ha)`}
        title="Was willst du 2027 anbauen?"
        lead="Klick zuerst auf deine Hauptkultur und wähl danach direkt deine geplante Nutzungsrichtung."
      />

      <AnbauCropUsageSection
        fieldId={field.id}
        fieldName={field.name}
        areaHa={flaecheHa}
        lat={field.lat}
        lon={field.lon}
      />
    </div>
  );
}
