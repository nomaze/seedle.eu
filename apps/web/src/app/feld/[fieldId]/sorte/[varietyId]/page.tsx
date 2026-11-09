import { TRIAL_TYPE_LABEL, type Usage } from "@seedle/core";
import { Check, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";
export { generateFieldVarietyStaticParams as generateStaticParams } from "@/server/static-params";
import { TraitScale } from "@/components/charts/TraitScale";
import { YearComparisonChart } from "@/components/charts/YearComparisonChart";
import { PageHeader } from "@/components/shell/PageHeader";
import { NurMit } from "@/components/shell/DemoContext";
import { AskSprossButton, CallTeamButton } from "@/components/spross/AskSpross";
import { Badge, DemoBadge } from "@/components/ui/Badge";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import { Card, SectionTitle } from "@/components/ui/Card";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { eur, num, signed, signedEur } from "@/lib/format";
import { requireField } from "@/server/pages";
import { explanationFor, recommendationFor } from "@/server/services/recommendations";
import { track } from "@/server/services/tracking";

export const metadata: Metadata = { title: "Warum diese Sorte?" };

export default function SortePage({ params }: PageProps<"/feld/[fieldId]/sorte/[varietyId]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Sorte params={params} />
    </Suspense>
  );
}

const BELASTBARKEIT = {
  hoch: { label: "Hohe Belastbarkeit", tone: "leaf" as const },
  mittel: { label: "Gute Belastbarkeit", tone: "sand" as const },
  "im-aufbau": { label: "Belastbarkeit wächst", tone: "bee" as const },
};

const TYP_TON = { LSV: "leaf", BSV: "sand", EU: "bee" } as const;

