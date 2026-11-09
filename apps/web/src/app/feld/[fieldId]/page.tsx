import {
  USAGE_LABEL,
  growthStage,
  type Usage,
  type WeatherDay,
} from "@seedle/core";
import {
  ArrowRight,
  CheckCircle2,
  Cloud,
  CloudLightning,
  CloudRain,
  CloudSun,
  Compass,
  Pencil,
  Sun,
} from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
export { generateFieldStaticParams as generateStaticParams } from "@/server/static-params";
import { ManageFieldForm } from "@/components/hof/ManageFieldForm";
import { FieldPreview } from "@/components/map/FieldPreview";
import { PageHeader } from "@/components/shell/PageHeader";
import { AskSprossButton } from "@/components/spross/AskSpross";
import { Badge, FieldStatusBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, SectionTitle } from "@/components/ui/Card";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { datumLang, num } from "@/lib/format";
import { requireField } from "@/server/pages";
import { providers } from "@/server/providers";
import { listFieldYears } from "@/server/services/fields";
import { heuteIso } from "@/server/services/season";

export const metadata: Metadata = { title: "Dein Feld" };

const WETTER_ICON = {
  sonnig: Sun,
  heiter: CloudSun,
  wolkig: Cloud,
  regen: CloudRain,
  gewitter: CloudLightning,
};

export default function FeldPage({ params }: PageProps<"/feld/[fieldId]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Feld params={params} />
    </Suspense>
  );
}

