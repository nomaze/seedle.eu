"use client";

import { ArrowRight, Check } from "lucide-react";
import { useSearchParams } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card, SectionTitle } from "@/components/ui/Card";
import { ChoiceLink } from "@/components/ui/Choice";
import {
  BiogasIcon,
  KornIcon,
  LeguminosenIcon,
  MaisIcon,
  RapsIcon,
  RuebeIcon,
  SiloIcon,
  SonnenblumeIcon,
  WeizenIcon,
} from "@/components/ui/CropIcons";
import { submitFieldIntake } from "@/lib/backendClient";
import {
  type AgronomyUsageOption,
  loadFieldAgronomyProfile,
  saveFieldAgronomyProfile,
} from "@/lib/fieldAgronomyProfile";
import { num } from "@/lib/format";

const PRIMARY_CROPS = [
  {
    name: "Mais",
    countLabel: "15 Sorten",
    hint: "Körnermais (12 Sorten), Silomais & Biogasmais (12 Sorten)",
    icon: <MaisIcon />,
    active: true,
  },
  {
    name: "Sonnenblumen",
    countLabel: "4 Sorten",
    hint: "Öl- & High-Oleic-Sorten (4 Sorten)",
    icon: <SonnenblumeIcon />,
    active: false,
  },
  {
    name: "Winterweizen",
    countLabel: "8 Sorten",
    hint: "Brot-, Elite- & Futterweizen (8 Sorten)",
    icon: <WeizenIcon />,
    active: false,
  },
  {
    name: "Wintergerste",
    countLabel: "6 Sorten",
    hint: "Zwei- & mehrzeilige Sorten (6 Sorten)",
    icon: <WeizenIcon />,
    active: false,
  },
  {
    name: "Winterraps",
    countLabel: "6 Sorten",
    hint: "Hybriden & Liniensorten (6 Sorten)",
    icon: <RapsIcon />,
    active: false,
  },
  {
    name: "Zuckerrüben",
    countLabel: "4 Sorten",
    hint: "Rizomania- & SBR-Toleranz (4 Sorten)",
    icon: <RuebeIcon />,
    active: false,
  },
  {
    name: "Sojabohnen",
    countLabel: "4 Sorten",
    hint: "Reifegruppen 000 bis 00 (4 Sorten)",
    icon: <LeguminosenIcon />,
    active: false,
  },
  {
    name: "Körnererbse / Ackerbohne",
    countLabel: "4 Sorten",
    hint: "Heimische Eiweißpflanzen (4 Sorten)",
    icon: <LeguminosenIcon />,
    active: false,
  },
] as const;

type MaisUsage = "koernermais" | "silomais" | "biogasmais";

export interface AnbauCropUsageSectionProps {
  fieldId: string;
  fieldName: string;
  areaHa: number;
  lat?: number;
  lon?: number;
  defaultCropSelected?: "mais" | null;
  scope?: "farm" | "field";
  totalHaOverride?: number;
  fieldsCount?: number;
}