async function Sorte({ params }: { params: Promise<{ fieldId: string; varietyId: string }> }) {
  const { fieldId, varietyId } = await params;
  const { user, field } = await requireField(fieldId);
  const [e, rec] = await Promise.all([explanationFor(field, varietyId), recommendationFor(field)]);
  const ranked = rec?.sorten.find((s) => s.variety.id === varietyId);
  if (!e || !rec || !ranked) notFound();
  await track(user.id, "erklaerung_angesehen", { fieldId, varietyId, rang: ranked.rang });

  const usage = field.usage as Usage;
  const gewaehlt = field.selectedVarietyId === e.variety.id;
  const t = e.variety.traits;
  const bel = BELASTBARKEIT[e.belastbarkeit];

  return (
    <>
      <PageHeader
        back={{ href: `/feld/${field.id}/ranking`, label: "Ranking" }}
        eyebrow={`Platz ${ranked.rang} von ${rec.sorten.length} auf „${field.name}“`}
        title={e.variety.name}
        lead={e.variety.kurzbeschreibung}
        aside={
          <div className="flex items-center gap-2">
            {e.demodaten ? <DemoBadge /> : null}
            {gewaehlt ? <Badge tone="leaf">Deine Wahl für 2027</Badge> : null}
          </div>
        }
      />

      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
          <Image src={e.breeder.logo} alt={e.breeder.name} width={100} height={30} className="h-7 w-auto" />
          <span>Reifezahl {e.variety.reifezahl}</span>
          <span>·</span>
          <span>in Versuchen seit {e.variety.zulassungsjahr}</span>
        </div>

        {/* Erwartung 2027 */}
        <Card>
          <SectionTitle hint="je Klimaszenario">Was wir für 2027 erwarten</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm tabular">
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th className="pb-2 font-medium">Szenario</th>
                  <th className="pb-2 text-right font-medium">Standort-Rang & Relativ-Index</th>
                  <th className="pb-2 text-right font-medium">{usage === "koernermais" ? "Kornfeuchte" : "Stärke"}</th>
                  <th className="pb-2 text-right font-medium">Wert je ha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rec.scenarios.map((s) => {
                  const p = ranked.predictions.find((x) => x.scenarioId === s.id);
                  const bc = ranked.businessCases.find((x) => x.scenarioId === s.id);
                  const scenarioValues = rec.sorten.map((sv) => {
                    const sp = sv.predictions.find((x) => x.scenarioId === s.id);
                    return (usage === "koernermais" ? sp?.kornertragDtHa : sp?.trockenmasseDtHa) ?? 0;
                  });
                  const scenarioMean =
                    scenarioValues.reduce((acc, v) => acc + v, 0) /
                    Math.max(scenarioValues.length, 1);
                  const ownVal =
                    (usage === "koernermais" ? p?.kornertragDtHa : p?.trockenmasseDtHa) ?? 0;
                  const relIndex =
                    scenarioMean > 0 ? Math.round((ownVal / scenarioMean) * 100) : 100;
                  const scenRank = ranked.rangJeSzenario[s.id] ?? ranked.rang;
                  return (
                    <tr key={s.id}>
                      <td className="py-2.5">
                        <span className="font-medium">{s.label}</span> <span className="text-muted">{Math.round(s.wahrscheinlichkeit * 100)} %</span>
                      </td>
                      <td className="py-2.5 text-right font-medium">
                        Platz {scenRank} · {num(relIndex, 0)} %
                      </td>
                      <td className="py-2.5 text-right">{num((usage === "koernermais" ? p?.kornfeuchteProzent : p?.staerkeProzent) ?? 0)} %</td>
                      <td className="py-2.5 text-right font-semibold">{eur(bc?.wertEurHa ?? 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-line">
                  <td className="pt-2.5 font-semibold" colSpan={3}>
                    Erwartet, gewichtet nach Wahrscheinlichkeit
                  </td>
                  <td className="pt-2.5 text-right font-bold text-leaf-800">{eur(ranked.erwarteterWertEurHa)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        {/* Five years against reference variety */}
        <Card>
          <SectionTitle>
            {e.vergleich.quelle === "bisherige-sorte" ? `Gegen deine ${e.vergleich.variety?.name}` : `Gegen ${e.vergleich.label}`}, auf deinem Feld
          </SectionTitle>
          <p className="mb-4 text-muted">
            {e.jahreVorne > 2 ? (
              <>
                In <strong className="text-ink">{e.jahreVorne} von {e.jahre.length} Jahren</strong> lag {e.variety.name} auf deinem Feld vorne,
                im Mittel mit <strong className="text-ink">{signed(e.mittlererVorsprung)} % Relativ-Vorsprung</strong> (rund {signedEur(e.mittlererVorsprungEurHa)} je ha).
              </>
            ) : (
              <>
                {e.variety.name} liegt in {e.jahreVorne} von {e.jahre.length} Jahren vorne, im Mittel {signed(e.mittlererVorsprung)} % Relativ-Vorsprung. Die Stärke dieser
                Sorte liegt in den Szenarien oben.
              </>
            )}
          </p>
          <YearComparisonChart jahre={e.jahre} nameA={e.variety.name} nameB={e.vergleich.variety?.name ?? e.vergleich.label} />
          <p className="mt-3 text-xs text-muted">
            Balken: Modellrechnung für dein Feld mit dem Wetter des jeweiligen Jahres. Rauten: echte Versuchsergebnisse an Standorten, die deinem ähneln.
          </p>
        </Card>

        {/* Agronomic reasons */}
        <Card>
          <SectionTitle>Warum wir das annehmen</SectionTitle>
          <ul className="space-y-3">
            {e.gruende.map((g) => (
              <li key={g} className="flex gap-3">
                <Check className="mt-0.5 size-5 shrink-0 text-leaf-600" />
                <span>{g}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex items-start gap-3 rounded-2xl bg-sand-50 p-4 ring-1 ring-line">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-leaf-700" />
            <div>
              <Badge tone={bel.tone}>{bel.label}</Badge>
              <p className="mt-1.5 text-sm text-muted">{e.belastbarkeitText}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {e.datenbasis.map((d) => (
                  <Badge key={d.typ} tone={TYP_TON[d.typ]} title={TRIAL_TYPE_LABEL[d.typ]}>
                    {d.typ}: {d.anzahlErgebnisse} Ergebnisse an {d.anzahlStandorte} Standorten
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Environmentally similar locations */}
        <Card>
          <SectionTitle hint="nach Ähnlichkeit sortiert">Standorte wie deiner</SectionTitle>
          <p className="mb-4 text-sm text-muted">
            Wir suchen Versuche, deren Boden, Regen und Wärme deinem Feld ähneln. Die Entfernung spielt dabei keine Rolle.
          </p>
          <ul className="divide-y divide-line">
            {e.aehnlicheStandorte.map((s) => (
              <li key={s.site.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{s.site.name}</span>
                    <span className="text-sm text-muted">{s.site.gebiet}</span>
                    <Badge tone={TYP_TON[s.site.trialType]} title={TRIAL_TYPE_LABEL[s.site.trialType]}>
                      {s.site.trialType}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm tabular">
                    <span className="h-1.5 w-16 overflow-hidden rounded-full bg-line">
                      <span className="block h-full rounded-full bg-leaf-500" style={{ width: `${Math.round(s.aehnlichkeit * 100)}%` }} />
                    </span>
                    <span className="font-semibold">{Math.round(s.aehnlichkeit * 100)} % ähnlich</span>
                  </div>
                </div>
                <div className="mt-1 text-sm text-muted">
                  {s.gemeinsamkeiten.length > 0 ? s.gemeinsamkeiten.join(", ") : "ähnliche Gesamtumwelt"} · {num(s.distanzKm, 0)} km entfernt
                </div>
              </li>
            ))}
          </ul>
        </Card>

        {/* Eigenschaften */}
        <Card>
          <SectionTitle hint="mehr Punkte = besser">Eigenschaften</SectionTitle>
          <div className="divide-y divide-line">
            <TraitScale label="Trockentoleranz" wert={t.trockentoleranz} />
            <TraitScale label="Standfestigkeit" wert={t.standfestigkeit} />
            <TraitScale label="Jugendentwicklung" wert={t.jugendentwicklung} />
            <TraitScale label="Kältetoleranz" wert={t.kaeltetoleranz} />
            <TraitScale label="Widerstand gegen Stängelfäule" wert={10 - t.staengelfaeule} />
            <TraitScale label="Widerstand gegen Blattkrankheiten" wert={10 - t.blattkrankheiten} />
          </div>
        </Card>

        {/* Entscheidung */}
        <div className="rounded-card bg-leaf-50/90 p-5 ring-1 ring-leaf-200 sm:p-6">
          <NurMit funktion="saatgutKauf">
            {gewaehlt ? (
              <p className="font-semibold">Das ist deine Sorte für 2027. Auf „Mein Hof“ siehst du alle Schläge im Überblick.</p>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <ButtonLink href={`/feld/${field.id}`}>Diese Sorte nehmen</ButtonLink>
                <span className="text-sm text-muted">Führt dich direkt zu deiner Feldübersicht.</span>
              </div>
            )}
            <p className="mt-4 text-sm text-muted">
              Saatgut kannst du direkt über unsere regionale Händler-Vermittlung anfragen. Unser Team stimmt Verfügbarkeit und Konditionen mit deinem Händler ab.
            </p>
          </NurMit>
          <div className="mt-3 flex flex-wrap gap-2">
            <CallTeamButton className={buttonClass("secondary", "sm")}>
              <Phone className="size-4" /> Mit dem Team sprechen
            </CallTeamButton>
            <AskSprossButton frage={`Warum empfiehlst du ${e.variety.name} für mein Feld?`} className={buttonClass("secondary", "sm")}>
              <MessageCircle className="size-4" /> Spross fragen
            </AskSprossButton>
          </div>
        </div>
      </div>
    </>
  );
}
