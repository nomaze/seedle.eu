import type { Metadata } from "next";
import { Suspense } from "react";
import { BodenProfileForm } from "@/components/feld/BodenProfileForm";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { requireField } from "@/server/pages";
export { generateFieldStaticParams as generateStaticParams } from "@/server/static-params";

export const metadata: Metadata = { title: "Was wir von deinem Feld brauchen" };

export default function BodenPage({ params }: { params: Promise<{ fieldId: string }> }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Boden params={params} />
    </Suspense>
  );
}

async function Boden({ params }: { params: Promise<{ fieldId: string }> }) {
  const { fieldId } = await params;
  const { field } = await requireField(fieldId);
  const initialUsage = field.usage === "koernermais" ? "koernermais" : "silomais";

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: `/feld/${field.id}/anbau`, label: "Kulturwahl" }}
        eyebrow={`Schritt 3 von 4 · ${field.name}`}
        title="Was wir von deinem Feld brauchen"
        lead="Wir haben Bodenart, Wasserspeicherfähigkeit und Befahrbarkeit bereits aus deiner Schlag-Koordinate ermittelt. Du kannst alles mit einem Klick anpassen oder ergänzen."
      />

      <BodenProfileForm
        fieldId={field.id}
        fieldName={field.name}
        areaHa={field.areaHa}
        initialUsage={initialUsage}
      />
    </div>
  );
}
