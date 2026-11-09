import { CloudRain, Compass, Dna, LineChart, Sparkles, SunMedium } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { AskSprossButton } from "@/components/spross/AskSpross";
import { Badge, FieldStatusBadge } from "@/components/ui/Badge";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import { Card, SectionTitle } from "@/components/ui/Card";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { num } from "@/lib/format";
import { providers } from "@/server/providers";
import { currentUser } from "@/server/session";
import { DEMO_USER_ID } from "@/server/services/demo-state";
import { getOrCreateFarm, listFields } from "@/server/services/fields";

export const metadata: Metadata = {
  title: "Meinen Hof simulieren",
  description:
    "Der Hof unter verschiedenen Klimaszenarien für das nächste Jahr, mit jedem Schlag optimal gewählt und bewirtschaftet.",
};

export default function HofSimulierenPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <HofSimulieren />
    </Suspense>
  );
}

async function HofSimulieren() {
  const rawUser = await currentUser();
  const effectiveUserId = rawUser.emailVerified ? rawUser.id : DEMO_USER_ID;

  const [farm, felder] = await Promise.all([
    getOrCreateFarm(effectiveUserId),
    listFields(effectiveUserId),
  ]);

  const totalHa = felder.reduce((acc, f) => acc + (f.areaHa || 0), 0);
  const sorten = new Map(providers().catalog.varieties().map((v) => [v.id, v.name]));

  return (
    <>
      <PageHeader
        back={{ href: "/hof", label: "Mein Hof" }}
        eyebrow={farm.name}
        title="Meinen Hof simulieren"
        aside={<Badge tone="sand">Konzept / In Entwicklung</Badge>}
      />

      <div className="space-y-6">
        {/* Main concept card */}
        <Card className="border-2 border-leaf-300 bg-gradient-to-br from-leaf-50/70 via-white to-sand-50 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-leaf-700 text-white shadow-soft">
              <Sparkles className="size-6" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-leaf-800">
                  Ganzheitliche Betriebsoptimierung
                </span>
                <span className="inline-flex items-center rounded-full bg-status-action-soft px-2.5 py-0.5 text-xs font-semibold text-status-action-text ring-1 ring-status-action-border">
                  Vorschau
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-leaf-950 leading-tight">
                Der Hof unter verschiedenen Klimaszenarien für das nächste Jahr, mit jedem Schlag optimal gewählt und bewirtschaftet.
              </h2>
              <p className="text-muted leading-relaxed">
                Wahrscheinliche Preise und eine Monte-Carlo-Simulation kommen später. Hier entsteht das Werkzeug, mit dem du das Risiko deines gesamten Betriebs über alle Schläge und Sorten hinweg steuerst.
              </p>
            </div>
          </div>
        </Card>

        {/* Three pillars of farm simulation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-status-problem">
                <SunMedium className="size-5 shrink-0" />
                <span className="font-semibold text-sm text-ink">3 Klimaszenarien</span>
              </div>
              <h3 className="mt-2 font-bold text-base">Wetter-Stresstest 2027</h3>
              <p className="mt-1 text-sm text-muted">
                Trocken-heiß, normal oder feucht-kühl: Wie verhält sich dein Gesamtertrag, wenn der Sommer 2027 extrem trocken oder nass wird?
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-line text-xs text-muted flex items-center gap-1.5">
              <CloudRain className="size-4 text-leaf-600" />
              <span>G×E Prediction NoMaze</span>
            </div>
          </Card>

          <Card className="flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-status-action">
                <Dna className="size-5 shrink-0" />
                <span className="font-semibold text-sm text-ink">Sorten-Portfolio</span>
              </div>
              <h3 className="mt-2 font-bold text-base">Schlagübergreifender Mix</h3>
              <p className="mt-1 text-sm text-muted">
                Jeder Schlag bekommt die Genetik, die zu seinem Boden passt. Risikostreuung über Reifegruppen hinweg statt Monokultur.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-line text-xs text-muted flex items-center gap-1.5">
              <Compass className="size-4 text-leaf-600" />
              <span>{felder.length} Schläge im Betrieb</span>
            </div>
          </Card>

          <Card className="flex flex-col justify-between bg-sand-50/50">
            <div>
              <div className="flex items-center gap-2 text-muted">
                <LineChart className="size-5 shrink-0" />
                <span className="font-semibold text-sm text-ink">Monte-Carlo & Preise</span>
              </div>
              <h3 className="mt-2 font-bold text-base">Stochastische Absicherung</h3>
              <p className="mt-1 text-sm text-muted">
                10.000 simulierte Ernte- und Preisverläufe (Erzeugerpreise, Trocknungskosten, Saatgut) zur Absicherung des Deckungsbeitrags.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-line text-xs text-muted font-medium">
              Kommt in Version 2.0
            </div>
          </Card>
        </div>

        {/* Farm parcels in simulation */}
        <Card>
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <SectionTitle>Deine Schläge in der Simulation</SectionTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sand-100 text-ink">
                {felder.length} Schläge · {num(totalHa)} ha
              </span>
            </div>
          </div>

          {felder.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted">
              <p>Noch keine Schläge angelegt.</p>
              <ButtonLink href="/feld/neu" variant="secondary" size="sm" className="mt-3">
                Ersten Schlag anlegen
              </ButtonLink>
            </div>
          ) : (
            <ul className="divide-y divide-line mt-2">
              {felder.map((f) => {
                const sName = f.selectedVarietyId ? sorten.get(f.selectedVarietyId) : undefined;
                return (
                  <li key={f.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink">{f.name}</span>
                        <FieldStatusBadge status={f.status} />
                      </div>
                      <div className="text-xs text-muted">
                        {num(f.areaHa)} ha · {f.env?.region ?? "Region"} · {f.crop === "mais" ? "Mais" : (f.crop || "Mais")}
                        {sName ? ` · Sorte: ${sName}` : " · noch keine Sorte gewählt"}
                      </div>
                    </div>
                    <Link
                      href={`/feld/${f.id}`}
                      className="text-xs font-semibold text-leaf-700 hover:underline"
                    >
                      Schlag ansehen →
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Team contact / Spross */}
        <Card className="bg-sand-50/70 border-dashed">
          <SectionTitle>Möchtest du die Simulation vorab mitgestalten?</SectionTitle>
          <p className="text-sm text-muted leading-relaxed">
            Wir entwickeln das Simulationsmodell gemeinsam mit innovativen Landwirten. Erzähle Spross von deinen Anforderungen oder sprich direkt mit unserem Agrar-Team.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 items-center">
            <AskSprossButton
              frage="Ich möchte mehr über die Hof-Simulation und Monte-Carlo-Szenarien erfahren."
              className={buttonClass("secondary", "sm")}
            >
              Spross fragen
            </AskSprossButton>
            <ButtonLink href="/hof" variant="quiet" size="sm">
              ‹ Zurück zu Mein Hof
            </ButtonLink>
          </div>
        </Card>
      </div>
    </>
  );
}
