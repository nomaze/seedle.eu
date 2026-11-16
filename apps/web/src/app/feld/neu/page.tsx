import type { Metadata } from "next";
import { Suspense } from "react";
import { FieldPicker } from "@/components/map/FieldPicker";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { currentUser } from "@/server/session";

export const metadata: Metadata = { title: "Feld wählen" };

export default function NeuesFeldPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <NeuesFeld />
    </Suspense>
  );
}

async function NeuesFeld() {
  await currentUser();

  return (
    <>
      <PageHeader
        back={{ href: "/", label: "Startseite" }}
        eyebrow="Schritt 1 von 3"
        title="Wo liegt dein Feld?"
        lead="Such deinen Ort und tipp auf dein Feld. Wir erkennen die echte Schlaggrenze aus den amtlichen Geodaten und du kannst sie danach anpassen."
      />
      <FieldPicker mode="neu" />
    </>
  );
}
