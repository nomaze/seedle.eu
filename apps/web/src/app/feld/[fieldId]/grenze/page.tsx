import type { Metadata } from "next";
import { Suspense } from "react";
import { FieldPicker } from "@/components/map/FieldPicker";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { requireField } from "@/server/pages";

export const metadata: Metadata = { title: "Feldgrenze anpassen" };
export { generateFieldStaticParams as generateStaticParams } from "@/server/static-params";

export default function GrenzePage({ params }: PageProps<"/feld/[fieldId]/grenze">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Grenze params={params} />
    </Suspense>
  );
}

async function Grenze({ params }: { params: Promise<{ fieldId: string }> }) {
  const { fieldId } = await params;
  const { field } = await requireField(fieldId);
  return (
    <>
      <PageHeader
        back={{ href: `/feld/${field.id}`, label: "Dein Feld" }}
        title="Feldgrenze anpassen"
        lead="Zieh die gelben Ecken an die richtige Stelle. Die Fläche rechnen wir neu."
      />
      <FieldPicker mode="anpassen" fieldId={field.id} initial={field.geometry} initialName={field.name} />
    </>
  );
}
