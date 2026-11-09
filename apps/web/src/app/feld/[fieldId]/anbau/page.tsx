import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { ChoiceLink } from "@/components/ui/Choice";
import { KornIcon, SiloIcon } from "@/components/ui/CropIcons";
import { PageSkeleton } from "@/components/ui/Skeleton";
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

async function Anbau({ params }: { params: Promise<{ fieldId: string }> }) {
  const { fieldId } = await params;
  const { field } = await requireField(fieldId);

  return (
    <>
      <PageHeader
        back={{ href: `/feld/${field.id}`, label: "Dein Feld" }}
        eyebrow={`Schritt 2 von 3 · ${field.name}`}
        title="Was willst du 2027 anbauen?"
        lead="Wähl direkt die Nutzungsrichtung für deinen Mais. Wir ermitteln die besten Sorten für deinen Standort."
      />
      <div className="space-y-3">
        <ChoiceLink
          href={`/feld/${field.id}/ranking?usage=koernermais`}
          icon={<KornIcon />}
          title="Körnermais"
          text="Zum Verkaufen oder Verfüttern. Wir rechnen mit Kornertrag, Trocknung und Preis."
        />
        <ChoiceLink
          href={`/feld/${field.id}/ranking?usage=silomais`}
          icon={<SiloIcon />}
          title="Silomais"
          text="Für Futter oder Biogas. Wir rechnen mit Trockenmasse und Stärke."
        />
      </div>
      <p className="mt-5 text-sm text-muted">
        Sonnenblumen, Weizen, Raps und die freie Wahl zwischen Kulturen kommen als Nächstes dazu.
      </p>
    </>
  );
}
