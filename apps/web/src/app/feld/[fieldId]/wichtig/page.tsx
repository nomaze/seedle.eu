import type { Metadata } from "next";
import { Suspense } from "react";
import { WichtigProfileForm } from "@/components/feld/WichtigProfileForm";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { requireField } from "@/server/pages";
export { generateFieldStaticParams as generateStaticParams } from "@/server/static-params";

export const metadata: Metadata = { title: "Was ist dir wichtig?" };

export default function WichtigPage({ params }: { params: Promise<{ fieldId: string }> }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Wichtig params={params} />
    </Suspense>
  );
}

async function Wichtig({ params }: { params: Promise<{ fieldId: string }> }) {
  const { fieldId } = await params;
  const { field } = await requireField(fieldId);
  const initialUsage = field.usage === "koernermais" ? "koernermais" : "silomais";

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: `/feld/${field.id}/boden`, label: "Boden & Schlag" }}
        eyebrow={`Schritt 4 von 4 · ${field.name}`}
        title="Was ist dir wichtig?"
        lead="Wähl deine Ertragsstrategie, deine Wunsch-Reifegruppe und deine bisherige Referenzsorte für den direkten 1:1-Vergleich."
      />

      <WichtigProfileForm fieldId={field.id} initialUsage={initialUsage} />
    </div>
  );
}
