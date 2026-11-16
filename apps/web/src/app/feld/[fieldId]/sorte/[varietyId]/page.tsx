import { TRIAL_TYPE_LABEL, type Usage } from "@seedle/core";
import {
  Check,
  MessageCircle,
  Phone,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
export { generateFieldVarietyStaticParams as generateStaticParams } from "@/server/static-params";
import { TraitScale } from "@/components/charts/TraitScale";
import { DeepAnalysisBackendBridge } from "@/components/daten/DeepAnalysisBackendBridge";
import {
  KitchenTablePrintSheet,
  PrintPdfButton,
} from "@/components/daten/KitchenTablePrintSheet";
import { PageHeader } from "@/components/shell/PageHeader";
import { NurMit } from "@/components/shell/DemoContext";
import { AskSprossButton, CallTeamButton } from "@/components/spross/AskSpross";
import { Badge, DemoBadge } from "@/components/ui/Badge";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import { Card, SectionTitle } from "@/components/ui/Card";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { withBasePath } from "@/lib/basePath";
import { getAgronomyUsageLabel } from "@/lib/fieldAgronomyProfile";
import { num } from "@/lib/format";
import { requireField } from "@/server/pages";
import { explanationFor, recommendationFor } from "@/server/services/recommendations";
import { track } from "@/server/services/tracking";

export const metadata: Metadata = { title: "Agronomische Tiefenanalyse" };

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

export async function Sorte({ params }: { params: Promise<{ fieldId: string; varietyId: string }> }) {
  const { fieldId, varietyId } = await params;
  const { user, field } = await requireField(fieldId);
  const [e, rec] = await Promise.all([
    explanationFor(field, varietyId),
    recommendationFor(field),
  ]);
  const ranked = rec?.sorten.find((s) => s.variety.id === varietyId);
  if (!e || !rec || !ranked) notFound();
  await track(user.id, "erklaerung_angesehen", { fieldId, varietyId, rang: ranked.rang });

  const usage = field.usage as Usage;
  const usageDisplayLabel = getAgronomyUsageLabel(field.usage);
  const gewaehlt = field.selectedVarietyId === e.variety.id;
  const t = e.variety.traits;
  const bel = BELASTBARKEIT[e.belastbarkeit];
  const yieldUnitLabel = usage === "koernermais" ? "dt/ha Kornertrag" : "t TM/ha Silomais";
  const advisorRationaleText = `Auch wenn eine andere Sorte auf dem Papier 1 Note mehr Rohertrag hat: ${e.variety.name} kommt in den LSV-Versuchen deutlich besser mit der Frühsommertrockenheit an deinem Standort (Trockentoleranz BSA ${t.trockentoleranz}/9) klar, bietet hohe Standfestigkeit (BSA ${t.standfestigkeit}/9) und sichert deine Fruchtfolge gegen Fusarium ab.`;

  return (
    <>
      <KitchenTablePrintSheet
        fieldName={field.name}
        fieldAreaHa={field.areaHa}
        region={field.env.region}
        usageLabel={usageDisplayLabel}
        soilSummary={`Bodenart: ${field.env.bodenart} · Standort: ${field.env.region} · Mehrjähriges DWD- & LSV-Profil`}
        portfolioTitle={`Einzelsorten-Analyse: ${e.variety.name}`}
        portfolioItems={[
          {
            sharePercent: 100,
            shareHa: field.areaHa,
            roleLabel: `Platz ${ranked.rang} auf „${field.name}“`,
            name: e.variety.name,
            breederName: e.breeder.name,
            reifezahl: e.variety.reifezahl,
            relErtragProzent: 100 + Math.round(e.mittlererVorsprung),
            advisorRationale: advisorRationaleText,
          },
        ]}
      />

      <PageHeader
        back={{ href: `/feld/${field.id}/ranking`, label: "Ranking" }}
        eyebrow={`Platz ${ranked.rang} von ${rec.sorten.length} auf „${field.name}“`}
        title={e.variety.name}
        lead={e.variety.kurzbeschreibung}
        aside={
          <>
            <Badge tone="sand" data-testid="compact-maturity-badge">
              S {e.variety.reifezahl} · K {e.variety.reifezahl}
            </Badge>
            {e.demodaten ? <DemoBadge /> : null}
            {gewaehlt ? <Badge tone="leaf">Deine Wahl für 2027</Badge> : null}
          </>
        }
      />

      <div className="print:hidden space-y-14">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-y border-divider py-3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-small text-fg-muted">
            <Image
              src={withBasePath(e.breeder.logo)}
              alt={e.breeder.name}
              width={100}
              height={30}
              className="mr-2 h-7 w-auto"
              style={{ width: "auto", height: "auto" }}
            />
            <span className="tabular-nums text-fg">S {e.variety.reifezahl} · K {e.variety.reifezahl}</span>
            <span aria-hidden>·</span>
            <span>in Versuchen seit {e.variety.zulassungsjahr}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <PrintPdfButton />
            <Link
              href={`/feld/${field.id}/kaufen/${e.variety.id}`}
              className={buttonClass("primary", "sm")}
            >
              <ShoppingBag className="size-4" aria-hidden />
              <span>Wo kann ich diese Sorte kaufen?</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-14 lg:grid-cols-12 lg:gap-x-12">
          <div className="space-y-14 lg:col-span-8">
            <DeepAnalysisBackendBridge
              fieldId={field.id}
              fieldLat={field.lat}
              fieldLon={field.lon}
              soilType={field.env.bodenart}
              usage={String(usage)}
              varietyId={e.variety.id}
              varietyName={e.variety.name}
              reifezahl={e.variety.reifezahl}
              trockentoleranz={t.trockentoleranz}
              jugendentwicklung={t.jugendentwicklung}
              kaeltetoleranz={t.kaeltetoleranz}
              defaultAdvisorRationale={advisorRationaleText}
              jahreVorne={e.jahreVorne}
              mittlererVorsprung={e.mittlererVorsprung}
              jahre={e.jahre}
              vergleichQuelle={e.vergleich.quelle}
              vergleichVarietyName={e.vergleich.variety?.name}
              vergleichLabel={e.vergleich.label}
              yieldUnitLabel={yieldUnitLabel}
            />

            {/* 3. Climate scenario forecast 2027 ( strictly agronomic, zero Euro columns ) */}
            <Card>
              <SectionTitle hint="je Klimaszenario in % Relativertrag & dt/ha">
                Agronomische Erwartung für 2027 nach Klimaszenario
              </SectionTitle>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] border-collapse text-small">
                  <thead>
                    <tr className="border-b border-rule text-left text-caption font-semibold text-fg-muted">
                      <th scope="col" className="pb-2.5 pr-4">Szenario</th>
                      <th scope="col" className="pb-2.5 pr-4 text-right">Standort-Rang & Relativ-Index</th>
                      <th scope="col" className="pb-2.5 pr-4 text-right">
                        Ertrag ({usage === "koernermais" ? "dt/ha Korn" : "t TM/ha Silo"})
                      </th>
                      <th scope="col" className="pb-2.5 text-right">
                        {usage === "koernermais" ? "Kornfeuchte" : "Stärkegehalt"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-divider">
                    {rec.scenarios.map((s) => {
                      const p = ranked.predictions.find((x) => x.scenarioId === s.id);
                      const scenarioValues = rec.sorten.map((sv) => {
                        const sp = sv.predictions.find((x) => x.scenarioId === s.id);
                        return (
                          (usage === "koernermais" ? sp?.kornertragDtHa : sp?.trockenmasseDtHa) ?? 0
                        );
                      });
                      const scenarioMean =
                        scenarioValues.reduce((acc, v) => acc + v, 0) /
                        Math.max(scenarioValues.length, 1);
                      const ownVal =
                        (usage === "koernermais" ? p?.kornertragDtHa : p?.trockenmasseDtHa) ?? 0;
                      const relIndex =
                        scenarioMean > 0 ? Math.round((ownVal / scenarioMean) * 100) : 100;
                      const scenRank = ranked.rangJeSzenario[s.id] ?? ranked.rang;
                      const displayYield =
                        usage === "koernermais"
                          ? `${num(ownVal, 1)} dt/ha`
                          : `${num(ownVal / 10, 1)} t TM/ha`;

                      return (
                        <tr key={s.id}>
                          <td className="py-3 pr-4">
                            <span className="font-semibold text-fg">{s.label}</span>{" "}
                            <span className="tabular-nums text-fg-muted">
                              {Math.round(s.wahrscheinlichkeit * 100)} %
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-right text-figure-s tabular-nums text-fg">
                            Platz {scenRank} · {num(relIndex, 0)} %
                          </td>
                          <td className="py-3 pr-4 text-right tabular-nums text-fg">{displayYield}</td>
                          <td className="py-3 text-right tabular-nums text-fg">
                            {num(
                              (usage === "koernermais"
                                ? p?.kornfeuchteProzent
                                : p?.staerkeProzent) ?? 0,
                            )}{" "}
                            %
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Agronomic reasons */}
            <Card>
              <SectionTitle>Warum wir das annehmen</SectionTitle>
              <ul className="max-w-measure space-y-3">
                {e.gruende.map((g) => (
                  <li key={g} className="flex gap-3">
                    <Check className="mt-0.5 size-5 shrink-0 text-link" aria-hidden />
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex max-w-measure items-start gap-3 border-t border-divider pt-4">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-link" aria-hidden />
                <div>
                  <Badge tone={bel.tone}>{bel.label}</Badge>
                  <p className="mt-1.5 text-small text-fg-muted">{e.belastbarkeitText}</p>
                  <div className="mt-2 flex flex-col items-start gap-1 tabular-nums">
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
              <p className="mb-4 max-w-measure text-small text-fg-muted">
                Wir suchen Versuche, deren Boden, Regen und Wärme deinem Feld ähneln. Die Entfernung
                spielt dabei keine Rolle.
              </p>
              <ul className="divide-y divide-divider border-y border-divider">
                {e.aehnlicheStandorte.map((s) => (
                  <li key={s.site.id} className="py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="font-semibold text-fg">{s.site.name}</span>
                        <span className="text-small text-fg-muted">{s.site.gebiet}</span>
                        <Badge
                          tone={TYP_TON[s.site.trialType]}
                          title={TRIAL_TYPE_LABEL[s.site.trialType]}
                        >
                          {s.site.trialType}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-small tabular-nums">
                        <span className="h-1.5 w-16 overflow-hidden bg-data-track">
                          <span
                            className="block h-full bg-data"
                            style={{ width: `${Math.round(s.aehnlichkeit * 100)}%` }}
                          />
                        </span>
                        <span className="font-semibold text-fg">
                          {Math.round(s.aehnlichkeit * 100)} % ähnlich
                        </span>
                      </div>
                    </div>
                    <div className="mt-1 text-small text-fg-muted">
                      {s.gemeinsamkeiten.length > 0
                        ? s.gemeinsamkeiten.join(", ")
                        : "ähnliche Gesamtumwelt"}{" "}
                      · {num(s.distanzKm, 0)} km entfernt
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <aside className="space-y-14 lg:sticky lg:top-6 lg:col-span-4">
            {/* Eigenschaften */}
            <section className="border-t border-rule pt-5">
              <SectionTitle hint="mehr Punkte = besser">Eigenschaften (BSA-Skala 1–9)</SectionTitle>
              <div className="divide-y divide-divider">
                <TraitScale label="Trockentoleranz" wert={t.trockentoleranz} />
                <TraitScale label="Standfestigkeit" wert={t.standfestigkeit} />
                <TraitScale label="Jugendentwicklung" wert={t.jugendentwicklung} />
                <TraitScale label="Kältetoleranz" wert={t.kaeltetoleranz} />
                <TraitScale label="Widerstand gegen Stängelfäule" wert={10 - t.staengelfaeule} />
                <TraitScale
                  label="Widerstand gegen Blattkrankheiten"
                  wert={10 - t.blattkrankheiten}
                />
              </div>
            </section>

            {/* Entscheidung & Where to buy */}
            <section className="space-y-4 border-t border-divider pt-5">
              <div className="space-y-1.5">
                <h2 className="text-subheading text-fg">
                  Bezugsquellen & Saatgut-Verfügbarkeit vor Ort prüfen
                </h2>
                <p className="text-small text-fg-muted">
                  Finde deinen regionalen Agrarhandel (RWA, BayWa, AGRAVIS, HaGe) oder den direkten
                  Züchter-Fachberater für deine PLZ.
                </p>
              </div>
              <ButtonLink href={`/feld/${field.id}/kaufen/${e.variety.id}`}>
                <ShoppingBag className="size-4" aria-hidden />
                <span>Wo kann ich diese Sorte kaufen?</span>
              </ButtonLink>

              <NurMit funktion="saatgutKauf">
                {gewaehlt ? (
                  <p className="font-semibold text-fg">
                    Das ist deine Sorte für 2027. Auf „Mein Hof“ siehst du alle Schläge im Überblick.
                  </p>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <ButtonLink href={`/feld/${field.id}`} variant="secondary">
                      Diese Sorte für meinen Schlag merken
                    </ButtonLink>
                  </div>
                )}
              </NurMit>

              <div className="flex flex-wrap gap-2 border-t border-divider pt-4">
                <CallTeamButton className={buttonClass("secondary", "sm")}>
                  <Phone className="size-4" aria-hidden /> Mit dem Team sprechen
                </CallTeamButton>
                <AskSprossButton
                  frage={`Warum empfiehlst du ${e.variety.name} für mein Feld?`}
                  className={buttonClass("secondary", "sm")}
                >
                  <MessageCircle className="size-4" aria-hidden /> Spross fragen
                </AskSprossButton>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </>
  );
}
