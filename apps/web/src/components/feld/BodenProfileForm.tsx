"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, SectionTitle } from "@/components/ui/Card";
import { CheckboxMark, RadioMark, optionClass, segmentClass } from "@/components/ui/Choice";
import {
  type AgronomyUsageOption,
  createDefaultAgronomyProfile,
  type FieldAgronomyProfile,
  loadFieldAgronomyProfile,
  normalizeAgronomyUsage,
  type NutrientStatusOption,
  SOIL_TYPE_LABELS,
  type SoilTypeOption,
  saveFieldAgronomyProfile,
  TILLAGE_BIOLOGY_HINT,
  type TillageOption,
  TRAFFICABILITY_LABELS,
  type TrafficabilityOption,
} from "@/lib/fieldAgronomyProfile";
import { num } from "@/lib/format";

const ORGANIC_FERTILIZER_OPTIONS = [
  "Rindergülle",
  "Schweinegülle",
  "Stallmist / Geflügelmist",
  "Biogas-Gärrest",
  "Nur mineralisch (NPK/KAS)",
] as const;

const NUTRIENT_OPTIONS: { id: NutrientStatusOption; label: string; hint: string }[] = [
  {
    id: "ausgewogen",
    label: "Ausgewogen (Versorgungsstufe C)",
    hint: "Grundnährstoffe P, K, Mg und Kalk im Zielbereich",
  },
  {
    id: "pk_knapp",
    label: "Phosphor/Kali knapp",
    hint: "Starke Wurzelentwicklung & Unterfuß-Effizienz bevorzugt",
  },
  {
    id: "spurenelemente_mangel",
    label: "Bor/Mangan/Zink-Mangel bekannt",
    hint: "Robuste Jugendentwicklung und Kolbenanlage auf Grenzstandorten",
  },
];

const PREVIOUS_CROP_OPTIONS: { label: string; countLabel: string }[] = [
  { label: "Winterweizen", countLabel: "8 Sorten" },
  { label: "Wintergerste", countLabel: "6 Sorten" },
  { label: "Mais (Mais-nach-Mais)", countLabel: "15 Sorten" },
  { label: "Raps", countLabel: "6 Sorten" },
  { label: "Grünland/Kleegras", countLabel: "4 Sorten" },
  { label: "Zuckerrübe", countLabel: "4 Sorten" },
] as const;

const CATCH_CROP_OPTIONS = [
  "Keine",
  "Leguminosen-Mischung (N-fixierend)",
  "Senf / Ölrettich / Phacelia",
  "Gräser-Gemenge",
] as const;

const IRRIGATION_PERIODS = [
  "Juni–August (Blüte & Kornausbildung)",
  "Mai–Juli (Jugendentwicklung bis Blüte)",
  "Ganzjährig bedarfsgerecht",
] as const;

