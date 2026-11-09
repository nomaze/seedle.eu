import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { PhotoUpload } from "@/components/ui/PhotoUpload";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { listFields, type Field } from "@/server/services/fields";
import { todayView } from "@/server/services/season";
import { currentUser } from "@/server/session";

export const metadata: Metadata = { title: "Foto aus dem Feld" };

export default async function FotoPage() {
  const user = await currentUser();
  const felder = await listFields(user.id);
  const field = felder.find((f) => f.selectedVarietyId) ?? felder[0]!;

  return (
    <Suspense fallback={<PageSkeleton />}>
      <Foto field={field} />
    </Suspense>
  );
}

async function Foto({ field }: { field: Field }) {
  const view = await todayView(field);
  const anleitung =
    view?.fotoAuftrag?.anleitung ??
    "Lade ein Foto deines Bestands hoch. Wir werten Stadium, Schadbild und Entwicklung für dich aus.";

  return (
    <>
      <PageHeader
        back={{ href: `/feld/${field.id}`, label: field.name }}
        title="Foto aus dem Feld"
        lead={anleitung}
      />
      <PhotoUpload fieldId={field.id} anleitung={anleitung} />
    </>
  );
}
