import {
  KNOWLEDGE_TOPIC_LABEL,
  USAGE_LABEL,
  growthStage,
  type KnowledgeTopic,
  type Usage,
} from "@seedle/core";
import { ArrowRight, Plus, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EditFarmForm } from "@/components/hof/EditFarmForm";
import { HofActionPanel } from "@/components/hof/HofActionPanel";
import { HofMap } from "@/components/map/HofMap";
import { PageHeader } from "@/components/shell/PageHeader";
import { AskSprossButton } from "@/components/spross/AskSpross";
import { Badge, FieldStatusBadge } from "@/components/ui/Badge";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import { Card, SectionTitle } from "@/components/ui/Card";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { MARKEN_INFO } from "@/lib/demo";
import { num } from "@/lib/format";
import { demoEinstellungen } from "@/server/demo";
import { providers } from "@/server/providers";
import { currentUser, type CurrentUser } from "@/server/session";
import { DEMO_USER_EMAIL, DEMO_USER_ID, DEMO_USER_NAME } from "@/server/services/demo-state";
import { getOrCreateFarm, listFields, listFieldYears } from "@/server/services/fields";
import { factsFor } from "@/server/services/knowledge";

export const metadata: Metadata = { title: "Mein Hof" };

export default async function HofPage() {
  const rawUser = await currentUser();
  const user: CurrentUser = rawUser.emailVerified
    ? rawUser
    : {
        id: DEMO_USER_ID,
        name: rawUser.name || DEMO_USER_NAME,
        email: rawUser.email || DEMO_USER_EMAIL,
        emailVerified: true,
        telefon: rawUser.telefon,
      };

  return (
    <Suspense fallback={<PageSkeleton />}>
      <Hof user={user} />
    </Suspense>
  );
}