export function BodenProfileForm({
  fieldId,
  fieldName,
  areaHa,
  initialUsage,
}: {
  fieldId: string;
  fieldName: string;
  areaHa: number;
  initialUsage?: AgronomyUsageOption;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryUsage = searchParams.get("usage");
  const usage: AgronomyUsageOption = queryUsage
    ? normalizeAgronomyUsage(queryUsage)
    : normalizeAgronomyUsage(initialUsage);

  // Initialize with SSR-identical default so server HTML and first client render match 1:1,
  // then hydrate localStorage profile after mount.
  const hasHydratedProfileRef = useRef(false);
  const [profile, setProfile] = useState<FieldAgronomyProfile>(() =>
    createDefaultAgronomyProfile(fieldId, usage),
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile(loadFieldAgronomyProfile(fieldId, usage));
    hasHydratedProfileRef.current = true;
  }, [fieldId, usage]);

  const soilMeta = SOIL_TYPE_LABELS[profile.soilType] ?? SOIL_TYPE_LABELS.sandiger_lehm;
  const tillageMeta = TILLAGE_BIOLOGY_HINT[profile.tillage] ?? TILLAGE_BIOLOGY_HINT.grubber;

  function update<K extends keyof FieldAgronomyProfile>(
    key: K,
    value: FieldAgronomyProfile[K],
  ) {
    setProfile((prev) => {
      const next = { ...prev, [key]: value, usage };
      saveFieldAgronomyProfile(next);
      return next;
    });
  }

  function handleSoilChange(soilType: SoilTypeOption) {
    const meta = SOIL_TYPE_LABELS[soilType];
    setProfile((prev) => {
      const next: FieldAgronomyProfile = {
        ...prev,
        usage,
        soilType,
        humusPercent: meta.defaultHumus,
        nfkMm: meta.defaultNfkMm,
      };
      saveFieldAgronomyProfile(next);
      return next;
    });
  }

  function toggleFertilizer(item: string) {
    const exists = profile.organicFertilizers.includes(item);
    const nextList = exists
      ? profile.organicFertilizers.filter((x) => x !== item)
      : [...profile.organicFertilizers, item];
    update("organicFertilizers", nextList);
  }

  function handleContinue() {
    saveFieldAgronomyProfile({ ...profile, usage });
    router.push(`/feld/${fieldId}/wichtig?usage=${usage}`);
  }

  return (
    <div className="space-y-section">
      {/* 1. Automatically detected site parameters from field coordinate */}
      <Card aria-labelledby="boden-auto-heading">
        <SectionTitle hint={<Badge tone="leaf">{fieldName} · {num(areaHa)} ha</Badge>}>
          <span id="boden-auto-heading">✓ Automatisch aus Standortdaten ermittelt — anpassbar</span>
        </SectionTitle>

        <div className="grid border-t border-rule lg:grid-cols-2 lg:gap-x-12">
          {/* Soil type & humus */}
          <div className="space-y-3 border-b border-divider py-5">
            <div className="text-small text-fg-muted">Bodenart & Humus</div>
            <div className="text-body font-semibold text-fg">
              {soilMeta.label} · Mittlerer Humusgehalt ({num(profile.humusPercent, 1)} %)
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(SOIL_TYPE_LABELS) as SoilTypeOption[]).map((st) => {
                const active = profile.soilType === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleSoilChange(st)}
                    aria-pressed={active}
                    className={segmentClass(active, "cursor-pointer")}
                  >
                    {SOIL_TYPE_LABELS[st].short}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Available water capacity (nFK) */}
          <div className="space-y-3 border-b border-divider py-5">
            <div className="text-small text-fg-muted">Wasserspeicherfähigkeit (nFK)</div>
            <div className="text-body font-semibold text-fg tabular-nums">{soilMeta.nfkText}</div>
            <p className="max-w-measure text-small text-fg-muted">
              Nutzbare Feldkapazität im Hauptwurzelraum (0–100 cm). Beeinflusst die
              Trockenstress-Gewichtung deiner Sortenwahl.
            </p>
          </div>

          {/* Spring trafficability & warming */}
          <div className="space-y-3 border-b border-divider py-5">
            <div className="text-small text-fg-muted">Befahrbarkeit & Erwärmung im Frühjahr</div>
            <div className="text-body font-semibold text-fg">
              {TRAFFICABILITY_LABELS[profile.trafficability]}
            </div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["frueh", "Früh & leicht befahrbar"],
                  ["normal", "Normal"],
                  ["spaet", "Spät & schwerer Boden"],
                ] as [TrafficabilityOption, string][]
              ).map(([id, label]) => {
                const active = profile.trafficability === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => update("trafficability", id)}
                    aria-pressed={active}
                    className={segmentClass(active, "cursor-pointer")}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Multi-year DWD climate & soil biology profile */}
          <div className="space-y-3 border-b border-divider py-5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="text-small text-fg-muted">Mehrjähriges DWD-Wetterprofil</span>
              <Badge tone="leaf">Automatisch aktiv</Badge>
            </div>
            <div className="text-body font-semibold text-fg">
              Regionale Temperatur- &amp; Niederschlagsreihe (inkl. Frühsommer-Trockenphasen)
            </div>
            <p className="max-w-measure text-small text-fg-muted">
              Dein Schlag wird automatisch mit mehrjährigen DWD-Wetterreihen und regionalen
              LSV-Versuchen abgeglichen — ohne Abfrage sensibler Kontrolldaten.
            </p>
          </div>
        </div>
      </Card>

      {/* 2. Fast 1-click farmer inputs */}
      <Card aria-labelledby="boden-angaben-heading">
        <SectionTitle hint={<Badge tone="sand">Optional · 1-Klick</Badge>}>
          <span id="boden-angaben-heading">Schnelle 1-Klick-Angaben zu deiner Bewirtschaftung</span>
        </SectionTitle>
        <p className="max-w-measure text-body text-fg-muted">
          Alles optional mit klugen Praxis-Defaults vorbelegt – in 15 Sekunden anpassbar.
        </p>

        <div className="mt-8 max-w-measure space-y-10">
          {/* Organic fertilizer / manure (multi-select) */}
          <fieldset>
            <legend className="mb-3 text-body font-semibold text-fg">
              1. Düngung & Wirtschaftsdünger (Viehdung)
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {ORGANIC_FERTILIZER_OPTIONS.map((item) => {
                const active = profile.organicFertilizers.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleFertilizer(item)}
                    aria-pressed={active}
                    className={optionClass(
                      active,
                      "flex min-h-touch cursor-pointer items-center gap-3 px-3.5 py-2.5 text-body text-fg",
                    )}
                  >
                    <CheckboxMark checked={active} />
                    {item}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Nutrient & micronutrient status */}
          <fieldset>
            <legend className="mb-3 text-body font-semibold text-fg">
              2. Nährstoff- & Spurenelement-Status
            </legend>
            <div className="grid gap-2">
              {NUTRIENT_OPTIONS.map((opt) => {
                const active = profile.nutrientStatus === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => update("nutrientStatus", opt.id)}
                    aria-pressed={active}
                    className={optionClass(active, "flex cursor-pointer items-start gap-3 p-3.5")}
                  >
                    <RadioMark checked={active} />
                    <span>
                      <span className="block text-body font-semibold text-fg">{opt.label}</span>
                      <span className="mt-0.5 block text-small text-fg-muted">{opt.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Soil tillage & depth + automatic earthworm / soil biology hint */}
          <fieldset>
            <legend className="mb-3 text-body font-semibold text-fg">3. Bodenbearbeitung & Tiefe</legend>
            <div className="grid gap-2">
              {(Object.keys(TILLAGE_BIOLOGY_HINT) as TillageOption[]).map((tKey) => {
                const active = profile.tillage === tKey;
                return (
                  <button
                    key={tKey}
                    type="button"
                    onClick={() => update("tillage", tKey)}
                    aria-pressed={active}
                    className={optionClass(
                      active,
                      "flex min-h-touch cursor-pointer items-center gap-3 px-3.5 py-2.5 text-body font-semibold text-fg",
                    )}
                  >
                    <RadioMark checked={active} />
                    {TILLAGE_BIOLOGY_HINT[tKey].label}
                  </button>
                );
              })}
            </div>
            <p className="mt-4 border-l-4 border-control py-1 pl-4 text-small text-fg">
              <strong className="font-semibold">
                Bodenlebewesen- & Regenwurm-Aktivitäts-Hinweis:
              </strong>{" "}
              {tillageMeta.biologyHint}
            </p>
          </fieldset>

          {/* Irrigation */}
          <fieldset>
            <legend className="mb-3 text-body font-semibold text-fg">4. Bewässerung</legend>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => update("irrigationPossible", false)}
                aria-pressed={!profile.irrigationPossible}
                className={segmentClass(!profile.irrigationPossible, "cursor-pointer")}
              >
                Keine Bewässerung (Regenfeldbau)
              </button>
              <button
                type="button"
                onClick={() => update("irrigationPossible", true)}
                aria-pressed={profile.irrigationPossible}
                className={segmentClass(profile.irrigationPossible, "cursor-pointer")}
              >
                Bewässerung möglich
              </button>
            </div>
            {profile.irrigationPossible ? (
              <div className="mt-4 space-y-2">
                <span className="block text-small text-fg-muted">Zeitraum:</span>
                <div className="grid gap-2">
                  {IRRIGATION_PERIODS.map((period) => {
                    const active = profile.irrigationPeriod === period;
                    return (
                      <button
                        key={period}
                        type="button"
                        aria-pressed={active}
                        onClick={() => update("irrigationPeriod", period)}
                        className={optionClass(
                          active,
                          "flex min-h-touch cursor-pointer items-center gap-3 px-3.5 py-2.5 text-body text-fg",
                        )}
                      >
                        <RadioMark checked={active} />
                        {period}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </fieldset>

          {/* Previous crop */}
          <fieldset>
            <legend className="mb-3 text-body font-semibold text-fg">
              5. Vorfrucht (Was stand letztes Jahr?)
            </legend>
            <div className="flex flex-wrap gap-2">
              {PREVIOUS_CROP_OPTIONS.map((crop) => {
                const active = profile.previousCrop === crop.label;
                return (
                  <button
                    key={crop.label}
                    type="button"
                    onClick={() => update("previousCrop", crop.label)}
                    aria-pressed={active}
                    className={segmentClass(active, "cursor-pointer tabular-nums")}
                  >
                    {crop.label} ({crop.countLabel})
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Catch crop */}
          <fieldset>
            <legend className="mb-3 text-body font-semibold text-fg">Zwischenfrucht vor Mais</legend>
            <div className="flex flex-wrap gap-2">
              {CATCH_CROP_OPTIONS.map((cc) => {
                const active = profile.catchCrop === cc;
                return (
                  <button
                    key={cc}
                    type="button"
                    onClick={() => update("catchCrop", cc)}
                    aria-pressed={active}
                    className={segmentClass(active, "cursor-pointer")}
                  >
                    {cc}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Optional free-text field notes */}
          <div>
            <label htmlFor="boden-feld-notizen" className="block text-body font-semibold text-fg">
              6. Gibt es sonst noch etwas zu deinem Schlag, was wir wissen sollten?
            </label>
            <input
              id="boden-feld-notizen"
              type="text"
              maxLength={240}
              value={profile.fieldNotes}
              onChange={(e) => update("fieldNotes", e.target.value)}
              placeholder="z. B. Wildschadendruck am Waldrand, Waldschatten, Spätfrost-Senke, Staunässe-Loch …"
              className="mt-2 h-control w-full rounded-control border border-control bg-surface px-3 text-body text-fg"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-divider pt-6">
            <Button onClick={handleContinue} className="w-full sm:w-auto">
              <span>Weiter: Was ist dir wichtig?</span>
              <ArrowRight className="size-4" aria-hidden />
            </Button>

            <Link
              href={`/feld/${fieldId}/ranking?usage=${usage}`}
              className="inline-flex min-h-touch items-center text-body font-semibold text-link underline underline-offset-4 hover:decoration-2"
            >
              Überspringen direkt zur Empfehlung →
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
