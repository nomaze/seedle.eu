import {
  USAGE_LABEL,
  growthStage,
  type Usage,
  type WeatherDay,
} from "@seedle/core";
import {
  ArrowRight,
  Cloud,
  CloudLightning,
  CloudRain,
  CloudSun,
  Pencil,
  Sun,
} from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
export { generateFieldStaticParams as generateStaticParams } from "@/server/static-params";
import { ManageFieldForm } from "@/components/hof/ManageFieldForm";
import { FieldPreview } from "@/components/map/FieldPreview";
import { NurMit } from "@/components/shell/DemoContext";
import { PageHeader } from "@/components/shell/PageHeader";
import { AskSprossButton } from "@/components/spross/AskSpross";
import { FieldStatusBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Kennzahl, KennzahlLeiste } from "@/components/ui/Kennzahl";
import { StatusMarker } from "@/components/ui/StatusMarker";
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

  const aussaatDatum = new Date(`${aussaat}T12:00:00`).toLocaleDateString("de-DE", { day: "numeric", month: "long" });
  const nutzungLabel = field.usage
    ? USAGE_LABEL[field.usage as Usage] ??
      (field.usage === "biogas" || field.usage === "biogasmais" ? "Biogasmais" : field.usage)
    : null;

  return (
    <div>
      <PageHeader
        back={{ href: "/hof", label: "Mein Hof" }}
        eyebrow={`${e.region} · ${num(field.areaHa)} ha${nutzungLabel ? ` · ${nutzungLabel}` : ""}`}
        title={field.name}
        aside={
          <>
            <FieldStatusBadge status={field.status} />
            <ButtonLink href={`/feld/${field.id}/grenze`} variant="quiet" size="sm">
              <Pencil className="size-4" aria-hidden /> Grenze anpassen
            </ButtonLink>
          </>
        }
      />

      <FieldPreview geometry={field.geometry} className="h-64 sm:h-80 lg:h-[420px]" />

      <div className="mt-10 space-y-14">
        {/* Key figures: stage, days since sowing, today's weather */}
        <KennzahlLeiste>
          <Kennzahl wert={stadium.bbch} label={`BBCH, ${stadium.name}`} />
          <Kennzahl wert={stadium.tageSeitAussaat} label={`Tage seit Aussaat am ${aussaatDatum}`} />
          {todayWeather ? (
            <Kennzahl wert={num(todayWeather.tMaxC)} einheit=" °C" label={`Heute, nachts ${num(todayWeather.tMinC)} °C`} />
          ) : null}
          {todayWeather ? (
            <Kennzahl
              wert={num(todayWeather.niederschlagMm)}
              einheit=" mm"
              label="Regen heute"
              wertClassName={todayWeather.niederschlagMm > 0 ? "text-rain" : ""}
            />
          ) : null}
        </KennzahlLeiste>

        {/* Season line: sowing to harvest, today marked */}
        <section aria-labelledby="saison">
          <SectionTitle hint={`Stand: ${datumLang(heute)}`}>
            <span id="saison">Saison {activeYear}</span>
          </SectionTitle>
          <div className="mt-6 px-1.5">
            <div className="relative h-0.5 bg-data-track">
              <div className="absolute inset-y-0 left-0 bg-action" style={{ width: `${stadium.fortschritt * 100}%` }} />
              <span
                aria-hidden
                className="absolute -top-[7px] -ml-2 size-4 rounded-full border-[3px] border-canvas bg-action"
                style={{ left: `${stadium.fortschritt * 100}%` }}
              />
            </div>
            <div className="mt-3 flex justify-between gap-4 text-[13px] text-fg-muted">
              <span>
                Aussaat
                <br />
                {aussaatDatum}
              </span>
              <span className="text-center font-semibold text-fg">
                {stadium.name}
                <br />
                heute
              </span>
              <span className="text-right">
                Ernte
                <br />
                Herbst
              </span>
            </div>
          </div>
        </section>

        {/* 7-day forecast for this field */}
        <section aria-labelledby="wetter">
          <SectionTitle hint="Deutscher Wetterdienst, Station Freising">
            <span id="wetter">Wetter für diesen Schlag</span>
          </SectionTitle>
          <div className="overflow-x-auto">
            <ol className="grid min-w-[700px] grid-cols-7 border-t border-rule">
              {wetter.map((tag, i) => {
                const TagIcon = WETTER_ICON[tag.lage] ?? Sun;
                const nass = tag.lage === "regen" || tag.lage === "gewitter" || tag.niederschlagMm > 0;
                const wochentag = new Date(`${tag.datum}T12:00:00`).toLocaleDateString("de-DE", { weekday: "short" });
                return (
                  <li
                    key={tag.datum}
                    className={`flex flex-col gap-1.5 border-b border-divider py-3.5 ${i > 0 ? "border-l pl-3" : "pr-3"}`}
                  >
                    <span className="text-[13px] font-bold">
                      {wochentag} {tag.datum.slice(8, 10)}.{tag.datum.slice(5, 7)}.
                    </span>
                    <TagIcon className={`size-6 ${nass ? "text-rain" : "text-sunshine"}`} strokeWidth={1.6} aria-label={tag.lage} />
                    <span className="text-figure-m tabular-nums">{num(tag.tMaxC)}°</span>
                    <span className="text-[13px] text-fg-muted tabular">
                      {num(tag.tMinC)}°
                      {tag.niederschlagMm > 0 ? <span className="text-rain"> · {num(tag.niederschlagMm)} mm</span> : null}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <div className="grid gap-14 lg:grid-cols-2 lg:gap-16">
          {/* Variety for the coming season */}
          <section aria-labelledby="sorte">
            <SectionTitle
              hint={
                isChosen ? (
                  <StatusMarker status="status-ok" label={year2027?.status === "gekauft" ? "Saatgut gekauft" : "Sorte gewählt"} />
                ) : (
                  <StatusMarker status="status-problem" label={varietyDisplayName ? "Sorte geplant" : "Sorte offen"} />
                )
              }
            >
              <span id="sorte">Sorte für 2027</span>
            </SectionTitle>
            {varietyDisplayName ? (
              <dl className="grid grid-cols-[8.5rem_minmax(0,1fr)] border-t border-rule">
                <dt className="border-b border-divider py-3.5 text-small text-fg-muted">{isChosen ? "Gewählt" : "Geplant"}</dt>
                <dd className="m-0 border-b border-divider py-3.5">
                  <span className="font-bold">{varietyDisplayName}</span>
                  {breeder ? <span className="block text-small text-fg-muted">{breeder.name}</span> : null}
                </dd>
                <dt className="border-b border-divider py-3.5 text-small text-fg-muted">Reifezahl</dt>
                <dd className="m-0 border-b border-divider py-3.5">
                  {variety?.reifezahl ? `ca. FAO ${variety.reifezahl}` : "Nicht angegeben"}
                </dd>
                <dt className="border-b border-divider py-3.5 text-small text-fg-muted">Nutzung</dt>
                <dd className="m-0 border-b border-divider py-3.5">{nutzungLabel ?? "Mais"}</dd>
              </dl>
            ) : (
              <dl className="grid grid-cols-[8.5rem_minmax(0,1fr)] border-t border-rule">
                <dt className="border-b border-divider py-3.5 text-small text-fg-muted">Kulturart</dt>
                <dd className="m-0 border-b border-divider py-3.5">{field.crop === "mais" ? "Mais" : (field.crop || "Mais")}</dd>
                <dt className="border-b border-divider py-3.5 text-small text-fg-muted">Nutzung</dt>
                <dd className="m-0 border-b border-divider py-3.5">{nutzungLabel ?? "Noch offen"}</dd>
                <dt className="border-b border-divider py-3.5 text-small text-fg-muted">Vorjahr</dt>
                <dd className="m-0 border-b border-divider py-3.5">
                  {field.previousVarietyText || field.previousVarietyId || "Keine Angabe"}
                </dd>
              </dl>
            )}
            {isChosen && variety?.kurzbeschreibung ? (
              <p className="mt-4 max-w-xl text-[0.9375rem] text-fg-muted">{variety.kurzbeschreibung}</p>
            ) : null}
            {!isChosen ? (
              <p className="mt-4 max-w-xl text-[0.9375rem]">
                {varietyDisplayName
                  ? `Die Sorte ${varietyDisplayName} ist als Vorzugssorte hinterlegt. Überprüfe im Sorten-Ranking, ob sie unter aktuellen Klimaszenarien und Preisannahmen für deinen Boden optimal abschneidet.`
                  : `Für ${field.name} ist noch keine Sorte festgelegt. Finde mit dem Sortenkompass die ertragsstärkste und trockenstabilste Sorte für deine Boden- und Klimabedingungen.`}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {isChosen ? (
                <>
                  <ButtonLink href={`/heute?feld=${field.id}`} variant="primary">
                    Dein Feld heute <ArrowRight className="size-4" aria-hidden />
                  </ButtonLink>
                  <ButtonLink href={`/feld/${field.id}/ranking`} variant="secondary">
                    Sorten-Ranking erneut aufrufen
                  </ButtonLink>
                </>
              ) : (
                <ButtonLink
                  href={field.usage ? `/feld/${field.id}/ranking` : `/feld/${field.id}/anbau`}
                  variant="primary"
                >
                  Zum Sorten-Ranking <ArrowRight className="size-4" aria-hidden />
                </ButtonLink>
              )}
            </div>
          </section>

          {/* Site facts */}
          <section aria-labelledby="standort">
            <SectionTitle>
              <span id="standort">So sehen wir deinen Standort</span>
            </SectionTitle>
            <dl className="grid grid-cols-[8.5rem_minmax(0,1fr)] border-t border-rule">
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
            <p className="mt-4 text-small text-fg-muted">
              Das ist der Ausgangspunkt für jede Empfehlung.
              <NurMit funktion="spross">
                {" "}
                Stimmt etwas nicht?{" "}
                <AskSprossButton
                  frage="Zu meinem Standort möchte ich etwas ergänzen."
                  className="font-semibold text-link hover:underline"
                >
                  Erzähl es Spross
                </AskSprossButton>
                , du kennst dein Feld am besten.
              </NurMit>
            </p>
          </section>
        </div>

        {/* Manage field */}
        <Card>
          <SectionTitle>Schlag verwalten</SectionTitle>
          <ManageFieldForm fieldId={field.id} defaultName={field.name} />
        </Card>
      </div>
    </div>
  );
}

function Fakt({ label, wert }: { label: string; wert: string }) {
  return (
    <>
      <dt className="border-b border-divider py-3.5 text-small text-fg-muted">{label}</dt>
      <dd className="m-0 border-b border-divider py-3.5 text-fg">{wert}</dd>
    </>
  );
}
