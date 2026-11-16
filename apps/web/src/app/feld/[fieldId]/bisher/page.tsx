import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { PreviousVarietyPicker } from "@/components/ui/PreviousVarietyPicker";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { requireField } from "@/server/pages";
import { providers } from "@/server/providers";

export const metadata: Metadata = { title: "Bisherige Sorte" };
export { generateFieldStaticParams as generateStaticParams } from "@/server/static-params";

export default function BisherPage({ params }: PageProps<"/feld/[fieldId]/bisher">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Bisher params={params} />
    </Suspense>
  );
}

async function Bisher({ params }: { params: Promise<{ fieldId: string }> }) {
  const { fieldId } = await params;
  const { field } = await requireField(fieldId);
  const p = providers();
  const zuechter = new Map(p.catalog.breeders().map((b) => [b.id, b.name]));
  const optionen = p.catalog
    .varieties()
    .filter((v) => !field.usage || v.usages.includes(field.usage as "koernermais" | "silomais"))
    .map((v) => ({ id: v.id, name: v.name, zuechter: zuechter.get(v.breederId) ?? "", reifezahl: v.reifezahl }));

  const initialCrop = field.usage === "koernermais" ? "koernermais" : "silomais";

  return (
    <>
      <PageHeader
        back={{ href: `/feld/${field.id}/anbau`, label: "Anbau" }}
        eyebrow="Fast geschafft"
        title="Was hast du bisher auf dem Feld angebaut?"
        lead="Wähle zuerst die Kultur (mit der Anzahl unserer bekannten Sorten) und danach deine bisherige Sorte für den direkten 5-Jahres-Vergleich."
      />
      <PreviousVarietyPicker
        fieldId={field.id}
        optionen={optionen}
        initialCrop={initialCrop}
      />
    </>
  );
}
