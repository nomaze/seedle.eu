import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { WhereToBuyContent } from "@/components/daten/WhereToBuyModal";
import { PageHeader } from "@/components/shell/PageHeader";
import { Card } from "@/components/ui/Card";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { requireField } from "@/server/pages";
import { explanationFor } from "@/server/services/recommendations";
export { generateFieldVarietyStaticParams as generateStaticParams } from "@/server/static-params";

export const metadata: Metadata = { title: "Wo kann ich die Sorte kaufen?" };

export default function KaufenPage({
  params,
}: {
  params: Promise<{ fieldId: string; varietyId: string }>;
}) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Kaufen params={params} />
    </Suspense>
  );
}

export async function Kaufen({
  params,
}: {
  params: Promise<{ fieldId: string; varietyId: string }>;
}) {
  const { fieldId, varietyId } = await params;
  const { field } = await requireField(fieldId);
  const e = await explanationFor(field, varietyId);
  if (!e) notFound();

  return (
    <div>
      <PageHeader
        back={{ href: `/feld/${field.id}/sorte/${e.variety.id}`, label: e.variety.name }}
        eyebrow={`Bezugsquellen · ${field.name} (${field.env.region})`}
        title={`Wo kann ich „${e.variety.name}“ kaufen?`}
        lead="Hier findest du deinen regionalen Agrarhandel, Genossenschaften vor Ort sowie den direkten Züchter-Fachberater für deine Region."
      />

      <Card>
        <WhereToBuyContent
          varietyName={e.variety.name}
          zuechter={e.breeder?.name ?? null}
          reifezahl={e.variety.reifezahl}
          region={field.env.region}
          schlagName={field.name}
        />
      </Card>
    </div>
  );
}
