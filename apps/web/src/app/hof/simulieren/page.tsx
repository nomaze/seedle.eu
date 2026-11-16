import { CloudRain, Compass, Dna, LineChart, SunMedium } from "lucide-react";
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

      <div className="space-y-section">
        {/* Main statement */}
        <Card>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-body text-fg-muted">Ganzheitliche Betriebsoptimierung</span>
            <Badge tone="status-action">Vorschau</Badge>
          </div>
          <h2 className="mt-3 max-w-measure text-heading text-fg">
            Der Hof unter verschiedenen Klimaszenarien für das nächste Jahr, mit jedem Schlag optimal gewählt und bewirtschaftet.
          </h2>
          <p className="mt-4 max-w-measure text-body text-fg-muted">
            Wahrscheinliche Preise und eine Monte-Carlo-Simulation kommen später. Hier entsteht das Werkzeug, mit dem du das Risiko deines gesamten Betriebs über alle Schläge und Sorten hinweg steuerst.
          </p>
        </Card>

        {/* Three pillars of farm simulation */}
        <div className="grid grid-cols-1 gap-x-10 gap-y-section md:grid-cols-3">
          <Card className="flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2">
                <SunMedium className="size-5 shrink-0 text-sunshine" aria-hidden />
                <span className="text-small font-semibold text-fg">3 Klimaszenarien</span>
              </div>
              <h3 className="mt-2 text-subheading text-fg">Wetter-Stresstest 2027</h3>
              <p className="mt-1 text-body text-fg-muted">
                Trocken-heiß, normal oder feucht-kühl: Wie verhält sich dein Gesamtertrag, wenn der Sommer 2027 extrem trocken oder nass wird?
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 border-t border-divider pt-3 text-small text-fg-muted">
              <CloudRain className="size-4 text-rain" aria-hidden />
              <span>G×E Prediction NoMaze</span>
            </div>
          </Card>

          <Card className="flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Dna className="size-5 shrink-0 text-link" aria-hidden />
                <span className="text-small font-semibold text-fg">Sorten-Portfolio</span>
              </div>
              <h3 className="mt-2 text-subheading text-fg">Schlagübergreifender Mix</h3>
              <p className="mt-1 text-body text-fg-muted">
                Jeder Schlag bekommt die Genetik, die zu seinem Boden passt. Risikostreuung über Reifegruppen hinweg statt Monokultur.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 border-t border-divider pt-3 text-small text-fg-muted">
              <Compass className="size-4 text-link" aria-hidden />
              <span>{felder.length} Schläge im Betrieb</span>
            </div>
          </Card>

          <Card className="flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2">
                <LineChart className="size-5 shrink-0 text-link" aria-hidden />
                <span className="text-small font-semibold text-fg">Monte-Carlo & Preise</span>
              </div>
              <h3 className="mt-2 text-subheading text-fg">Stochastische Absicherung</h3>
              <p className="mt-1 text-body text-fg-muted">
                10.000 simulierte Ernte- und Preisverläufe (Erzeugerpreise, Trocknungskosten, Saatgut) zur Absicherung des Deckungsbeitrags.
              </p>
            </div>
            <div className="mt-4 border-t border-divider pt-3 text-small font-medium text-fg-muted">
              Kommt in Version 2.0
            </div>
          </Card>
        </div>

        {/* Farm parcels in simulation */}
        <Card>
          <SectionTitle hint={<span className="tabular-nums">{felder.length} Schläge · {num(totalHa)} ha</span>}>
            Deine Schläge in der Simulation
          </SectionTitle>

          {felder.length === 0 ? (
            <div className="border-t border-rule py-6 text-fg-muted">
              <p>Noch keine Schläge angelegt.</p>
              <ButtonLink href="/feld/neu" variant="secondary" size="sm" className="mt-3">
                Ersten Schlag anlegen
              </ButtonLink>
            </div>
          ) : (
            <ul className="border-t border-rule">
              {felder.map((f) => {
                const sName = f.selectedVarietyId ? sorten.get(f.selectedVarietyId) : undefined;
                return (
                  <li
                    key={f.id}
                    className={`flex flex-wrap items-center justify-between gap-3 border-b border-divider py-3.5 ${
                      f.status === "status-urgent" ? "-mx-3 bg-status-urgent-soft px-3" : ""
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="font-semibold text-fg">{f.name}</span>
                        <FieldStatusBadge status={f.status} />
                      </div>
                      <div className="text-small text-fg-muted">
                        {num(f.areaHa)} ha · {f.env?.region ?? "Region"} · {f.crop === "mais" ? "Mais" : (f.crop || "Mais")}
                        {sName ? ` · Sorte: ${sName}` : " · noch keine Sorte gewählt"}
                      </div>
                    </div>
                    <Link
                      href={`/feld/${f.id}`}
                      className="inline-flex min-h-touch items-center text-small font-semibold text-link hover:underline"
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
        <Card>
          <SectionTitle>Möchtest du die Simulation vorab mitgestalten?</SectionTitle>
          <p className="max-w-measure text-body text-fg-muted">
            Wir entwickeln das Simulationsmodell gemeinsam mit innovativen Landwirten. Erzähle Spross von deinen Anforderungen oder sprich direkt mit unserem Agrar-Team.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
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