async function Hof({ user }: { user: CurrentUser }) {
  const [felder, wissen, demo, farm] = await Promise.all([
    listFields(user.id),
    factsFor(user.id),
    demoEinstellungen(),
    getOrCreateFarm(user.id),
  ]);

  // Load cultivation years for all fields
  const fieldYearsList = await Promise.all(felder.map((f) => listFieldYears(f.id)));
  const fieldYearsByField = new Map(felder.map((f, i) => [f.id, fieldYearsList[i] ?? []]));

  const sorten = new Map(providers().catalog.varieties().map((v) => [v.id, v.name]));
  const totalHa = felder.reduce((acc, f) => acc + (f.areaHa || 0), 0);
  const activeYear = Number.parseInt(demo.datum?.slice(0, 4) ?? "2025", 10) || 2025;

  const nachThema = new Map<string, typeof wissen>();
  for (const w of wissen) nachThema.set(w.topic, [...(nachThema.get(w.topic) ?? []), w]);

  return (
    <div className="seite-breit space-y-6">
      <PageHeader
        back={{ href: "/", label: "Startseite" }}
        eyebrow={farm.ort ? `${farm.name} · ${farm.ort}` : farm.name}
        title="Mein Hof"
      />

      {/* 2-column layout on desktop: Map & Action Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
          <Card className="flex-1 flex flex-col p-4 sm:p-5">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-line">
              <SectionTitle hint={felder.length > 0 ? `${felder.length} Schläge · ${num(totalHa)} ha` : undefined}>
                Hof & Schläge auf der Karte
              </SectionTitle>
            </div>
            <HofMap
              farm={farm}
              fields={felder}
              className="flex-1 min-h-[360px] sm:min-h-[420px] lg:min-h-[460px]"
            />
          </Card>
        </div>

        <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
          <HofActionPanel
            fields={felder}
            farmName={farm.name}
            varieties={sorten}
            className="min-h-[360px] sm:min-h-[420px] lg:min-h-[460px]"
          />
        </div>
      </div>

      {/* Field overview section below map */}
      <Card>
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <SectionTitle hint={`${felder.length} ${felder.length === 1 ? "Schlag" : "Schläge"} · ${num(totalHa)} ha`}>
            Zu meinen Feldern
          </SectionTitle>
          <ButtonLink href="/feld/neu" variant="secondary" size="sm">
            <Plus className="size-4" /> Schlag anlegen
          </ButtonLink>
        </div>

        {felder.length === 0 ? (
          <div className="py-8 text-center text-muted">
            <p>Noch kein Schlag angelegt.</p>
            <ButtonLink href="/feld/neu" variant="primary" size="sm" className="mt-3">
              <Plus className="size-4" /> Ersten Schlag hinzufügen
            </ButtonLink>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {felder.map((f) => {
              const years = fieldYearsByField.get(f.id) ?? [];
              const y2027 = years.find((y) => y.jahr === 2027);

              const varietyId = f.selectedVarietyId || y2027?.varietyId;
              const varietyName = varietyId ? sorten.get(varietyId) : y2027?.varietyText;
              const isChosen = Boolean(
                f.selectedVarietyId || y2027?.status === "gewaehlt" || y2027?.status === "gekauft",
              );
              const isPlanned = Boolean(!isChosen && (y2027?.varietyId || y2027?.varietyText));

              const kulturText = f.crop === "mais" ? "Mais" : (f.crop || "Mais");
              const nutzungText = f.usage ? (USAGE_LABEL[f.usage as Usage] ?? f.usage) : "";
              const kulturNutzung = nutzungText ? `${kulturText} (${nutzungText})` : kulturText;

              const aussaat = f.aussaat ? `${activeYear}-${f.aussaat.slice(5)}` : `${activeYear}-04-25`;
              const stadium = growthStage(aussaat, demo.datum ?? "2025-07-15");

              return (
                <li key={f.id}>
                  <Link
                    href={`/feld/${f.id}`}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 hover:bg-sand-50/70 -mx-4 sm:-mx-6 px-4 sm:px-6 transition"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-ink group-hover:text-leaf-800 transition text-base">
                          {f.name}
                        </span>
                        <FieldStatusBadge status={f.status} />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                        <span className="font-medium text-ink">{num(f.areaHa)} ha</span>
                        <span>·</span>
                        <span>{kulturNutzung}</span>
                        <span>·</span>
                        <span>
                          {isChosen && varietyName ? (
                            <span className="text-leaf-800 font-semibold">
                              Sorte: {varietyName} (gewählt) · BBCH {stadium.bbch} ({stadium.name})
                            </span>
                          ) : isPlanned && varietyName ? (
                            <span className="text-status-action-text font-semibold">
                              Sorte: {varietyName} (geplant)
                            </span>
                          ) : f.previousVarietyText ? (
                            <span>
                              Vorjahr: {f.previousVarietyText} ·{" "}
                              <span className="text-status-problem-text font-medium">
                                keine Sorte 2027
                              </span>
                            </span>
                          ) : (
                            <span className="text-status-problem-text font-medium">
                              Noch keine Sorte gewählt
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-leaf-600 self-end sm:self-center shrink-0">
                      <span className="text-xs font-semibold group-hover:underline">
                        Schlagdetails
                      </span>
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* Prominenter Link: „Meinen Hof simulieren“ */}
      <Link
        href="/hof/simulieren"
        className="flex items-center gap-4 rounded-card border-2 border-leaf-300 bg-gradient-to-r from-leaf-50/90 via-white to-sand-50 p-5 shadow-soft transition hover:border-leaf-600 hover:shadow-lift"
      >
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-leaf-700 text-white shadow-soft">
          <Sparkles className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-leaf-950 text-base">Meinen Hof simulieren</span>
            <span className="inline-flex items-center rounded-full bg-status-action-soft px-2.5 py-0.5 text-xs font-semibold text-status-action-text ring-1 ring-status-action-border">
              Neu / Vorschau
            </span>
          </div>
          <span className="block text-sm text-muted mt-0.5">
            Der Hof unter verschiedenen Klimaszenarien für das nächste Jahr, mit jedem Schlag optimal gewählt und bewirtschaftet.
          </span>
        </div>
        <ArrowRight className="size-5 shrink-0 text-leaf-600" />
      </Link>

      {/* Betrieb & Hofstelle */}
      <Card>
        <SectionTitle>Betrieb & Hofstelle</SectionTitle>
        <div className="space-y-3">
          <div>
            <div className="font-medium text-ink">{farm.name}</div>
            <div className="text-sm text-muted">
              {farm.strasse || farm.plz || farm.ort ? (
                <>
                  {[farm.strasse, [farm.plz, farm.ort].filter(Boolean).join(" ")].filter(Boolean).join(", ")}
                  {farm.lat && farm.lon ? ` · (${num(farm.lat, 4)}° N, ${num(farm.lon, 4)}° E)` : ""}
                </>
              ) : (
                "Noch keine Adresse hinterlegt."
              )}
            </div>
          </div>

          <details className="text-sm">
            <summary className="cursor-pointer font-medium text-leaf-700 hover:underline">
              Betriebsdaten bearbeiten
            </summary>
            <EditFarmForm farm={farm} />
          </details>
        </div>
      </Card>

      {/* What Spross knows about your farm */}
      <Card>
        <SectionTitle hint={wissen.length > 0 ? `${wissen.length} Angaben` : undefined}>
          {demo.spross ? "Was Spross über deinen Hof weiß" : "Was wir über deinen Hof wissen"}
        </SectionTitle>
        {wissen.length === 0 ? (
          <p className="text-muted">
            {demo.spross
              ? "Noch nichts. Erzähl Spross von deinem Feld: Was stand dort, was lief gut, was nicht?"
              : "Noch nichts."}
          </p>
        ) : (
          <div className="space-y-4">
            {[...nachThema.entries()].map(([thema, eintraege]) => (
              <div key={thema}>
                <div className="text-sm font-semibold text-leaf-700">
                  {KNOWLEDGE_TOPIC_LABEL[thema as KnowledgeTopic] ?? thema}
                </div>
                <ul className="mt-1 space-y-1">
                  {eintraege.map((w) => (
                    <li key={w.id} className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                      <span>
                        {w.jahr ? <span className="font-medium">{w.jahr}: </span> : null}
                        {w.text}
                      </span>
                      <span className="text-xs text-muted">
                        {w.source === "spross" ? "im Gespräch" : "eingetragen"} · {w.createdAt.toLocaleDateString("de-DE")}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        <AskSprossButton className={`${buttonClass("secondary", "sm")} mt-4`}>
          Spross etwas erzählen
        </AskSprossButton>
        <p className="mt-4 text-xs text-muted">
          Deine Angaben gehen an NoMaze und machen die Empfehlungen für dich und andere Betriebe genauer. Für dich bleibt {MARKEN_INFO[demo.marke].name} kostenlos.
        </p>
      </Card>

      {/* Konto */}
      <Card>
        <SectionTitle>Konto</SectionTitle>
        {user.email ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{user.name ? `${user.name} · ${user.email}` : user.email}</span>
            <Badge tone="leaf">bestätigt</Badge>
          </div>
        ) : (
          <p className="text-muted">
            Mit deiner E-Mail findest du deine Felder auf jedem Gerät wieder. Kein Passwort, nur ein Code.
          </p>
        )}
        <div className="mt-4">
          <ButtonLink href="/anmelden" variant="quiet" size="sm">
            Abmelden
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
}
