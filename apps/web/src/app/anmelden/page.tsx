import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { Card } from "@/components/ui/Card";
import { LoginForm } from "@/components/ui/LoginForm";
import { PageSkeleton } from "@/components/ui/Skeleton";

export const metadata: Metadata = { title: "Anmelden" };

export default function AnmeldenPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AnmeldenContent />
    </Suspense>
  );
}

function AnmeldenContent() {
  return (
    <>
      <PageHeader
        back={{ href: "/", label: "Startseite" }}
        title="Willkommen bei Seedle"
        lead="Interaktive Vorschau ohne Passwort und ohne Datenspeicherung."
      />
      <Card className="max-w-lg">
        <LoginForm />
      </Card>
    </>
  );
}
