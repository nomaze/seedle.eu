import {
  KNOWLEDGE_TOPIC_LABEL,
  USAGE_LABEL,
  growthStage,
  type KnowledgeTopic,
  type Usage,
} from "@seedle/core";
import { ArrowRight, Plus } from "lucide-react";
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
import { Feldumriss } from "@/components/ui/Feldumriss";
import { Kennzahl } from "@/components/ui/Kennzahl";
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

export async function Hof({ user }: { user: CurrentUser }) {
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
    <div className="space-y-section">
      <PageHeader
        back={{ href: "/", label: "Startseite" }}
        eyebrow={farm.ort ? `${farm.name} · ${farm.ort}` : farm.name}
        title="Mein Hof"
        aside={
          <>
            {felder.length > 0 ? (
              <>
                <Kennzahl groesse="l" wert={felder.length} label={felder.length === 1 ? "Schlag" : "Schläge"} />
                <Kennzahl groesse="l" wert={num(totalHa)} label="Hektar" />
              </>
            ) : null}
            <ButtonLink href="/feld/neu" variant="secondary" size="sm">
              <Plus className="size-4" aria-hidden /> Schlag anlegen
            </ButtonLink>
          </>
        }
      />

      {/* 2-column layout on desktop: aerial map & what to do */}
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7 xl:col-span-8">
          <HofMap
            farm={farm}
            fields={felder}
            className="h-[400px] sm:h-[460px] lg:h-[560px]"
          />

          {/* Prominent "Aktuelles" card directly underneath the farm map for whole-farm (100 ha) 2027 recommendation */}
          {felder.length > 0 ? (
            <section
              data-testid="hof-aktuelles-card"
              aria-labelledby="hof-aktuelles-heading"
              className="rounded-panel border-2 border-selected bg-highlight p-5 sm:p-6 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-caption font-bold text-link">
                  Aktuelles · Anbauplanung 2027
                </span>
                <Badge tone="leaf">{num(totalHa)} ha Gesamtfläche</Badge>
              </div>
              <h2 id="hof-aktuelles-heading" className="text-heading text-fg">
                Sortenempfehlung für 2027 steht noch aus
              </h2>
              <p className="max-w-measure text-body text-fg-muted">
                Für deine <strong className="text-fg tabular-nums">{felder.length} Schläge</strong>{" "}
                mit insgesamt <strong className="text-fg tabular-nums">{num(totalHa)} ha Gesamtfläche</strong>{" "}
                steht die Sortenauswahl für die Saison 2027 an. Berechne jetzt deine Sortenverteilung
                und den Saatgutbedarf für deinen gesamten Betrieb.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <ButtonLink
                  href={`/feld/${felder[0]!.id}/anbau?scope=farm&totalHa=${Math.round(totalHa * 10) / 10}&fieldsCount=${felder.length}`}
                  data-testid="hof-start-2027-recommendation-btn"
                  variant="primary"
                >
                  <span>Sortenempfehlung 2027 für alle {num(totalHa)} ha starten</span>
                  <ArrowRight className="size-4" aria-hidden="true" />
                </ButtonLink>
                <ButtonLink
                  href={`/feld/${felder[0]!.id}/ranking?scope=farm&totalHa=${Math.round(totalHa * 10) / 10}&fieldsCount=${felder.length}&usage=silomais`}
                  data-testid="hof-direct-2027-ranking-btn"
                  variant="secondary"
                >
                  <span>Direkt zum Mais-Sortenvergleich ({num(totalHa)} ha)</span>
                </ButtonLink>
              </div>
            </section>
          ) : null}
        </div>

        <div className="lg:col-span-5 xl:col-span-4">
          <HofActionPanel fields={felder} farmName={farm.name} varieties={sorten} />
        </div>
      </div>

      {/* Fields as a table: outline, area, crop, variety 2027, stage, status */}
      <section aria-labelledby="schlaege" className="pt-4">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 id="schlaege" className="text-heading text-fg">
            Zu meinen Feldern
          </h2>
        </div>

        {felder.length === 0 ? (
          <div className="border-t border-rule py-8 text-fg-muted">
            <p>Noch kein Schlag angelegt.</p>
            <ButtonLink href="/feld/neu" variant="primary" size="sm" className="mt-3">
              <Plus className="size-4" aria-hidden /> Ersten Schlag hinzufügen
            </ButtonLink>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-[0.9375rem]">
            <thead>
              <tr className="border-b border-rule text-left">
                <th scope="col" className="text-caption font-semibold text-fg-muted pb-2.5 pr-4">Schlag</th>
                <th scope="col" className="text-caption font-semibold text-fg-muted pb-2.5 pr-4 text-right">ha</th>
                <th scope="col" className="text-caption font-semibold text-fg-muted pb-2.5 pr-4">Kultur</th>
                <th scope="col" className="text-caption font-semibold text-fg-muted pb-2.5 pr-4">Sorte 2027</th>
                <th scope="col" className="text-caption font-semibold text-fg-muted pb-2.5 pr-4 text-right">BBCH</th>
                <th scope="col" className="text-caption font-semibold text-fg-muted pb-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
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
              const nutzungText = f.usage
                ? USAGE_LABEL[f.usage as Usage] ??
                  (f.usage === "biogas" || f.usage === "biogasmais" ? "Biogasmais" : f.usage)
                : "";
              const kulturNutzung = nutzungText ? `${kulturText} (${nutzungText})` : kulturText;

              const aussaat = f.aussaat ? `${activeYear}-${f.aussaat.slice(5)}` : `${activeYear}-04-25`;
              const stadium = growthStage(aussaat, demo.datum ?? "2025-07-15");

              const urgent = f.status === "status-urgent";
              return (
                <tr key={f.id} className={`border-b border-divider ${urgent ? "bg-status-urgent-soft" : ""}`}>
                  <td className="py-3.5 pr-4">
                    <Link
                      href={`/feld/${f.id}`}
                      className="inline-flex items-center gap-2.5 font-bold text-fg hover:text-link"
                    >
                      <Feldumriss geometry={f.geometry} size={24} strokeWidth={2} />
                      {f.name}
                    </Link>
                  </td>
                  <td className="text-figure-s tabular-nums py-3.5 pr-4 text-right">{num(f.areaHa)}</td>
                  <td className="py-3.5 pr-4">{kulturNutzung}</td>
                  <td className="py-3.5 pr-4">
                    {isChosen && varietyName ? (
                      <span className="font-semibold">{varietyName}</span>
                    ) : isPlanned && varietyName ? (
                      <span>
                        {varietyName} <span className="text-fg-muted">(geplant)</span>
                      </span>
                    ) : (
                      <span className="text-fg-muted">
                        noch offen{f.previousVarietyText ? ` · Vorjahr ${f.previousVarietyText}` : ""}
                      </span>
                    )}
                  </td>
                  <td className="text-figure-s tabular-nums py-3.5 pr-4 text-right" title={stadium.name}>
                    {stadium.bbch}
                  </td>
                  <td className="py-3.5">
                    <FieldStatusBadge status={f.status} />
                  </td>
                </tr>
              );
            })}
            </tbody>
            <tfoot>
              <tr>
                <td className="pt-3 pr-4 text-small text-fg-muted">Summe</td>
                <td className="text-figure-s tabular-nums pt-3 pr-4 text-right font-bold">{num(totalHa)}</td>
                <td colSpan={4} />
              </tr>
            </tfoot>
          </table>
          </div>
        )}
      </section>

      {/* Link to the farm simulation: one flat row */}
      <Link
        href="/hof/simulieren"
        className="group flex items-center gap-4 border-y border-divider py-5 transition-colors hover:bg-highlight"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-heading text-fg">Meinen Hof simulieren</span>
            <Badge tone="neutral">Vorschau</Badge>
          </div>
          <span className="mt-1 block text-fg-muted">
            Der Hof unter verschiedenen Klimaszenarien für das nächste Jahr, mit jedem Schlag optimal gewählt und bewirtschaftet.
          </span>
        </div>
        <ArrowRight className="size-5 shrink-0 text-link transition-transform group-hover:translate-x-0.5" aria-hidden />
      </Link>

      {/* Betrieb & Hofstelle */}
      <Card>
        <SectionTitle>Betrieb & Hofstelle</SectionTitle>
        <div className="space-y-3">
          <div>
            <div className="font-medium text-fg">{farm.name}</div>
            <div className="text-small text-fg-muted">
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

          <details className="text-small">
            <summary className="cursor-pointer font-medium text-link hover:underline">
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
          <p className="text-fg-muted">
            {demo.spross
              ? "Noch nichts. Erzähl Spross von deinem Feld: Was stand dort, was lief gut, was nicht?"
              : "Noch nichts."}
          </p>
        ) : (
          <div className="space-y-4">
            {[...nachThema.entries()].map(([thema, eintraege]) => (
              <div key={thema}>
                <div className="text-small font-semibold text-link">
                  {KNOWLEDGE_TOPIC_LABEL[thema as KnowledgeTopic] ?? thema}
                </div>
                <ul className="mt-1 space-y-1">
                  {eintraege.map((w) => (
                    <li key={w.id} className="flex flex-wrap items-baseline justify-between gap-x-3 text-small">
                      <span>
                        {w.jahr ? <span className="font-medium">{w.jahr}: </span> : null}
                        {w.text}
                      </span>
                      <span className="text-caption text-fg-muted">
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
        <p className="mt-4 text-caption text-fg-muted">
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
          <p className="text-fg-muted">
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