async function Feld({ params }: { params: Promise<{ fieldId: string }> }) {
  const { fieldId } = await params;
  const { field } = await requireField(fieldId);
  const years = await listFieldYears(field.id);
  const year2027 = years.find((y) => y.jahr === 2027);

  const e = field.env;
  const catalog = providers().catalog;
  const allVarieties = catalog.varieties();
  const allBreeders = catalog.breeders();

  // Determine variety selection status
  const isChosen = Boolean(
    field.selectedVarietyId || year2027?.status === "gewaehlt" || year2027?.status === "gekauft",
  );
  const varietyId = field.selectedVarietyId || year2027?.varietyId;
  const variety = varietyId ? (allVarieties.find((v) => v.id === varietyId) ?? null) : null;
  const breeder = variety ? (allBreeders.find((b) => b.id === variety.breederId) ?? null) : null;
  const varietyDisplayName = variety?.name ?? year2027?.varietyText ?? null;

  // Calculate phenology and weather for active simulated date
  const heute = await heuteIso();
  const activeYear = Number.parseInt(heute.slice(0, 4), 10) || field.saison || 2027;
  const aussaat = field.aussaat ? `${activeYear}-${field.aussaat.slice(5)}` : `${activeYear}-04-25`;
  const stadium = growthStage(aussaat, heute);
  const wetter = providers().weather.forecast({ lat: field.lat, lon: field.lon }, heute, 7);
  const todayWeather: WeatherDay | undefined = wetter[0];
  const Icon = todayWeather ? WETTER_ICON[todayWeather.lage] ?? Sun : Sun;

  return (
    <>
      <PageHeader
        back={{ href: "/hof", label: "Mein Hof" }}
        eyebrow={e.region}
        title={field.name}
        aside={
          <div className="flex items-center gap-2">
            <FieldStatusBadge status={field.status} />
            <span className="rounded-full bg-white/85 px-3 py-1 text-sm font-semibold tabular ring-1 ring-line">
              ≈ {num(field.areaHa)} ha
            </span>
          </div>
        }
      />

      <div className="space-y-5">
        <FieldPreview geometry={field.geometry} className="h-56 sm:h-64" />

        {/* Phenology and weather at field */}
        <Card className="p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-line">
            <SectionTitle hint={`Stand: ${datumLang(heute)} · DWD Freising`}>
              Vegetationsstand & Wetter
            </SectionTitle>
            <div className="flex items-center gap-2">
              <Badge tone="leaf">BBCH {stadium.bbch}</Badge>
              <span className="text-xs font-semibold text-muted">Tag {stadium.tageSeitAussaat}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Entwicklungsstadium
              </div>
              <div className="text-lg font-bold text-ink">{stadium.name}</div>
              <div className="mt-2 relative h-2.5 rounded-full bg-line/70">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-leaf-300 to-leaf-600"
                  style={{ width: `${stadium.fortschritt * 100}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[11px] text-muted">
                <span>Aussaat ({activeYear}-04-25)</span>
                <span>Blüte</span>
                <span>Ernte</span>
              </div>
            </div>

            {todayWeather ? (
              <div className="flex items-center gap-4 rounded-xl border border-line bg-sand-50/60 p-3 sm:p-4">
                <Icon className="size-8 text-leaf-700 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold tabular text-ink">{todayWeather.tMaxC} °C</span>
                    <span className="text-xs text-muted tabular">Min: {todayWeather.tMinC} °C</span>
                  </div>
                  <div className="text-xs text-muted capitalize mt-0.5">
                    {todayWeather.lage} · {todayWeather.niederschlagMm} mm Niederschlag
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* 7-day weather mini forecast */}
          <div className="pt-2 border-t border-line">
            <div className="text-xs font-bold uppercase tracking-wider text-muted mb-2">
              7-Tage-Wettervorhersage für diesen Schlag:
            </div>
            <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
              {wetter.map((tag) => {
                const TagIcon = WETTER_ICON[tag.lage] ?? Sun;
                return (
                  <div key={tag.datum} className="rounded-lg bg-white p-1.5 sm:p-2 ring-1 ring-line text-xs">
                    <span className="block font-semibold text-muted text-[10px] sm:text-xs">
                      {tag.datum.slice(8, 10)}.{tag.datum.slice(5, 7)}.
                    </span>
                    <TagIcon className="size-3.5 sm:size-4 mx-auto my-1 text-leaf-700" />
                    <span className="block font-bold text-ink text-[11px] sm:text-xs">{tag.tMaxC}°</span>
                    <span className="block text-[10px] text-muted">{tag.tMinC}°</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Cultivation & variety status */}
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <SectionTitle>Anbau {activeYear} & Sorte</SectionTitle>
            <div className="flex items-center gap-2">
              <FieldStatusBadge status={field.status} />
              {isChosen ? (
                <span className="inline-flex items-center rounded-full bg-status-ok-soft px-2.5 py-0.5 text-xs font-semibold text-status-ok-text ring-1 ring-status-ok-border">
                  {year2027?.status === "gekauft" ? "Saatgut gekauft" : "Sorte gewählt"}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-status-problem-soft px-2.5 py-0.5 text-xs font-semibold text-status-problem-text ring-1 ring-status-problem-border">
                  {varietyDisplayName ? "Sorte geplant" : "Sorte offen"}
                </span>
              )}
            </div>
          </div>

          {isChosen ? (
            /* State: Variety selected or purchased */
            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-status-ok-border bg-status-ok-soft/60 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-status-ok-text mb-1">
                      Gewählte Sorte für 2027
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-ink">
                      {varietyDisplayName}
                    </div>
                    {breeder ? (
                      <div className="text-sm text-muted mt-0.5">Züchter: {breeder.name}</div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1.5 text-status-ok text-sm font-semibold">
                    <CheckCircle2 className="size-5 shrink-0" />
                    <span>Alles im Plan</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-status-ok-border/50 text-sm">
                  <div>
                    <span className="block text-xs text-muted">Nutzung</span>
                    <span className="font-semibold text-ink">
                      {field.usage ? (USAGE_LABEL[field.usage as Usage] ?? field.usage) : "Mais"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted">Reifezahl</span>
                    <span className="font-semibold text-ink">
                      {variety?.reifezahl ? `ca. FAO ${variety.reifezahl}` : "–"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted">Schlagfläche</span>
                    <span className="font-semibold text-ink">{num(field.areaHa)} ha</span>
                  </div>
                </div>

                {variety?.kurzbeschreibung ? (
                  <p className="mt-3 text-xs text-muted leading-relaxed">
                    {variety.kurzbeschreibung}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-3 items-center pt-2">
                <ButtonLink href={`/heute?feld=${field.id}`} variant="primary">
                  Dein Feld heute <ArrowRight className="size-4" />
                </ButtonLink>
                <ButtonLink href={`/feld/${field.id}/ranking`} variant="secondary">
                  Sorten-Ranking erneut aufrufen
                </ButtonLink>
              </div>
            </div>
          ) : (
            /* State: No variety selected yet */
            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-status-problem/30 bg-status-problem-soft/80 p-4 sm:p-5 text-status-problem-text">
                <div className="flex items-center gap-2 mb-2 font-bold text-base">
                  <Compass className="size-5 text-status-problem" />
                  <span>
                    {varietyDisplayName
                      ? `Geplante Sorte: ${varietyDisplayName}`
                      : "Noch keine Sorte für 2027 gewählt"}
                  </span>
                </div>
                <p className="text-sm opacity-95 leading-relaxed">
                  {varietyDisplayName
                    ? `Die Sorte ${varietyDisplayName} ist als Vorzugssorte hinterlegt. Überprüfe im Sorten-Ranking, ob sie unter aktuellen Klimaszenarien und Preisannahmen für deinen Boden optimal abschneidet.`
                    : `Für ${field.name} ist noch keine Sorte festgelegt. Finde mit dem Sortenkompass die ertragsstärkste und trockenstabilste Sorte für deine Boden- und Klimabedingungen.`}
                </p>

                <div className="mt-4">
                  <ButtonLink
                    href={field.usage ? `/feld/${field.id}/ranking` : `/feld/${field.id}/anbau`}
                    variant="primary"
                    className="w-full sm:w-auto shadow-soft"
                  >
                    Zum Sorten-Ranking <ArrowRight className="size-5" />
                  </ButtonLink>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm text-muted pt-2">
                <div>
                  <span className="block text-xs">Kulturart</span>
                  <span className="font-medium text-ink">
                    {field.crop === "mais" ? "Mais" : (field.crop || "Mais")}
                  </span>
                </div>
                <div>
                  <span className="block text-xs">Nutzungsrichtung</span>
                  <span className="font-medium text-ink">
                    {field.usage ? (USAGE_LABEL[field.usage as Usage] ?? field.usage) : "Noch offen"}
                  </span>
                </div>
                <div>
                  <span className="block text-xs">Vorjahr</span>
                  <span className="font-medium text-ink">
                    {field.previousVarietyText || field.previousVarietyId || "Keine Angabe"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Site details */}
        <Card>
          <SectionTitle
            hint={
              <ButtonLink href={`/feld/${field.id}/grenze`} variant="quiet" size="sm">
                <Pencil className="size-4" /> Grenze anpassen
              </ButtonLink>
            }
          >
            So sehen wir deinen Standort
          </SectionTitle>
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 mt-3">
            <Fakt label="Boden" wert={`${e.bodenart}, Ackerzahl ${e.ackerzahl}`} />
            <Fakt
              label="Regen"
              wert={`${num(e.niederschlagJahrMm, 0)} mm im Jahr, ${num(e.niederschlagVegetationMm, 0)} mm von April bis September`}
            />
            <Fakt
              label="Wärme"
              wert={`${num(e.temperaturC)} °C im Mittel, ${num(e.waermesumme, 0)} Gradtage im Sommer`}
            />
            <Fakt label="Höhe" wert={`${num(e.hoeheM, 0)} m über dem Meer`} />
          </dl>
          <p className="mt-5 text-sm text-muted">
            Das ist der Ausgangspunkt für jede Empfehlung. Stimmt etwas nicht?{" "}
            <AskSprossButton
              frage="Zu meinem Standort möchte ich etwas ergänzen."
              className="font-semibold text-leaf-700 hover:underline"
            >
              Erzähl es Spross
            </AskSprossButton>
            , du kennst dein Feld am besten.
          </p>
        </Card>

        {/* Manage field */}
        <Card>
          <SectionTitle>Schlag verwalten</SectionTitle>
          <ManageFieldForm fieldId={field.id} defaultName={field.name} />
        </Card>
      </div>
    </>
  );
}

function Fakt({ label, wert }: { label: string; wert: string }) {
  return (
    <div>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="font-medium text-ink">{wert}</dd>
    </div>
  );
}