function toPreviewCropSlug(cropName: string): string {
  return cropName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Two-step interactive crop and maize usage selector for `/feld/[fieldId]/anbau`.
 * Maize is the only selectable crop (single-select radio semantics). Preview crops are
 * non-selectable read-only badges ("In Kürze verfügbar") and cannot be co-selected.
 * Once maize is selected, exactly one maize usage option can be active at a time.
 */
export function AnbauCropUsageSection({
  fieldId,
  fieldName,
  areaHa,
  lat = 48.4028,
  lon = 11.7489,
  defaultCropSelected = null,
  scope: propScope,
  totalHaOverride,
  fieldsCount: propFieldsCount,
}: AnbauCropUsageSectionProps): React.JSX.Element {
  const searchParams = useSearchParams();
  const queryScope = searchParams?.get("scope");
  const queryTotalHa = Number(searchParams?.get("totalHa"));
  const queryFieldsCount = Number(searchParams?.get("fieldsCount"));

  const isFarmScope =
    propScope === "farm" ||
    queryScope === "farm" ||
    (typeof totalHaOverride === "number" && totalHaOverride > 0) ||
    (Number.isFinite(queryTotalHa) && queryTotalHa > 0);

  const effectiveAreaHa =
    typeof totalHaOverride === "number" && totalHaOverride > 0
      ? totalHaOverride
      : Number.isFinite(queryTotalHa) && queryTotalHa > 0
        ? queryTotalHa
        : areaHa;

  const effectiveFieldsCount =
    typeof propFieldsCount === "number" && propFieldsCount > 0
      ? propFieldsCount
      : Number.isFinite(queryFieldsCount) && queryFieldsCount > 0
        ? queryFieldsCount
        : 7;

  const [selectedCrop, setSelectedCrop] = useState<"mais" | null>(defaultCropSelected);
  const [selectedUsage, setSelectedUsage] = useState<MaisUsage | null>(null);

  useEffect(() => {
    if (!isFarmScope || typeof window === "undefined") return;
    try {
      const payload = JSON.stringify({
        scope: "farm",
        totalHa: effectiveAreaHa,
        fieldsCount: effectiveFieldsCount,
      });
      window.sessionStorage?.setItem("seedle_active_farm_scope", payload);
      window.localStorage?.setItem("seedle_active_farm_scope", payload);
    } catch {
      // Ignore storage errors
    }
  }, [isFarmScope, effectiveAreaHa, effectiveFieldsCount]);

  function handleCropSelected(cropName: string, usageName: string): void {
    if (
      usageName === "koernermais" ||
      usageName === "silomais" ||
      usageName === "biogasmais"
    ) {
      setSelectedUsage(usageName);
      const existing = loadFieldAgronomyProfile(fieldId, usageName as AgronomyUsageOption);
      saveFieldAgronomyProfile({
        ...existing,
        fieldId,
        usage: usageName as AgronomyUsageOption,
      });
      void fetch(`/api/v1/fields/${fieldId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          crop: "mais",
          usage: usageName === "biogasmais" ? "biogas" : usageName,
        }),
      }).catch(() => {
        // Offline / static export mode handled via client agronomy profile
      });
    }
    void submitFieldIntake({
      field_id: fieldId,
      area_ha: effectiveAreaHa,
      lat,
      lon,
      crop: cropName,
      usage: usageName,
      stage: "crop_selected",
    });
  }

  const isMaisSelected = selectedCrop === "mais";
  const farmQuerySuffix = isFarmScope
    ? `&scope=farm&totalHa=${effectiveAreaHa}&fieldsCount=${effectiveFieldsCount}`
    : "";
  const targetLabel = isFarmScope
    ? `deinen gesamten Betrieb (${num(effectiveAreaHa)} ha · ${effectiveFieldsCount} Schläge)`
    : fieldName;

  return (
    <>
      {isFarmScope ? (
        <div
          data-testid="anbau-farm-scope-banner"
          className="flex flex-wrap items-center justify-between gap-2 rounded-panel border-2 border-selected bg-highlight px-4 py-3 text-small font-semibold text-fg"
        >
          <span>
            Gesamter Betrieb · {num(effectiveAreaHa)} ha Gesamtfläche ({effectiveFieldsCount} Schläge)
          </span>
          <Badge tone="leaf">Betriebsweite Sortenplanung 2027</Badge>
        </div>
      ) : null}

      {/* 1. Primary crop selection: maize-only single-select, preview crops are non-selectable */}
      <Card aria-labelledby="hauptkultur-heading">
        <SectionTitle hint={<Badge tone="leaf">1. Hauptkultur wählen</Badge>}>
          <span id="hauptkultur-heading">
            Hauptauswahl der Kulturart für {targetLabel}
          </span>
        </SectionTitle>

        <ul
          className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          role="radiogroup"
          aria-label="Hauptkultur wählen"
        >
          {PRIMARY_CROPS.map((crop) =>
            crop.active ? (
              <li key={crop.name}>
                <button
                  type="button"
                  role="radio"
                  data-testid="crop-card-mais"
                  aria-checked={isMaisSelected}
                  onClick={() => setSelectedCrop("mais")}
                  className={`flex h-full w-full items-center justify-between gap-3 rounded-panel p-4 text-left cursor-pointer ${
                    isMaisSelected
                      ? "border-2 border-selected bg-selected text-on-selected"
                      : "border border-control bg-surface text-fg"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`shrink-0 ${
                        isMaisSelected ? "text-on-selected" : "text-link"
                      }`}
                    >
                      {crop.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate font-bold">
                        {crop.name} ({crop.countLabel})
                      </div>
                      <div
                        className={`truncate text-caption ${
                          isMaisSelected ? "text-on-selected/85" : "text-fg-muted"
                        }`}
                      >
                        {crop.hint}
                      </div>
                    </div>
                  </div>
                  {isMaisSelected ? (
                    <span className="inline-flex shrink-0 items-center gap-1 text-caption font-semibold">
                      <Check className="size-3.5" aria-hidden="true" />
                      <span>Gewählt</span>
                    </span>
                  ) : (
                    <span className="inline-flex shrink-0 items-center gap-1 text-caption font-semibold text-link">
                      <span>Wählen</span>
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                    </span>
                  )}
                </button>
              </li>
            ) : (
              <li key={crop.name}>
                <div
                  data-testid={`preview-crop-card-${toPreviewCropSlug(crop.name)}`}
                  aria-disabled="true"
                  className="flex h-full w-full items-center justify-between gap-3 rounded-panel border border-divider bg-surface p-4 text-left text-fg opacity-80"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="shrink-0 text-fg-muted">{crop.icon}</span>
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-fg">
                        {crop.name} ({crop.countLabel})
                      </div>
                      <div className="truncate text-caption text-fg-muted">{crop.hint}</div>
                    </div>
                  </div>
                  <Badge tone="sand">Bald verfügbar</Badge>
                </div>
              </li>
            ),
          )}
        </ul>
      </Card>

      {/* 2. Usage selection for maize (single-select radio group; exactly one active at a time) */}
      {isMaisSelected ? (
        <Card data-testid="maize-usage-options-card" aria-labelledby="usage-heading">
          <SectionTitle hint={<Badge tone="leaf">2. Nutzungsrichtung für Mais</Badge>}>
            <span id="usage-heading">Welche Nutzung planst du für deinen Mais?</span>
          </SectionTitle>
          <p className="max-w-measure text-body text-fg-muted">
            Ein Klick auf deine Nutzungsrichtung öffnet sofort deine Sortenempfehlung für{" "}
            {targetLabel}.
          </p>

          <div
            className="mt-6 grid gap-4 lg:grid-cols-3"
            role="radiogroup"
            aria-label="Nutzungsrichtung für Mais"
          >
            <ChoiceLink
              href={`/feld/${fieldId}/ranking?usage=koernermais${farmQuerySuffix}`}
              role="radio"
              aria-checked={selectedUsage === "koernermais"}
              data-testid="usage-option-koernermais"
              onClick={() => handleCropSelected("mais", "koernermais")}
              icon={<KornIcon />}
              title="Körnermais"
              text="Zum Verkaufen oder Verfüttern (CCM und Körner). Fokus auf Kornertrag, Druschfähigkeit, sichere Abreife (K-Zahl) und Kolbengesundheit."
              extra={<Badge tone="leaf">Direkt zur Empfehlung</Badge>}
            />

            <ChoiceLink
              href={`/feld/${fieldId}/ranking?usage=silomais${farmQuerySuffix}`}
              role="radio"
              aria-checked={selectedUsage === "silomais"}
              data-testid="usage-option-silomais"
              onClick={() => handleCropSelected("mais", "silomais")}
              icon={<SiloIcon />}
              title="Silomais (Futter / Milchvieh)"
              text="Für Milchvieh und Rindermast. Fokus auf hohe Energiedichte (MJ NEL), Stärkegehalt, Restpflanzenverdaulichkeit und Stay-Green."
              extra={<Badge tone="leaf">Direkt zur Empfehlung</Badge>}
            />

            <ChoiceLink
              href={`/feld/${fieldId}/ranking?usage=biogasmais${farmQuerySuffix}`}
              role="radio"
              aria-checked={selectedUsage === "biogasmais"}
              data-testid="usage-option-biogasmais"
              onClick={() => handleCropSelected("mais", "biogasmais")}
              icon={<BiogasIcon />}
              title="Biogasmais (Maximale Biogas- & Methanausbeute / TM-Ertrag)"
              text="Für Biogasanlagen und Substratproduktion. Fokus auf maximalen Gesamttrockenmasse-Ertrag (t TM/ha), hohe Methanausbeute und Standfestigkeit."
              extra={<Badge tone="leaf">Direkt zur Empfehlung</Badge>}
            />
          </div>
        </Card>
      ) : null}
    </>
  );
}
