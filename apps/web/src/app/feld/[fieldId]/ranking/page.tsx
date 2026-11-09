import {
  USAGE_LABEL,
  type ScenarioId,
  type Usage,
} from "@seedle/core";
import type { Metadata } from "next";
import { Suspense } from "react";
export { generateFieldStaticParams as generateStaticParams } from "@/server/static-params";
import { FieldRankingView } from "@/components/daten/FieldRankingView";
import { PageHeader } from "@/components/shell/PageHeader";
import { DemoBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { num } from "@/lib/format";
import { requireField } from "@/server/pages";
import { providers } from "@/server/providers";
import { recommendationFor } from "@/server/services/recommendations";
import { track } from "@/server/services/tracking";

export const metadata: Metadata = { title: "Deine Sorten für 2027" };

export default function RankingPage({
  params,
}: {
  params: Promise<{ fieldId: string }>;
}) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Ranking params={params} />
    </Suspense>
  );
}

async function Ranking({
  params,
}: {
  params: Promise<{ fieldId: string }>;
}) {
  const { fieldId } = await params;
  const sortierung: ScenarioId | "gewichtet" = "gewichtet";

  const { user, field } = await requireField(fieldId);
  const rec = await recommendationFor(field, sortierung);
  if (!rec) {
    return (
      <>
        <PageHeader
          back={{ href: `/feld/${field.id}`, label: "Dein Feld" }}
          title="Fast da"
          lead="Wähl zuerst, was du 2027 anbauen möchtest."
        />
        <ButtonLink href={`/feld/${field.id}/anbau`}>Anbau wählen</ButtonLink>
      </>
    );
  }
  await track(user.id, "ranking_angesehen", { fieldId, sortierung });

  const usage = field.usage as Usage;
  const safeUsage: Usage = usage === "koernermais" ? "koernermais" : "silomais";
  const standardVariety = providers().catalog.regionalStandard(field.env, safeUsage) ?? providers().catalog.varieties()[0]!;

  return (
    <>
      <PageHeader
        back={{ href: `/feld/${field.id}/anbau`, label: "Anbau" }}
        eyebrow={`Schritt 3 von 3 · ${field.name}`}
        title="Deine Sorten für 2027"
        lead={`${USAGE_LABEL[usage] ?? "Silomais"} auf ${num(field.areaHa)} ha, ${field.env.region}. Ertragsprognose & Versuchsdaten über drei Klimaszenarien für die nächste Saison.`}
        aside={rec.demodaten ? <DemoBadge /> : undefined}
      />

      <FieldRankingView
        field={field}
        rec={rec}
        sortierung={sortierung}
        standardVarietyId={standardVariety.id}
      />
    </>
  );
}
