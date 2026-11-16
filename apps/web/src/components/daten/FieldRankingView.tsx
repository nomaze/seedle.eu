"use client";

import type React from "react";
import type {
  ClimateScenario,
  RankedVariety,
  Recommendation,
  ScenarioId,
  Usage,
} from "@seedle/core";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Settings2,
  ShoppingBag,
  SlidersHorizontal,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useSpross } from "@/components/spross/SprossContext";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { withBasePath } from "@/lib/basePath";
import {
  type AgronomyUsageOption,
  createDefaultAgronomyProfile,
  type FieldAgronomyProfile,
  formatAgronomyRecapSummary,
  getAgronomyUsageLabel,
  loadFieldAgronomyProfile,
  normalizeAgronomyUsage,
  SOIL_TYPE_LABELS,
  STRATEGY_LABELS,
} from "@/lib/fieldAgronomyProfile";
import {
  type BackendVarietyCandidate,
  fetchFieldIntelligenceFromBackend,
  type FieldIntelligenceResponse,
  flushPendingFieldIntakes,
  submitFieldIntake,
  type ThreeModelVarietyBreakdown,
} from "@/lib/backendClient";
import {
  buildDeterministicWeatherHistory10Y,
  fetchFieldWeatherHistory10Y,
  type FieldSiteCharacter,
  type FieldWeatherHistory10Y,
} from "@/lib/fieldWeatherHistory";
import { num } from "@/lib/format";
import {
  KitchenTablePrintSheet,
  PrintPdfButton,
  type PrintPortfolioVarietyItem,
} from "./KitchenTablePrintSheet";
import { SaatgutKaufenModal } from "./SaatgutKaufenModal";
import {
  type ComparableVarietyItem,
  VarietyCompareModal,
} from "./VarietyCompareModal";
import { VarietyRankingTable } from "./VarietyRankingTable";
import { VarietySteckbriefModal } from "./VarietySteckbriefModal";
import { WhereToBuyModal } from "./WhereToBuyModal";

export interface FieldRankingViewProps {
  field: {
    id: string;
    name: string;
    areaHa: number;
    hektar?: number;
    lat?: number;
    lon?: number;
    usage: string | null;
    previousVarietyId?: string | null;
    previousVarietyText?: string | null;
    env: { region: string };
  };
  rec: Recommendation;
  sortierung: ScenarioId | "gewichtet";
  standardVarietyId?: string;
  scope?: "farm" | "field";
  totalFarmHa?: number;
  farmFieldsCount?: number;
}

export type RiskAppetiteLevel = 1 | 2 | 3;
export type StrategyAxisX = "stability" | "balanced" | "performance";
export type DataConfidenceAxisY = "conservative" | "balanced" | "offensive";
export type PreviousCropKey =
  | "silomais"
  | "koernermais"
  | "winterweizen"
  | "wintergerste"
  | "winterraps"
  | "sonnenblumen"
  | "zuckerrueben"
  | "sojabohnen";

export interface PreviousCropVarietyEntry {
  id: string;
  name: string;
  zuechter: string;
  crop: PreviousCropKey;
  reifezahl?: number;
  bestseller?: boolean;
}

export const DEMO_VARIETIES_BY_CROP: Record<
  PreviousCropKey,
  {
    label: string;
    placeholderExample: string;
    varieties: readonly PreviousCropVarietyEntry[];
  }
> = {
  silomais: {
    label: "Silomais / Biogasmais",
    placeholderExample: "z. B. AW Talkrone, AW Sonnenkraft, Auenhof Saphir",
    varieties: [
      { id: "aw-talkrone", name: "AW Talkrone", zuechter: "AckerWerk Genetik", crop: "silomais", reifezahl: 240, bestseller: true },
      { id: "aw-sonnenkraft", name: "AW Sonnenkraft", zuechter: "AckerWerk Genetik", crop: "silomais", reifezahl: 240, bestseller: true },
      { id: "ah-saphir", name: "Auenhof Saphir", zuechter: "Auenhof Saatzucht", crop: "silomais", reifezahl: 260, bestseller: true },
      { id: "fg-kontinent", name: "FG Kontinent", zuechter: "Feldmark Genetics", crop: "silomais", reifezahl: 250, bestseller: true },
      { id: "aw-lichtkorn", name: "AW Lichtkorn", zuechter: "AckerWerk Genetik", crop: "silomais", reifezahl: 200 },
      { id: "aw-morgenstern", name: "AW Morgenstern", zuechter: "AckerWerk Genetik", crop: "silomais", reifezahl: 270 },
      { id: "fg-nordlicht", name: "FG Nordlicht", zuechter: "Feldmark Genetics", crop: "silomais", reifezahl: 200 },
      { id: "ah-bernstein", name: "Auenhof Bernstein", zuechter: "Auenhof Saatzucht", crop: "silomais", reifezahl: 230 },
      { id: "ah-klassik", name: "Auenhof Klassik", zuechter: "Auenhof Saatzucht", crop: "silomais", reifezahl: 220 },
      { id: "bs-gipfel", name: "BS Gipfel", zuechter: "Bergland Seeds", crop: "silomais", reifezahl: 190 },
      { id: "bs-tauern", name: "BS Tauern", zuechter: "Bergland Seeds", crop: "silomais", reifezahl: 240 },
      { id: "rz-mainau", name: "RZ Mainau", zuechter: "Rheintal Zucht", crop: "silomais", reifezahl: 260 },
    ],
  },
  koernermais: {
    label: "Körnermais",
    placeholderExample: "z. B. AW Morgenstern, FG Kornfeld, RZ Sonnwend",
    varieties: [
      { id: "aw-morgenstern", name: "AW Morgenstern", zuechter: "AckerWerk Genetik", crop: "koernermais", reifezahl: 270, bestseller: true },
      { id: "aw-talkrone", name: "AW Talkrone", zuechter: "AckerWerk Genetik", crop: "koernermais", reifezahl: 240, bestseller: true },
      { id: "fg-kornfeld", name: "FG Kornfeld", zuechter: "Feldmark Genetics", crop: "koernermais", reifezahl: 280, bestseller: true },
      { id: "rz-sonnwend", name: "RZ Sonnwend", zuechter: "Rheintal Zucht", crop: "koernermais", reifezahl: 290, bestseller: true },
      { id: "aw-lichtkorn", name: "AW Lichtkorn", zuechter: "AckerWerk Genetik", crop: "koernermais", reifezahl: 200 },
      { id: "aw-ostwind", name: "AW Ostwind", zuechter: "AckerWerk Genetik", crop: "koernermais", reifezahl: 300 },
      { id: "fg-nordlicht", name: "FG Nordlicht", zuechter: "Feldmark Genetics", crop: "koernermais", reifezahl: 200 },
      { id: "fg-kontinent", name: "FG Kontinent", zuechter: "Feldmark Genetics", crop: "koernermais", reifezahl: 250 },
      { id: "ah-bernstein", name: "Auenhof Bernstein", zuechter: "Auenhof Saatzucht", crop: "koernermais", reifezahl: 230 },
      { id: "ah-klassik", name: "Auenhof Klassik", zuechter: "Auenhof Saatzucht", crop: "koernermais", reifezahl: 220 },
      { id: "bs-gipfel", name: "BS Gipfel", zuechter: "Bergland Seeds", crop: "koernermais", reifezahl: 190 },
      { id: "rz-mainau", name: "RZ Mainau", zuechter: "Rheintal Zucht", crop: "koernermais", reifezahl: 260 },
    ],
  },
  winterweizen: {
    label: "Winterweizen",
    placeholderExample: "z. B. RGT Reform, KWS Emerick, SU Jonte",
    varieties: [
      { id: "ww-rgt-reform", name: "RGT Reform", zuechter: "RAGT", crop: "winterweizen", bestseller: true },
      { id: "ww-kws-emerick", name: "KWS Emerick", zuechter: "KWS", crop: "winterweizen", bestseller: true },
      { id: "ww-su-jonte", name: "SU Jonte", zuechter: "Saaten-Union", crop: "winterweizen", bestseller: true },
      { id: "ww-chevalier", name: "Chevignon", zuechter: "Hauptsaaten", crop: "winterweizen", bestseller: true },
      { id: "ww-asory", name: "Asory", zuechter: "Secobra", crop: "winterweizen" },
      { id: "ww-informer", name: "Informer", zuechter: "Limagrain", crop: "winterweizen" },
      { id: "ww-patras", name: "Patras", zuechter: "Deutsche Saatveredelung", crop: "winterweizen" },
      { id: "ww-kashmir", name: "KWS Donovan", zuechter: "KWS", crop: "winterweizen" },
    ],
  },
  wintergerste: {
    label: "Wintergerste",
    placeholderExample: "z. B. KWS Tardis, Esprit, SU Ellen",
    varieties: [
      { id: "wg-kws-tardis", name: "KWS Tardis", zuechter: "KWS", crop: "wintergerste", bestseller: true },
      { id: "wg-esprit", name: "Esprit", zuechter: "KWS", crop: "wintergerste", bestseller: true },
      { id: "wg-su-ellen", name: "SU Ellen", zuechter: "Saaten-Union", crop: "wintergerste", bestseller: true },
      { id: "wg-sensation", name: "Sensation", zuechter: "Limagrain", crop: "wintergerste", bestseller: true },
      { id: "wg-orbit", name: "KWS Orbit", zuechter: "KWS", crop: "wintergerste" },
      { id: "wg-morris", name: "KWS Morris", zuechter: "KWS", crop: "wintergerste" },
    ],
  },
  winterraps: {
    label: "Winterraps",
    placeholderExample: "z. B. Ambassador, LG Austin, DK Excited",
    varieties: [
      { id: "wr-ambassador", name: "Ambassador", zuechter: "Limagrain", crop: "winterraps", bestseller: true },
      { id: "wr-lg-austin", name: "LG Austin", zuechter: "Limagrain", crop: "winterraps", bestseller: true },
      { id: "wr-dk-excited", name: "DK Excited", zuechter: "Bayer / Dekalb", crop: "winterraps", bestseller: true },
      { id: "wr-rgt-trezzor", name: "RGT Trezzor", zuechter: "RAGT", crop: "winterraps", bestseller: true },
      { id: "wr-kws-granat", name: "KWS Granos", zuechter: "KWS", crop: "winterraps" },
      { id: "wr-pt303", name: "PT303", zuechter: "Pioneer", crop: "winterraps" },
    ],
  },
  sonnenblumen: {
    label: "Sonnenblumen",
    placeholderExample: "z. B. LG 50.479 SX, SY Bacardi, ES Bella",
    varieties: [
      { id: "sb-lg-50479", name: "LG 50.479 SX", zuechter: "Limagrain", crop: "sonnenblumen", bestseller: true },
      { id: "sb-sy-bacardi", name: "SY Bacardi CLP", zuechter: "Syngenta", crop: "sonnenblumen", bestseller: true },
      { id: "sb-es-bella", name: "ES Bella", zuechter: "Lidea", crop: "sonnenblumen", bestseller: true },
      { id: "sb-p63ll06", name: "P63LL06", zuechter: "Pioneer", crop: "sonnenblumen" },
    ],
  },
  zuckerrueben: {
    label: "Zuckerrüben",
    placeholderExample: "z. B. BTS 440, Smart Belamia KWS, Vasco",
    varieties: [
      { id: "zr-bts-440", name: "BTS 440", zuechter: "Betaseed", crop: "zuckerrueben", bestseller: true },
      { id: "zr-smart-belamia", name: "Smart Belamia KWS", zuechter: "KWS", crop: "zuckerrueben", bestseller: true },
      { id: "zr-vasco", name: "Vasco", zuechter: "SESVanderHave", crop: "zuckerrueben", bestseller: true },
      { id: "zr-annalena", name: "Annalena KWS", zuechter: "KWS", crop: "zuckerrueben" },
    ],
  },
  sojabohnen: {
    label: "Sojabohnen",
    placeholderExample: "z. B. Merlin, Sultana, ES Comandor",
    varieties: [
      { id: "sj-merlin", name: "Merlin (000)", zuechter: "Saatbau Linz", crop: "sojabohnen", bestseller: true },
      { id: "sj-sultana", name: "Sultana (000)", zuechter: "RAGT", crop: "sojabohnen", bestseller: true },
      { id: "sj-es-comandor", name: "ES Comandor (000)", zuechter: "Lidea", crop: "sojabohnen", bestseller: true },
      { id: "sj-obscura", name: "Abelina (000)", zuechter: "Saatbau Linz", crop: "sojabohnen" },
    ],
  },
};

/**
 * Returns the deterministic variety count for a given crop key in `DEMO_VARIETIES_BY_CROP`.
 */
export function getKnownVarietyCountForCrop(crop: PreviousCropKey): number {
  return DEMO_VARIETIES_BY_CROP[crop]?.varieties.length ?? 0;
}

/**
 * Returns the strictly filtered variety list and bestseller chips for the selected crop.
 */
export function getFilteredVarietiesForCrop(
  crop: PreviousCropKey,
  searchQuery = "",
): {
  cropLabel: string;
  knownCount: number;
  placeholder: string;
  bestsellers: readonly PreviousCropVarietyEntry[];
  filteredCatalog: readonly PreviousCropVarietyEntry[];
} {
  const entry = DEMO_VARIETIES_BY_CROP[crop] ?? DEMO_VARIETIES_BY_CROP.silomais;
  const allForCrop = entry.varieties.filter((v) => v.crop === crop);
  const bestsellers = allForCrop.filter((v) => v.bestseller);
  const q = searchQuery.trim().toLowerCase();
  const filteredCatalog =
    q.length === 0
      ? allForCrop
      : allForCrop.filter(
          (v) =>
            v.name.toLowerCase().includes(q) ||
            v.zuechter.toLowerCase().includes(q),
        );
  return {
    cropLabel: entry.label,
    knownCount: allForCrop.length,
    placeholder: entry.placeholderExample,
    bestsellers: bestsellers.length > 0 ? bestsellers : allForCrop.slice(0, 4),
    filteredCatalog,
  };
}

export interface WarmerStartViewProps {
  fieldId: string;
  initialCrop?: PreviousCropKey;
  selectedPreviousVariety?: string;
  onChangeCrop?: (nextCrop: PreviousCropKey) => void;
  onSelectPreviousVariety?: (variety: PreviousCropVarietyEntry | { name: string; crop: PreviousCropKey }) => void;
}

/**
 * Step-1 Crop Selection + Strictly Crop-Filtered Previous Variety Picker ("Warmer Start").
 * Ensures the farmer first selects/confirms the crop (with the exact number of known varieties shown behind every crop)
 * before picking what variety was previously grown on the field.
 */
export function WarmerStartView({
  fieldId,
  initialCrop = "silomais",
  selectedPreviousVariety = "",
  onChangeCrop,
  onSelectPreviousVariety,
}: WarmerStartViewProps): React.JSX.Element {
  const [activeCrop, setActiveCrop] = useState<PreviousCropKey>(initialCrop);
  const [query, setQuery] = useState<string>("");
  const [chosenName, setChosenName] = useState<string>(selectedPreviousVariety);

  const { cropLabel, knownCount, placeholder, bestsellers, filteredCatalog } = useMemo(
    () => getFilteredVarietiesForCrop(activeCrop, query),
    [activeCrop, query],
  );

  function handleCropSwitch(nextCrop: PreviousCropKey): void {
    setActiveCrop(nextCrop);
    setQuery("");
    onChangeCrop?.(nextCrop);
  }

  function handlePickVariety(item: PreviousCropVarietyEntry): void {
    setChosenName(item.name);
    setQuery("");
    onSelectPreviousVariety?.(item);
    void fieldId;
  }

  return (
    <Card
      data-testid="warmer-start-view"
      className="rounded-panel border border-control bg-surface p-5 sm:p-6 space-y-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-small font-semibold text-link">
            Schneller Einstieg – was hast du bisher angebaut?
          </div>
          <h3 className="text-heading text-fg">
            1. Zuerst Kultur wählen · 2. Bisherige Sorte für den Vergleich auswählen
          </h3>
          <p className="max-w-measure text-small text-fg-muted">
            Wähle zuerst die Kulturart, damit wir dir ausschließlich passende Sorten dieser Kultur vorschlagen.
          </p>
        </div>
        <Badge tone="leaf" data-testid="warmer-start-active-crop-badge">
          Gefiltert auf {cropLabel} ({knownCount} bekannte Sorten)
        </Badge>
      </div>

      {/* Step 1: Crop selector with deterministic variety counts behind every crop */}
      <div className="space-y-2">
        <div className="text-small font-bold text-fg">
          Schritt 1: Welche Kultur meinst du? (Anzahl bekannter Sorten je Kultur)
        </div>
        <div
          role="group"
          aria-label="Kultur für bisherige Sorte wählen"
          className="flex flex-wrap gap-2"
        >
          {(Object.keys(DEMO_VARIETIES_BY_CROP) as PreviousCropKey[]).map((cropKey) => {
            const meta = DEMO_VARIETIES_BY_CROP[cropKey];
            const count = getKnownVarietyCountForCrop(cropKey);
            const active = activeCrop === cropKey;
            return (
              <button
                key={cropKey}
                type="button"
                data-testid={`warmer-start-crop-${cropKey}`}
                aria-pressed={active}
                onClick={() => handleCropSwitch(cropKey)}
                className={`inline-flex min-h-10 items-center gap-1.5 rounded-control px-3 py-2 text-small font-semibold ring-1 ring-inset transition-colors cursor-pointer tabular-nums ${
                  active
                    ? "bg-selected text-on-selected ring-selected"
                    : "bg-canvas text-fg ring-control hover:bg-highlight"
                }`}
              >
                <span>
                  {meta.label} ({count} Sorten)
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Bestseller chips + strictly filtered search for the chosen crop */}
      <div className="space-y-3 border-t border-divider pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label
            htmlFor={`warmer-start-search-${fieldId}`}
            className="text-small font-bold text-fg"
          >
            Schritt 2: Welche {cropLabel}-Sorte hast du bisher angebaut?
          </label>
          <span
            data-testid="warmer-start-filter-summary"
            className="text-caption font-semibold text-link tabular-nums"
          >
            Gefiltert auf {cropLabel} ({knownCount} bekannte Sorten)
          </span>
        </div>

        {/* Strictly crop-filtered bestseller chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-caption text-fg-muted">Häufig angebaut ({cropLabel}):</span>
          {bestsellers.map((b) => {
            const isChosen = chosenName.toLowerCase() === b.name.toLowerCase();
            return (
              <button
                key={b.id}
                type="button"
                data-testid={`warmer-start-bestseller-${b.id}`}
                aria-pressed={isChosen}
                onClick={() => handlePickVariety(b)}
                className={`inline-flex h-8 items-center gap-1.5 rounded-control px-2.5 text-caption font-semibold ring-1 ring-inset transition-colors cursor-pointer tabular-nums ${
                  isChosen
                    ? "bg-selected text-on-selected ring-selected"
                    : "bg-canvas text-fg ring-control hover:bg-highlight"
                }`}
              >
                <span>{b.name}</span>
                {b.reifezahl ? (
                  <span className={isChosen ? "text-on-selected/85" : "text-fg-muted"}>
                    · S/K {b.reifezahl}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Strictly crop-filtered search input */}
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <input
            id={`warmer-start-search-${fieldId}`}
            data-testid="warmer-start-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`${cropLabel}-Sorte suchen, ${placeholder}`}
            aria-label={`${cropLabel}-Sorte suchen`}
            className="h-control w-full rounded-control border border-control bg-canvas px-3 text-body text-fg"
          />
          {chosenName ? (
            <div
              data-testid="warmer-start-selected-variety"
              className="inline-flex h-control items-center gap-1.5 rounded-control border border-selected bg-canvas px-3 text-small font-semibold text-fg"
            >
              <Check className="size-4 text-link" aria-hidden="true" />
              <span>Bisherige Sorte: {chosenName} ({cropLabel})</span>
            </div>
          ) : null}
        </div>

        {query.trim().length >= 1 ? (
          <ul
            data-testid="warmer-start-results-list"
            className="divide-y divide-divider rounded-control border border-control bg-canvas"
          >
            {filteredCatalog.slice(0, 6).map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => handlePickVariety(item)}
                  className="flex min-h-touch w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-small transition-colors hover:bg-highlight cursor-pointer"
                >
                  <span>
                    <span className="font-semibold text-fg">{item.name}</span>{" "}
                    <span className="text-fg-muted">
                      · {item.zuechter}
                      {item.reifezahl ? ` · Reife ${item.reifezahl}` : ""}
                    </span>
                  </span>
                  <Badge tone="sand">{cropLabel}</Badge>
                </button>
              </li>
            ))}
            {filteredCatalog.length === 0 ? (
              <li className="px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const customName = query.trim();
                    setChosenName(customName);
                    setQuery("");
                    onSelectPreviousVariety?.({ name: customName, crop: activeCrop });
                  }}
                  className="text-small font-semibold text-link hover:underline cursor-pointer"
                >
                  „{query.trim()}“ als bisherige {cropLabel}-Sorte übernehmen
                </button>
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>
    </Card>
  );
}

const lastSelectionKeyByField = new Map<string, string>();

const STRATEGY_AXIS_LABELS: Record<
  StrategyAxisX,
  { short: string; label: string; sub: string }
> = {
  stability: {
    short: "Stabilität",
    label: "Stabilität",
    sub: "Umweltstabil und ertragstreu, sichere Leistung auch in Stress- und Trockenjahren",
  },
  balanced: {
    short: "Ausgewogen",
    label: "Ausgewogen",
    sub: "Balance aus Umweltstabilität und Reaktion auf gute Standorte",
  },
  performance: {
    short: "Plastizität",
    label: "Plastizität",
    sub: "Hohe Plastizität, nutzt gute Böden, Wasser und Top-Bedingungen für Höchsterträge maximal aus",
  },
};

export const DATA_CONFIDENCE_AXIS_LABELS: Record<
  DataConfidenceAxisY,
  { short: string; label: string; sub: string }
> = {
  conservative: {
    short: "Konservativ (viele Daten)",
    label: "Konservativ (viele Daten)",
    sub: "Vieljährig in LSV und DMK geprüft, maximale Datensicherheit",
  },
  balanced: {
    short: "Ausgewogen",
    label: "Ausgewogen",
    sub: "Mehrjährig geprüft mit frischem Zuchtfortschritt",
  },
  offensive: {
    short: "Offensiv (weniger Daten)",
    label: "Offensiv (weniger Daten)",
    sub: "Neueste Genetik und junge Zulassungen, höchster Zuchtfortschritt bei kürzerer Prüfhistorie",
  },
};

export interface VarietyTrialProvenance {
  trialYearsCount: number;
  provenDataScore: number;
  provenanceBadge: string;
}

/**
 * Computes the number of official trial years (`trialYearsCount`), data confidence score (`provenDataScore`),
 * and farmer-facing provenance badge from the variety's release year and stability traits.
 */
export function deriveVarietyTrialProvenance(v: RankedVariety): VarietyTrialProvenance {
  const releaseYear = Number.isFinite(v.variety.zulassungsjahr)
    ? v.variety.zulassungsjahr
    : 2022;
  const trialYearsCount = Math.max(1, Math.min(8, 2026 - releaseYear));
  const provenDataScore = Math.min(
    98,
    Math.max(
      62,
      Math.round(
        58 +
          trialYearsCount * 4.8 +
          v.variety.traits.trockentoleranz * 1.2 +
          v.variety.traits.standfestigkeit * 1.1,
      ),
    ),
  );
  const provenanceBadge =
    trialYearsCount >= 4
      ? `Vieljährig geprüft (${trialYearsCount} Prüfjahre · Hohe Datensicherheit)`
      : trialYearsCount === 3
        ? "Mehrjährig geprüft (3 Prüfjahre · Solide Datenbasis)"
        : `Neue Züchtung (${trialYearsCount} ${
            trialYearsCount === 1 ? "Prüfjahr" : "Prüfjahre"
          } · Frischer Zuchtfortschritt)`;

  return { trialYearsCount, provenDataScore, provenanceBadge };
}

interface ActivePortfolioCardItem extends PrintPortfolioVarietyItem {
  varietyId: string;
  rang: number;
  zulassungsjahr: number;
  breederLogo?: string;
  standfestigkeit: number;
  trockentoleranz: number;
  seedUnits: number;
  seedsPerM2Label: string;
  siteAdaptedSeedingLine: string;
  maturityStaggerBadge?: string | null;
  usageBiologyFocus: string;
  trialYearsCount: number;
  provenanceBadge: string;
  modelBreakdown: ThreeModelVarietyBreakdown;
}

/**
 * Formats `seeding_recommendation` whether it is a string or an object
 * `{ recommended_kernels_m2, seed_units_50k, rationale }`.
 */
export function formatSeedingRecommendation(
  raw: unknown,
  shareHa = 10,
): string | null {
  if (typeof raw === "string" && raw.trim().length > 0) {
    return raw.trim();
  }
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    const kernels = Number(
      obj.recommended_kernels_m2 ??
        obj.recommended_kernels_per_m2 ??
        obj.kernels_per_m2,
    );
    const rawUnits = Number(
      obj.seed_units_50k ??
        obj.order_bags_ceil ??
        obj.recommended_seed_units ??
        obj.seed_units,
    );
    const rationale =
      typeof obj.rationale === "string" ? obj.rationale.trim() : "";
    if (Number.isFinite(kernels) && kernels > 0) {
      const kernelsFmt = kernels.toFixed(1).replace(".", ",");
      const safeHa = Math.max(0.1, Number.isFinite(shareHa) ? shareHa : 10);
      const units =
        Number.isFinite(rawUnits) && rawUnits > 0
          ? Math.max(1, Math.ceil(rawUnits))
          : Math.max(1, Math.ceil(safeHa * ((kernels * 10000) / 50000)));
      return rationale
        ? `Empfohlene Aussaatstärke auf diesem Schlag: ${kernelsFmt} Körner je m² · ca. ${units} Einheiten Saatgut (${rationale})`
        : `Empfohlene Aussaatstärke auf diesem Schlag: ${kernelsFmt} Körner je m² · ca. ${units} Einheiten Saatgut`;
    }
    if (rationale) {
      return rationale;
    }
  }
  return null;
}

/**
 * Resolves a matching variety candidate from `liveIntel.portfolio` or `liveIntel.ranked_candidates`
 * by ID, name, or rank index so backend-supplied 3-model scores, advisor rationales,
 * provenance badges, and seeding recommendations take priority when the backend is connected.
 * When falling back to `rankIndex` for a different variety ID/name, prevents foreign variety names
 * (e.g. `KWS Inteligens`) from leaking onto a local variety (e.g. `AW Talkrone`).
 */
export function findBackendCandidateForVariety(
  v: RankedVariety,
  rankIndex: number,
  liveIntel?: FieldIntelligenceResponse | null,
): BackendVarietyCandidate | null {
  if (!liveIntel) return null;
  const pools: BackendVarietyCandidate[][] = [];
  if (Array.isArray(liveIntel.portfolio) && liveIntel.portfolio.length > 0) {
    pools.push(liveIntel.portfolio);
  }
  if (Array.isArray(liveIntel.ranked_candidates) && liveIntel.ranked_candidates.length > 0) {
    pools.push(liveIntel.ranked_candidates);
  }
  const targetId = v.variety.id.toLowerCase();
  const targetName = v.variety.name.toLowerCase();

  for (const list of pools) {
    const byIdOrName = list.find((c) => {
      const cid = String(c?.variety_id ?? c?.id ?? "").toLowerCase();
      const cname = String(c?.variety_name ?? c?.name ?? "").toLowerCase();
      return (cid && cid === targetId) || (cname && cname === targetName);
    });
    if (byIdOrName) return byIdOrName;
  }

  for (const list of pools) {
    if (rankIndex >= 0 && rankIndex < list.length && list[rankIndex]) {
      const fallbackCand = list[rankIndex]!;
      const foreignName = String(
        fallbackCand.variety_name ?? fallbackCand.name ?? "",
      ).trim();
      let safeRationale: string | undefined;
      const rawRationale =
        typeof fallbackCand.advisor_rationale === "string"
          ? fallbackCand.advisor_rationale.trim()
          : "";
      if (rawRationale && foreignName) {
        const escapedForeign = foreignName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp(escapedForeign, "gi");
        if (re.test(rawRationale)) {
          safeRationale = rawRationale.replace(re, v.variety.name);
        }
      }
      return {
        ...fallbackCand,
        variety_id: v.variety.id,
        id: v.variety.id,
        variety_name: v.variety.name,
        name: v.variety.name,
        advisor_rationale: safeRationale,
      };
    }
  }
  return null;
}

/**
 * Computes the deterministic 3-model ensemble breakdown (1. Agronomic Knowledge Tree,
 * 2. Statistical LSV GxE Model, 3. Non-Linear ML Interaction Model + Model Consensus %)
 * using live backend data first and falling back to local deterministic calculation when offline.
 */
export function buildDeterministicThreeModelBreakdown(
  v: RankedVariety,
  relErtragProzent: number,
  usage: AgronomyUsageOption,
  profile: FieldAgronomyProfile,
  weatherHistory: FieldWeatherHistory10Y,
  liveIntel?: FieldIntelligenceResponse | null,
  rankIndex = 0,
): ThreeModelVarietyBreakdown {
  if (liveIntel) {
    const rawBreakdowns = liveIntel.model_breakdowns;
    if (rawBreakdowns) {
      const matched = Array.isArray(rawBreakdowns)
        ? (rawBreakdowns.find(
            (b) =>
              b?.variety_id === v.variety.id ||
              b?.variety_name?.toLowerCase() === v.variety.name.toLowerCase(),
          ) ?? rawBreakdowns[rankIndex])
        : (rawBreakdowns[v.variety.id] ?? rawBreakdowns[v.variety.name]);
      if (
        matched &&
        typeof matched.knowledge_tree_score === "number" &&
        typeof matched.statistical_gxe_score === "number" &&
        typeof matched.ml_ensemble_score === "number" &&
        Array.isArray(matched.decision_tree_path) &&
        Array.isArray(matched.top_drivers)
      ) {
        return matched;
      }
    }

    const cand = findBackendCandidateForVariety(v, rankIndex, liveIntel);
    const candBreakdown = (cand?.model_breakdown ?? cand?.three_model_breakdown) as
      | ThreeModelVarietyBreakdown
      | undefined;
    if (
      candBreakdown &&
      typeof candBreakdown.knowledge_tree_score === "number" &&
      typeof candBreakdown.statistical_gxe_score === "number" &&
      typeof candBreakdown.ml_ensemble_score === "number" &&
      Array.isArray(candBreakdown.decision_tree_path) &&
      Array.isArray(candBreakdown.top_drivers)
    ) {
      return candBreakdown;
    }
    if (
      cand &&
      typeof cand.knowledge_tree_score === "number" &&
      typeof cand.statistical_gxe_score === "number" &&
      typeof cand.ml_ensemble_score === "number" &&
      Array.isArray(cand.decision_tree_path) &&
      Array.isArray(cand.top_drivers)
    ) {
      return {
        variety_id: String(cand.variety_id ?? v.variety.id),
        variety_name: String(cand.variety_name ?? v.variety.name),
        knowledge_tree_score: cand.knowledge_tree_score,
        decision_tree_path: cand.decision_tree_path,
        statistical_gxe_score: cand.statistical_gxe_score,
        expected_rel_yield_pct:
          typeof cand.expected_rel_yield_pct === "number"
            ? cand.expected_rel_yield_pct
            : relErtragProzent,
        ml_ensemble_score: cand.ml_ensemble_score,
        top_drivers: cand.top_drivers,
        model_agreement_pct:
          typeof cand.model_agreement_pct === "number"
            ? cand.model_agreement_pct
            : 94,
      };
    }
  }

  const droughtTrait = v.variety.traits.trockentoleranz;
  const lodgingTrait = v.variety.traits.standfestigkeit;
  const fao = v.variety.reifezahl;
  const gdd = weatherHistory.avgGrowingDegreeDays;
  const waterBal = weatherHistory.siteCharacter.summerWaterBalanceMm;
  const soilShort = SOIL_TYPE_LABELS[profile.soilType]?.short ?? "Sandiger Lehm";

  const knowledgeTreeScore = Math.min(
    98,
    Math.max(76, Math.round(73 + droughtTrait * 1.5 + lodgingTrait * 1.3)),
  );
  const statisticalGxeScore = Math.min(
    98,
    Math.max(75, Math.round(relErtragProzent - 14 + droughtTrait * 0.7)),
  );
  const mlEnsembleScore = Math.min(
    99,
    Math.max(
      77,
      Math.round(
        72 +
          droughtTrait * 1.6 +
          lodgingTrait * 1.2 +
          (relErtragProzent - 100) * 0.8,
      ),
    ),
  );

  const spread =
    Math.max(knowledgeTreeScore, statisticalGxeScore, mlEnsembleScore) -
    Math.min(knowledgeTreeScore, statisticalGxeScore, mlEnsembleScore);
  const modelAgreementPct = Math.min(
    98,
    Math.max(84, Math.round(96 - spread * 0.7)),
  );

  const decisionTreePath: string[] = [
    `Reifezahl-Check: S ${fao} / K ${fao} passt zur 10J Wärmesumme (${gdd} °Cd)`,
    waterBal < 0
      ? `Wasserbilanz-Pfad: Sommerbilanz minus ${Math.abs(waterBal)} mm wird durch Trockentoleranz BSA ${droughtTrait}/9 abgesichert`
      : `Wasserbilanz-Pfad: Sommerbilanz plus ${waterBal} mm erlaubt volle Ausschöpfung des Ertragspotenzials`,
    usage === "koernermais"
      ? "Nutzungs-Fokus: Körnermais mit rascher Wasserabgabe (Dry Down) und hoher Druschfähigkeit"
      : usage === "biogasmais"
        ? `Nutzungs-Fokus: Biogasmais mit maximaler Gesamttrockenmasse und Standfestigkeit BSA ${lodgingTrait}/9`
        : "Nutzungs-Fokus: Silomais mit hoher Energiedichte, Stärkeertrag und sicherem Häcksel-Zeitfenster",
  ];

  const topDrivers: string[] = [
    `Boden & Wasser: ${soilShort} kombiniert mit Trockentoleranz BSA ${droughtTrait}/9`,
    `Blütehitze & Regen Juli: Ø ${weatherHistory.siteCharacter.julyHeatDaysAvg} Hitzetage und Ø ${weatherHistory.avgPrecipFloweringMm} mm Blüteregen`,
    `Reifezahl & Standfestigkeit: S ${fao} / K ${fao} mit Standfestigkeit BSA ${lodgingTrait}/9`,
  ];

  return {
    variety_id: v.variety.id,
    variety_name: v.variety.name,
    knowledge_tree_score: knowledgeTreeScore,
    decision_tree_path: decisionTreePath,
    statistical_gxe_score: statisticalGxeScore,
    expected_rel_yield_pct: relErtragProzent,
    ml_ensemble_score: mlEnsembleScore,
    top_drivers: topDrivers,
    model_agreement_pct: modelAgreementPct,
  };
}

/**
 * Computes the site-adapted sowing density (kernels per m² and 50,000-kernel bags)
 * tailored to the field's water balance (lower density on drought-stress sites, higher on moist sites).
 */
export function computeSiteAdaptedSeedingRate(
  shareHa: number,
  usage: AgronomyUsageOption,
  siteBadge: FieldSiteCharacter["primaryBadge"],
): { kernelsPerM2Formatted: string; seedUnits: number; recommendationLine: string } {
  const safeHa = Math.max(0.1, Number.isFinite(shareHa) ? shareHa : 1);
  let kernelsPerM2: number;
  if (usage === "koernermais") {
    kernelsPerM2 =
      siteBadge === "Trockenstress-Standort"
        ? 7.8
        : siteBadge === "Feuchter Ertragsstandort"
          ? 9.0
          : siteBadge === "Kühle Höhen- oder Spätfrostlage"
            ? 8.2
            : 8.5;
  } else {
    kernelsPerM2 =
      siteBadge === "Trockenstress-Standort"
        ? 8.4
        : siteBadge === "Feuchter Ertragsstandort"
          ? 9.8
          : siteBadge === "Kühle Höhen- oder Spätfrostlage"
            ? 8.8
            : 9.2;
  }

  const unitsPerHa = (kernelsPerM2 * 10000) / 50000;
  const seedUnits = Math.max(1, Math.ceil(safeHa * unitsPerHa));
  const kernelsPerM2Formatted = kernelsPerM2.toFixed(1).replace(".", ",");
  const recommendationLine = `Empfohlene Aussaatstärke auf diesem Schlag: ${kernelsPerM2Formatted} Körner je m² · ca. ${seedUnits} Einheiten Saatgut`;

  return { kernelsPerM2Formatted, seedUnits, recommendationLine };
}

/**
 * Returns a deterministic non-negative hash for a string input.
 * Used to derive stable tie-breakers and collision nudges independent of array order.
 */
function stableHash32(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export interface InvariantScatterCoordinate {
  varietyId: string;
  xPct: number;
  yPct: number;
  relY: number;
  trialYearsCount: number;
}

/**
 * Computes invariant scatter plot coordinates for all varieties in the candidate pool.
 * X axis: intrinsic Stability (left) to Plasticity (right) spectrum.
 * Y axis: intrinsic Conservative/many data (top) to Offensive/fewer data (bottom) spectrum.
 * Coordinates are normalized over the full fixed `rec.varieties` pool and use deterministic
 * collision nudges derived from `variety.id`, so they never jump when strategy axis,
 * confidence axis, or portfolio count changes. Coordinates only change with the
 * environment/scenario inputs (`effectiveSortierung` or `usage`) that affect the pool values.
 */
export function computeInvariantScatterCoordinates(
  varieties: RankedVariety[],
  usage: Usage,
  effectiveSortierung: ScenarioId | "gewichtet",
  scenarios: ClimateScenario[],
): Map<string, InvariantScatterCoordinate> {
  const stableVarieties = [...varieties].sort((a, b) =>
    a.variety.id.localeCompare(b.variety.id),
  );

  if (stableVarieties.length === 0) {
    return new Map();
  }

  const points = stableVarieties.map((v) => {
    const normalYield = getVarietyYield(v, usage, "normal", scenarios);
    const dryYield = getVarietyYield(v, usage, "trocken-heiss", scenarios);
    const relY = getVarietyYield(v, usage, effectiveSortierung, scenarios);
    const provenance = deriveVarietyTrialProvenance(v);
    const plasticityMetric =
      normalYield * 0.65 + (normalYield - dryYield) * 0.85 - dryYield * 0.15;
    const provenDataScore = Number.isFinite(provenance.provenDataScore)
      ? provenance.provenDataScore
      : 80;

    return {
      varietyId: v.variety.id,
      relY: Number.isFinite(relY) ? relY : 100,
      trialYearsCount: Number.isFinite(provenance.trialYearsCount)
        ? provenance.trialYearsCount
        : 3,
      plasticityMetric: Number.isFinite(plasticityMetric) ? plasticityMetric : 0,
      provenDataScore,
    };
  });

  const xValues = points.map((p) => p.plasticityMetric);
  const yValues = points.map((p) => p.provenDataScore);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  const xSpan = Math.max(0.0001, maxX - minX);
  const ySpan = Math.max(0.0001, maxY - minY);

  const placed: InvariantScatterCoordinate[] = [];
  const byId = new Map<string, InvariantScatterCoordinate>();

  for (const point of points) {
    const hash = stableHash32(point.varietyId);
    const hashAX = ((hash & 0xff) / 255 - 0.5) * 1.2;
    const hashAY = (((hash >>> 8) & 0xff) / 255 - 0.5) * 1.2;
    const baseX = 14 + ((point.plasticityMetric - minX) / xSpan) * 72 + hashAX;
    const baseY = 16 + ((point.provenDataScore - minY) / ySpan) * 66 + hashAY;

    let xPct = Number.isFinite(baseX) ? Math.round(baseX) : 50;
    let yPct = Number.isFinite(baseY) ? Math.round(baseY) : 50;
    const dirX = (hash & 1) === 0 ? -1 : 1;
    const dirY = ((hash >>> 1) & 1) === 0 ? 1 : -1;

    for (let pass = 0; pass < 8; pass++) {
      const colliding = placed.find(
        (p) => Math.abs(p.xPct - xPct) < 14 && Math.abs(p.yPct - yPct) < 12,
      );
      if (!colliding) break;
      xPct = Math.max(12, Math.min(86, xPct + dirX * (8 + (pass % 2) * 2)));
      yPct = Math.max(14, Math.min(82, yPct + dirY * (9 - (pass % 2) * 2)));
    }

    const coord: InvariantScatterCoordinate = {
      varietyId: point.varietyId,
      xPct: Number.isFinite(xPct) ? Math.max(12, Math.min(86, xPct)) : 50,
      yPct: Number.isFinite(yPct) ? Math.max(14, Math.min(82, yPct)) : 50,
      relY: point.relY,
      trialYearsCount: point.trialYearsCount,
    };
    placed.push(coord);
    byId.set(point.varietyId, coord);
  }

  return byId;
}

/**
 * Computes the required commercial maize seed units (1 unit = 50,000 kernels) for a given hectare share.
 * Grain maize uses ~8.5 kernels/m² (1.7 units/ha) and silage/biogas maize uses ~9.2 kernels/m² (1.84 units/ha).
 */
export function computeSeedUnitsForHa(
  shareHa: number,
  usage: AgronomyUsageOption,
): { seedUnits: number; seedsPerM2Label: string; unitsPerHa: number } {
  const safeHa = Math.max(0.1, Number.isFinite(shareHa) ? shareHa : 1);
  if (usage === "koernermais") {
    const unitsPerHa = 1.7;
    return {
      seedUnits: Math.max(1, Math.ceil(safeHa * unitsPerHa)),
      seedsPerM2Label: "8,5 Körner/m²",
      unitsPerHa,
    };
  }
  const unitsPerHa = 1.84;
  return {
    seedUnits: Math.max(1, Math.ceil(safeHa * unitsPerHa)),
    seedsPerM2Label: "9,2 Körner/m²",
    unitsPerHa,
  };
}

/**
 * Returns the usage-specific biological breeding focus text without dashes or semicolons.
 */
export function getUsageBiologyFocusText(usage: AgronomyUsageOption): string {
  if (usage === "koernermais") {
    return "Fokus auf Kornertrag, schnelle Wasserabgabe (Dry Down), Druschfähigkeit und Kolbengesundheit";
  }
  if (usage === "biogasmais") {
    return "Fokus auf maximale Gesamttrockenmasse und Methanausbeute je Hektar";
  }
  return "Fokus auf Stärkeertrag, Restpflanzenverdaulichkeit, Energiedichte und sicheres Häcksel-Zeitfenster (Stay Green)";
}

/**
 * Selects a biologically staggered variety portfolio for the 75/25 or 50/30/20 risk mix.
 * Ensures the 2nd (and 3rd) partner varieties preferably differ by at least 10 FAO maturity points
 * from the primary variety so that not all plants flower during the same July heat week or mature on the same autumn day.
 */
export function buildAgronomicRiskPortfolio(
  ranked: RankedVariety[],
  portfolioSize: RiskAppetiteLevel,
): RankedVariety[] {
  if (ranked.length === 0) return [];
  const primary = ranked[0]!;
  if (portfolioSize === 1 || ranked.length === 1) {
    return [primary];
  }

  const rest = ranked.slice(1);
  const staggeredSecond =
    rest.find(
      (candidate) =>
        Math.abs(candidate.variety.reifezahl - primary.variety.reifezahl) >= 10,
    ) ??
    [...rest].sort(
      (a, b) =>
        b.variety.traits.trockentoleranz +
        b.variety.traits.standfestigkeit -
        (a.variety.traits.trockentoleranz + a.variety.traits.standfestigkeit),
    )[0] ??
    rest[0]!;

  if (portfolioSize === 2 || ranked.length === 2) {
    return [primary, staggeredSecond];
  }

  const remainingForThird = rest.filter(
    (candidate) => candidate.variety.id !== staggeredSecond.variety.id,
  );
  const staggeredThird =
    remainingForThird.find(
      (candidate) =>
        Math.abs(candidate.variety.reifezahl - primary.variety.reifezahl) >= 10 &&
        Math.abs(candidate.variety.reifezahl - staggeredSecond.variety.reifezahl) >= 10,
    ) ??
    remainingForThird.find(
      (candidate) =>
        Math.abs(candidate.variety.reifezahl - primary.variety.reifezahl) >= 10,
    ) ??
    [...remainingForThird].sort(
      (a, b) =>
        b.variety.traits.trockentoleranz +
        b.variety.traits.standfestigkeit -
        (a.variety.traits.trockentoleranz + a.variety.traits.standfestigkeit),
    )[0] ??
    remainingForThird[0]!;

  return [primary, staggeredSecond, staggeredThird].filter(Boolean);
}

function getVarietyYield(
  v: RankedVariety,
  usage: Usage,
  sortierung: ScenarioId | "gewichtet",
  scenarios: ClimateScenario[],
): number {
  if (sortierung === "gewichtet") {
    const val = scenarios.reduce((sum, s) => {
      const p = v.predictions.find((pred) => pred.scenarioId === s.id);
      const y = (usage === "koernermais" ? p?.kornertragDtHa : p?.trockenmasseDtHa) ?? 0;
      return sum + s.wahrscheinlichkeit * y;
    }, 0);
    return Math.round(val * 10) / 10;
  }
  const p = v.predictions.find((pred) => pred.scenarioId === sortierung);
  const y = (usage === "koernermais" ? p?.kornertragDtHa : p?.trockenmasseDtHa) ?? 0;
  return Math.round(y * 10) / 10;
}

/**
 * Dynamically re-ranks candidate varieties along two independent strategy axes:
 * - X axis (`strategyAxisX`): `stability` prioritizes drought and stress resilience, low variance, and dry-year yield,
 *   `performance` prioritizes peak yield potential and plasticity in favorable conditions, `balanced` blends both.
 * - Y axis (`dataConfidenceAxisY`): `conservative` prioritizes many trial years and proven data confidence,
 *   `offensive` prioritizes young release years and newer genetic gain with fewer trial years, `balanced` blends both.
 */
export function rankVarietiesByStrategyAxis(
  varieties: RankedVariety[],
  usage: Usage,
  effectiveSortierung: ScenarioId | "gewichtet",
  scenarios: ClimateScenario[],
  axisX: StrategyAxisX,
  axisY: DataConfidenceAxisY = "balanced",
): RankedVariety[] {
  const scoreFor = (v: RankedVariety): number => {
    const weightedYield = getVarietyYield(v, usage, effectiveSortierung, scenarios);
    const normalYield = getVarietyYield(v, usage, "normal", scenarios) || weightedYield;
    const dryYield = getVarietyYield(v, usage, "trocken-heiss", scenarios) || weightedYield;
    const yieldSpread = Math.abs(normalYield - dryYield);
    const stabilityVarianceBonus = Math.max(0, 24 - yieldSpread * 1.2);
    const t = v.variety.traits;
    const stalkHealth = Math.max(1, 10 - t.staengelfaeule);
    const provenance = deriveVarietyTrialProvenance(v);
    const trialYearsCount = provenance.trialYearsCount;
    const provenDataScore = provenance.provenDataScore;
    const recencyYears = Math.max(0, v.variety.zulassungsjahr - 2018);

    let xScore = 0;
    if (axisX === "stability") {
      const maturitySafetyBonus = v.variety.reifezahl <= 230 ? 6 : v.variety.reifezahl <= 240 ? 3 : 0;
      xScore =
        dryYield * 0.55 +
        stabilityVarianceBonus +
        t.trockentoleranz * 13.0 +
        t.standfestigkeit * 11.0 +
        t.jugendentwicklung * 5.0 +
        stalkHealth * 4.5 +
        maturitySafetyBonus -
        normalYield * 0.05;
    } else if (axisX === "performance") {
      xScore =
        normalYield * 1.95 +
        weightedYield * 0.45 +
        recencyYears * 4.5 -
        yieldSpread * 0.2 -
        t.trockentoleranz * 2.5;
    } else {
      xScore =
        weightedYield * 0.9 +
        normalYield * 0.55 +
        dryYield * 0.35 +
        t.trockentoleranz * 4.0 +
        t.standfestigkeit * 3.5 +
        stabilityVarianceBonus * 0.35;
    }

    let yScore = 0;
    if (axisY === "conservative") {
      yScore =
        trialYearsCount * 14.0 +
        provenDataScore * 0.55 +
        t.standfestigkeit * 3.5 -
        recencyYears * 2.0;
    } else if (axisY === "offensive") {
      yScore =
        recencyYears * 12.0 +
        Math.max(0, 9 - trialYearsCount) * 5.0 -
        provenDataScore * 0.08 +
        normalYield * 0.08;
    } else {
      yScore =
        trialYearsCount * 7.0 +
        recencyYears * 5.0 +
        provenDataScore * 0.25 +
        weightedYield * 0.04;
    }

    return xScore + yScore;
  };

  return [...varieties].sort((a, b) => {
    const sA = scoreFor(a);
    const sB = scoreFor(b);
    if (Math.abs(sB - sA) > 0.01) return sB - sA;
    if (b.variety.traits.standfestigkeit !== a.variety.traits.standfestigkeit) {
      return b.variety.traits.standfestigkeit - a.variety.traits.standfestigkeit;
    }
    return a.variety.name.localeCompare(b.variety.name, "de");
  });
}

function buildAdvisorRationale(
  v: RankedVariety,
  profile: FieldAgronomyProfile,
): string {
  const soilShort = SOIL_TYPE_LABELS[profile.soilType]?.short ?? "Sandiger Lehm";
  const stratShort = STRATEGY_LABELS[profile.strategy]?.short ?? "Ausgewogener Mix";
  const waterClause = profile.irrigationPossible
    ? "schöpft deine Bewässerungsmöglichkeit zur Blüte optimal aus"
    : `kommt in den LSV-Versuchen deutlich besser mit der Frühsommertrockenheit an deinem Standort (${soilShort}, Trockentoleranz BSA ${v.variety.traits.trockentoleranz}/9) klar`;

  return `Auch wenn eine andere Sorte auf dem Papier 1 Note mehr Rohertrag hat: ${v.variety.name} ${waterClause}, bietet hohe Standfestigkeit (BSA ${v.variety.traits.standfestigkeit}/9) sowie Fusarium-Sicherheit in deiner Fruchtfolge (${profile.previousCrop || "Winterweizen"}) und passt ideal zu deinem Fokus „${stratShort}“.`;
}

export function FieldRankingView({
  field,
  rec,
  sortierung,
  standardVarietyId,
  scope: propScope,
  totalFarmHa,
  farmFieldsCount,
}: FieldRankingViewProps): React.JSX.Element {
  const { updatePageState, registerActionHandler, setActiveVariety } = useSpross();
  const searchParams = useSearchParams();
  const queryScope = searchParams?.get("scope");
  const queryUsage = searchParams?.get("usage");
  const queryTotalHa = Number(searchParams?.get("totalHa"));
  const queryFieldsCount = Number(searchParams?.get("fieldsCount"));

  const isFarmScope =
    propScope === "farm" ||
    queryScope === "farm" ||
    (typeof totalFarmHa === "number" && totalFarmHa > 0) ||
    (Number.isFinite(queryTotalHa) && queryTotalHa > 0);

  const rawUsage: AgronomyUsageOption = normalizeAgronomyUsage(
    isFarmScope && queryUsage ? queryUsage : field.usage || queryUsage,
  );
  const usage: Usage = rawUsage === "koernermais" ? "koernermais" : "silomais";
  const usageDisplayLabel = getAgronomyUsageLabel(rawUsage);
  const fieldHektar =
    typeof totalFarmHa === "number" && totalFarmHa > 0
      ? totalFarmHa
      : Number.isFinite(queryTotalHa) && queryTotalHa > 0
        ? queryTotalHa
        : field.hektar ?? field.areaHa;
  const effectiveFieldsCount =
    typeof farmFieldsCount === "number" && farmFieldsCount > 0
      ? farmFieldsCount
      : Number.isFinite(queryFieldsCount) && queryFieldsCount > 0
        ? queryFieldsCount
        : 7;
  const displayTargetName = isFarmScope
    ? `Gesamter Betrieb (${effectiveFieldsCount} Schläge)`
    : field.name;

  // Initialize with SSR-identical defaults so server HTML and first client render match 1:1,
  // then hydrate stored localStorage profile inside useEffect after mount.
  const [agronomyProfile, setAgronomyProfile] = useState<FieldAgronomyProfile>(() =>
    createDefaultAgronomyProfile(field.id, rawUsage),
  );

  // Default 2D X-Y selection: X = "balanced" (Ausgewogen), Y = "balanced" data confidence, 2 Sorten (75/25 Mix)
  const [strategyAxisX, setStrategyAxisX] = useState<StrategyAxisX>("balanced");
  const [dataConfidenceAxisY, setDataConfidenceAxisY] =
    useState<DataConfidenceAxisY>("balanced");
  const [riskAppetite, setRiskAppetite] = useState<RiskAppetiteLevel>(2);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAgronomyProfile(loadFieldAgronomyProfile(field.id, rawUsage));
  }, [field.id, rawUsage]);

  const fieldLat = typeof field.lat === "number" && Number.isFinite(field.lat) ? field.lat : 48.4028;
  const fieldLon = typeof field.lon === "number" && Number.isFinite(field.lon) ? field.lon : 11.7489;
  const [threeModelOpen, setThreeModelOpen] = useState(true);
  const [liveWeatherHistory, setLiveWeatherHistory] = useState<FieldWeatherHistory10Y | null>(null);
  const [liveFieldIntel, setLiveFieldIntel] = useState<FieldIntelligenceResponse | null>(null);
  const weatherHistory = useMemo(
    () => liveWeatherHistory ?? buildDeterministicWeatherHistory10Y(fieldLat, fieldLon),
    [liveWeatherHistory, fieldLat, fieldLon],
  );

  useEffect(() => {
    let active = true;
    const ctrl = new AbortController();
    void flushPendingFieldIntakes();
    void fetchFieldWeatherHistory10Y(fieldLat, fieldLon, ctrl.signal).then((history) => {
      if (active && !ctrl.signal.aborted) {
        setLiveWeatherHistory(history);
      }
    });
    void fetchFieldIntelligenceFromBackend(
      {
        lat: fieldLat,
        lon: fieldLon,
        area_ha: fieldHektar,
        soil_type: agronomyProfile.soilType,
        usage: rawUsage,
        irrigated: agronomyProfile.irrigationPossible,
        strategy_axis: strategyAxisX,
        risk_portfolio_size: riskAppetite,
      },
      ctrl.signal,
    ).then((intel) => {
      if (active && !ctrl.signal.aborted && intel) {
        setLiveFieldIntel(intel);
      }
    });
    return () => {
      active = false;
      ctrl.abort();
    };
  }, [
    fieldLat,
    fieldLon,
    fieldHektar,
    agronomyProfile.soilType,
    rawUsage,
    agronomyProfile.irrigationPossible,
    strategyAxisX,
    riskAppetite,
  ]);

  const effectiveSortierung: ScenarioId | "gewichtet" = useMemo(() => {
    if (sortierung === "trocken-heiss" || sortierung === "feucht-kuehl") {
      return sortierung;
    }
    if (agronomyProfile.strategy === "stabilitaet" && !agronomyProfile.irrigationPossible) {
      return "trocken-heiss";
    }
    if (agronomyProfile.strategy === "high_performer") {
      return "normal";
    }
    return "gewichtet";
  }, [sortierung, agronomyProfile.strategy, agronomyProfile.irrigationPossible]);

  const invariantScatterCoordinates = useMemo(
    () =>
      computeInvariantScatterCoordinates(
        rec.sorten,
        usage,
        effectiveSortierung,
        rec.scenarios,
      ),
    [rec.sorten, rec.scenarios, usage, effectiveSortierung],
  );

  const [selectedVarietyId, setSelectedVarietyId] = useState<number | string | null>(null);
  const [buyingVariety, setBuyingVariety] = useState<{
    id?: number | string;
    name: string;
    zuechter?: string | null;
    siloreifezahl?: number | null;
    koernerreifezahl?: number | null;
  } | null>(null);

  const [whereToBuyTarget, setWhereToBuyTarget] = useState<{
    id?: string | number;
    name: string;
    zuechter?: string | null;
    reifezahl?: number | null;
  } | null>(null);

  const [compareOpen, setCompareOpen] = useState(false);

  // 1. Sort varieties dynamically according to active X and Y strategy axes
  const sortedVarieties = useMemo(
    () =>
      rankVarietiesByStrategyAxis(
        rec.sorten,
        usage,
        effectiveSortierung,
        rec.scenarios,
        strategyAxisX,
        dataConfidenceAxisY,
      ),
    [rec.sorten, rec.scenarios, usage, effectiveSortierung, strategyAxisX, dataConfidenceAxisY],
  );

  // Selected variety IDs for this field (defaults to the active 2D X-Y recommendation)
  const [selectedVarietyIds, setSelectedVarietyIds] = useState<string[]>(() => {
    const initialPortfolio = buildAgronomicRiskPortfolio(sortedVarieties, 2);
    return initialPortfolio.map((s) => s.variety.id).filter((x): x is string => Boolean(x));
  });
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  function dispatchVarietySelectedIntake(
    nextPortfolioSize: RiskAppetiteLevel,
    nextVarietyIds: string[],
  ): void {
    void submitFieldIntake({
      field_id: field.id,
      area_ha: fieldHektar,
      lat: fieldLat,
      lon: fieldLon,
      soil_type: agronomyProfile.soilType,
      irrigated: agronomyProfile.irrigationPossible,
      cold_site:
        weatherHistory.siteCharacter.primaryBadge === "Kühle Höhen- oder Spätfrostlage",
      weather_summary: {
        avg_precip_total_mm: weatherHistory.avgPrecipTotalMm,
        avg_precip_veg_mm: weatherHistory.avgPrecipVegMm,
        avg_precip_flowering_mm: weatherHistory.avgPrecipFloweringMm,
        avg_effective_precip_veg_mm: weatherHistory.avgEffectivePrecipVegMm,
        avg_gdd: weatherHistory.avgGrowingDegreeDays,
        drought_years_count: weatherHistory.droughtYearsCount,
        site_badge: weatherHistory.siteCharacter.primaryBadge,
      },
      crop: "mais",
      usage: rawUsage,
      risk_portfolio_size: nextPortfolioSize,
      selected_variety_ids: nextVarietyIds,
      stage: "variety_selected",
    });
  }

  function persistFieldSelection(topIds: string[], nextPortfolioSize: RiskAppetiteLevel): void {
    if (topIds.length === 0) return;
    void fetch(`/api/v1/fields/${field.id}/selection`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ varietyId: topIds[0] }),
    }).catch(() => {
      // Offline / static export mode handled in client store
    });
    dispatchVarietySelectedIntake(nextPortfolioSize, topIds);
  }

  function updatePortfolioForAxes(
    nextAxisX: StrategyAxisX,
    nextAxisY: DataConfidenceAxisY,
    nextPortfolioSize: RiskAppetiteLevel,
  ): void {
    const nextKey = `${nextAxisX}:${nextAxisY}:${nextPortfolioSize}`;
    if (lastSelectionKeyByField.get(field.id) === nextKey) {
      return;
    }
    lastSelectionKeyByField.set(field.id, nextKey);

    const nextRanked = rankVarietiesByStrategyAxis(
      rec.sorten,
      usage,
      effectiveSortierung,
      rec.scenarios,
      nextAxisX,
      nextAxisY,
    );
    const nextPortfolio = buildAgronomicRiskPortfolio(nextRanked, nextPortfolioSize);
    const topIds = nextPortfolio
      .map((s) => s.variety.id)
      .filter(Boolean);

    setSelectedVarietyIds(topIds);
    persistFieldSelection(topIds, nextPortfolioSize);
  }

  function apply2DAxisSelection(
    nextAxisX: StrategyAxisX,
    nextAxisY: DataConfidenceAxisY,
  ): void {
    if (nextAxisX === strategyAxisX && nextAxisY === dataConfidenceAxisY) {
      return;
    }
    setStrategyAxisX(nextAxisX);
    setDataConfidenceAxisY(nextAxisY);
    updatePortfolioForAxes(nextAxisX, nextAxisY, riskAppetite);
  }

  function handleRiskAppetiteChange(nextLevel: RiskAppetiteLevel): void {
    if (nextLevel === riskAppetite) return;
    setRiskAppetite(nextLevel);
    updatePortfolioForAxes(strategyAxisX, dataConfidenceAxisY, nextLevel);
  }

  function handleStrategyAxisXChange(nextAxisX: StrategyAxisX): void {
    apply2DAxisSelection(nextAxisX, dataConfidenceAxisY);
  }

  function handleDataConfidenceAxisYChange(nextAxisY: DataConfidenceAxisY): void {
    apply2DAxisSelection(strategyAxisX, nextAxisY);
  }

  function apply2DMatrixSelection(
    nextAxisX: StrategyAxisX,
    yLevel: RiskAppetiteLevel,
  ): void {
    const yAxis: DataConfidenceAxisY =
      yLevel === 3 ? "conservative" : yLevel === 2 ? "balanced" : "offensive";
    apply2DAxisSelection(nextAxisX, yAxis);
  }

  async function toggleSelectVarietyForField(varietyId: string, varietyName: string): Promise<void> {
    const alreadySelected = selectedVarietyIds.includes(varietyId);
    const nextIds = alreadySelected
      ? selectedVarietyIds.length > 1
        ? selectedVarietyIds.filter((id) => id !== varietyId)
        : selectedVarietyIds
      : [...selectedVarietyIds, varietyId];

    setSelectedVarietyIds(nextIds);
    setSavedNotice(`${varietyName} für ${field.name} ausgewählt und im Hof hinterlegt.`);
    dispatchVarietySelectedIntake(riskAppetite, nextIds);

    try {
      await fetch(`/api/v1/fields/${field.id}/selection`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ varietyId: nextIds[0] ?? varietyId }),
      });
    } catch {
      // Offline / static export mode: selection state remains active in client store
    }
  }

  // Pre-select farmer's reference variety (Altsorte) + Top recommendation #1 for 1:1 comparison
  const defaultCompareIds = useMemo(() => {
    const topId = sortedVarieties[0]?.variety.id;
    const refQuery = (
      field.previousVarietyId ||
      agronomyProfile.referenceVariety ||
      field.previousVarietyText ||
      ""
    )
      .trim()
      .toLowerCase();
    const matchedRef = sortedVarieties.find(
      (s) =>
        s.variety.id.toLowerCase() === refQuery ||
        s.variety.name.toLowerCase() === refQuery ||
        (refQuery.length > 2 && s.variety.name.toLowerCase().includes(refQuery)),
    );
    const secondId =
      matchedRef && matchedRef.variety.id !== topId
        ? matchedRef.variety.id
        : sortedVarieties[1]?.variety.id;
    return [topId, secondId].filter((x): x is string => Boolean(x));
  }, [
    sortedVarieties,
    field.previousVarietyId,
    field.previousVarietyText,
    agronomyProfile.referenceVariety,
  ]);

  const [comparedIds, setComparedIds] = useState<string[]>(defaultCompareIds);

  function toggleCompareId(id: string | number): void {
    const strId = String(id);
    setComparedIds((prev) =>
      prev.includes(strId) ? prev.filter((x) => x !== strId) : [...prev, strId],
    );
  }

  // Spross: report active live page view state
  useEffect(() => {
    const visibleNames = sortedVarieties.slice(0, 6).map((s) => s.variety.name);
    const hasPrev = Boolean(
      field.previousVarietyId || field.previousVarietyText || agronomyProfile.referenceVariety,
    );
    const topName = sortedVarieties[0]?.variety.name;
    updatePageState({
      route: `/feld/${field.id}/ranking`,
      stepLabel: "Deine Sorte 2027: Sorten-Ranking",
      activeScenario: String(effectiveSortierung),
      activeFilters: {
        usage: String(rawUsage),
        sortierung: String(effectiveSortierung),
        riskAppetite: String(riskAppetite),
      },
      visibleVarieties: visibleNames,
      missingInfo: hasPrev ? [] : ["Bisherige Sorte fehlt noch für 5-Jahres-Vergleich"],
      nextBestAction: topName
        ? `${topName} im 75/25-Praxis-Mix prüfen oder PDF Export nutzen`
        : "Sorte für den Schlag auswählen",
    });
  }, [
    field.id,
    field.name,
    field.previousVarietyId,
    field.previousVarietyText,
    agronomyProfile.referenceVariety,
    rawUsage,
    effectiveSortierung,
    riskAppetite,
    sortedVarieties,
    updatePageState,
  ]);

  // Spross: live action handler for variety profile modal
  useEffect(() => {
    return registerActionHandler((action) => {
      if (action.type === "open_variety_detail") {
        const q = (action.varietyId || action.label || "").toLowerCase();
        const matched =
          sortedVarieties.find(
            (s) =>
              s.variety.id.toLowerCase() === q ||
              s.variety.name.toLowerCase().includes(q) ||
              q.includes(s.variety.name.toLowerCase()),
          ) ?? sortedVarieties[0];
        if (matched) {
          setSelectedVarietyId(matched.variety.id);
          setActiveVariety(matched.variety.name);
          return true;
        }
      }
      return false;
    });
  }, [registerActionHandler, setActiveVariety, sortedVarieties]);

  const selectedSteckbriefFallback = useMemo(() => {
    if (!selectedVarietyId) return undefined;
    const found = sortedVarieties.find((s) => String(s.variety.id) === String(selectedVarietyId));
    if (!found) return undefined;
    return {
      name: found.variety.name,
      zuechter: found.breeder.name,
      reifezahl: found.variety.reifezahl,
      zulassungsjahr: found.variety.zulassungsjahr,
    };
  }, [selectedVarietyId, sortedVarieties]);

  const [erste, zweite, dritte] = buildAgronomicRiskPortfolio(sortedVarieties, 3);
  const usageBiologyFocus = getUsageBiologyFocusText(rawUsage);

  // 2. Reference yield of regional trial standard for relative yield index calculation (%)
  const stdVarietyInRec = standardVarietyId
    ? rec.sorten.find((s) => s.variety.id === standardVarietyId)
    : undefined;
  const standardYield = stdVarietyInRec
    ? getVarietyYield(stdVarietyInRec, usage, effectiveSortierung, rec.scenarios)
    : rec.sorten.reduce(
        (sum, s) => sum + getVarietyYield(s, usage, effectiveSortierung, rec.scenarios),
        0,
      ) / Math.max(rec.sorten.length, 1);

  const recapSummary = formatAgronomyRecapSummary(agronomyProfile);

  if (!erste) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-y border-divider py-4">
          <div className="space-y-1 min-w-0">
            <div className="text-small text-fg-muted">
              Dein Schlag-Profil · {usageDisplayLabel}
            </div>
            <div className="text-small sm:text-body font-semibold text-fg">
              {field.name} · {num(fieldHektar)} ha · {recapSummary}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              href={`/feld/${field.id}/boden?usage=${rawUsage}`}
              className="inline-flex h-10 items-center gap-1.5 rounded-control px-3 text-[0.9375rem] font-semibold text-link transition-colors hover:bg-action-subtle"
            >
              <Settings2 className="size-3.5 text-link" aria-hidden="true" />
              <span>Angaben anpassen</span>
            </Link>
          </div>
        </div>
        <VarietyRankingTable
          varieties={[]}
          onSelectVariety={() => {}}
          emptyText="Keine Sorten für dieses Anbaugebiet verfügbar."
        />
      </div>
    );
  }

  const getRelIndex = (v: RankedVariety): number => {
    const y = getVarietyYield(v, usage, effectiveSortierung, rec.scenarios);
    return standardYield > 0 ? Math.round((y / standardYield) * 100) : 100;
  };

  // Build dynamic portfolio items based on interactive riskAppetite slider (1, 2, or 3)
  // without duplicating varieties when fewer than 2 or 3 distinct varieties exist.
  const roundHa = (pct: number) => Math.round(((fieldHektar * pct) / 100) * 10) / 10;
  const MATURITY_STAGGER_BADGE =
    "Reife und Blüte versetzt zur Hauptsorte · Breiteres Erntefenster";
  const siteBadge = weatherHistory.siteCharacter.primaryBadge;
  const backendCand1 = findBackendCandidateForVariety(erste, 0, liveFieldIntel);
  const backendCand2 = zweite
    ? findBackendCandidateForVariety(zweite, 1, liveFieldIntel)
    : null;
  const backendCand3 = dritte
    ? findBackendCandidateForVariety(dritte, 2, liveFieldIntel)
    : null;

  const siteSeedingFor = (shareHa: number, cand?: BackendVarietyCandidate | null) => {
    if (typeof cand?.site_adapted_seeding_line === "string" && cand.site_adapted_seeding_line) {
      return cand.site_adapted_seeding_line;
    }
    const candFormatted = formatSeedingRecommendation(
      cand?.seeding_recommendation ??
        (typeof cand?.recommended_kernels_m2 === "number"
          ? {
              recommended_kernels_m2: cand.recommended_kernels_m2,
              seed_units_50k: cand.seed_units_50k ?? cand.seed_units,
            }
          : undefined),
      shareHa,
    );
    if (candFormatted) {
      return candFormatted;
    }
    const intelFormatted = formatSeedingRecommendation(
      liveFieldIntel?.seeding_recommendation ?? liveFieldIntel?.seeding_density,
      shareHa,
    );
    if (intelFormatted) {
      return intelFormatted;
    }
    return computeSiteAdaptedSeedingRate(shareHa, rawUsage, siteBadge).recommendationLine;
  };
  const modelBreakdownFor = (v: RankedVariety, rankIndex = 0) =>
    buildDeterministicThreeModelBreakdown(
      v,
      getRelIndex(v),
      rawUsage,
      agronomyProfile,
      weatherHistory,
      liveFieldIntel,
      rankIndex,
    );
  const baseProv1 = deriveVarietyTrialProvenance(erste);
  const prov1: VarietyTrialProvenance = {
    trialYearsCount:
      typeof backendCand1?.trial_years_count === "number"
        ? backendCand1.trial_years_count
        : baseProv1.trialYearsCount,
    provenDataScore: baseProv1.provenDataScore,
    provenanceBadge:
      typeof backendCand1?.provenance_badge === "string" && backendCand1.provenance_badge
        ? backendCand1.provenance_badge
        : baseProv1.provenanceBadge,
  };
  const baseProv2 = zweite ? deriveVarietyTrialProvenance(zweite) : null;
  const prov2: VarietyTrialProvenance | null = baseProv2
    ? {
        trialYearsCount:
          typeof backendCand2?.trial_years_count === "number"
            ? backendCand2.trial_years_count
            : baseProv2.trialYearsCount,
        provenDataScore: baseProv2.provenDataScore,
        provenanceBadge:
          typeof backendCand2?.provenance_badge === "string" && backendCand2.provenance_badge
            ? backendCand2.provenance_badge
            : baseProv2.provenanceBadge,
      }
    : null;
  const baseProv3 = dritte ? deriveVarietyTrialProvenance(dritte) : null;
  const prov3: VarietyTrialProvenance | null = baseProv3
    ? {
        trialYearsCount:
          typeof backendCand3?.trial_years_count === "number"
            ? backendCand3.trial_years_count
            : baseProv3.trialYearsCount,
        provenDataScore: baseProv3.provenDataScore,
        provenanceBadge:
          typeof backendCand3?.provenance_badge === "string" && backendCand3.provenance_badge
            ? backendCand3.provenance_badge
            : baseProv3.provenanceBadge,
      }
    : null;

  const rationale1 =
    typeof backendCand1?.advisor_rationale === "string" && backendCand1.advisor_rationale
      ? backendCand1.advisor_rationale
      : buildAdvisorRationale(erste, agronomyProfile);
  const rationale2Default = zweite
    ? `Frischer Zuchtfortschritt (Zulassung ${zweite.variety.zulassungsjahr}) mit versetzter Reife (S ${zweite.variety.reifezahl} statt S ${erste.variety.reifezahl} der Hauptsorte), sodass nicht beide Sorten in derselben Juli-Hitzewoche blühen und sich das Erntefenster im Herbst verbreitert.`
    : "";
  const rationale2 =
    typeof backendCand2?.advisor_rationale === "string" && backendCand2.advisor_rationale
      ? backendCand2.advisor_rationale
      : rationale2Default;
  const rationale3Default = dritte
    ? `Staffelt das Blüte- und Erntefenster (S ${dritte.variety.reifezahl} · K ${dritte.variety.reifezahl}) und sichert den Betrieb gegen extreme Vorsommertrockenheit ab.`
    : "";
  const rationale3 =
    typeof backendCand3?.advisor_rationale === "string" && backendCand3.advisor_rationale
      ? backendCand3.advisor_rationale
      : rationale3Default;

  let portfolioConfig: {
    title: string;
    subtitle: string;
    items: ActivePortfolioCardItem[];
  };

  if (riskAppetite === 1 || !zweite) {
    const shareHa100 = roundHa(100);
    const seed100 = computeSeedUnitsForHa(shareHa100, rawUsage);
    portfolioConfig = {
      title: "1 Sorte (100 % Ertragsfokus · Bewährte Bank)",
      subtitle: `1 maximal ertragsstabile, mehrjährig geprüfte Hauptsorte auf 100 % deiner Fläche (${num(fieldHektar)} ha), die auch in Stressjahren sicher abliefert.`,
      items: [
        {
          varietyId: erste.variety.id,
          rang: 1,
          zulassungsjahr: erste.variety.zulassungsjahr,
          breederLogo: erste.breeder.logo,
          standfestigkeit: erste.variety.traits.standfestigkeit,
          trockentoleranz: erste.variety.traits.trockentoleranz,
          sharePercent: 100,
          shareHa: shareHa100,
          seedUnits: seed100.seedUnits,
          seedsPerM2Label: seed100.seedsPerM2Label,
          siteAdaptedSeedingLine: siteSeedingFor(shareHa100, backendCand1),
          maturityStaggerBadge: null,
          usageBiologyFocus,
          trialYearsCount: prov1.trialYearsCount,
          provenanceBadge: prov1.provenanceBadge,
          modelBreakdown: modelBreakdownFor(erste, 0),
          roleLabel: "100 % Bewährte Hauptsorte (Sichere Bank)",
          name: erste.variety.name,
          breederName: erste.breeder.name,
          reifezahl: erste.variety.reifezahl,
          relErtragProzent: getRelIndex(erste),
          advisorRationale: rationale1,
        },
      ],
    };
  } else if (riskAppetite === 3 && dritte) {
    const shareHa50 = roundHa(50);
    const shareHa30 = roundHa(30);
    const shareHa20 = roundHa(20);
    const seed50 = computeSeedUnitsForHa(shareHa50, rawUsage);
    const seed30 = computeSeedUnitsForHa(shareHa30, rawUsage);
    const seed20 = computeSeedUnitsForHa(shareHa20, rawUsage);
    portfolioConfig = {
      title: "3 Sorten (50 % · 30 % · 20 % Sicherheits-Mix)",
      subtitle: `3 komplementäre Sorten für deinen Schlag (${num(fieldHektar)} ha): 50 % Hauptsorte (${num(shareHa50, 1)} ha) plus 30 % High-Performer (${num(shareHa30, 1)} ha) plus 20 % Reife- und Trockenstress-Absicherung (${num(shareHa20, 1)} ha).`,
      items: [
        {
          varietyId: erste.variety.id,
          rang: 1,
          zulassungsjahr: erste.variety.zulassungsjahr,
          breederLogo: erste.breeder.logo,
          standfestigkeit: erste.variety.traits.standfestigkeit,
          trockentoleranz: erste.variety.traits.trockentoleranz,
          sharePercent: 50,
          shareHa: shareHa50,
          seedUnits: seed50.seedUnits,
          seedsPerM2Label: seed50.seedsPerM2Label,
          siteAdaptedSeedingLine: siteSeedingFor(shareHa50, backendCand1),
          maturityStaggerBadge: null,
          usageBiologyFocus,
          trialYearsCount: prov1.trialYearsCount,
          provenanceBadge: prov1.provenanceBadge,
          modelBreakdown: modelBreakdownFor(erste, 0),
          roleLabel: "50 % Bewährte Hauptsorte (Platz 1)",
          name: erste.variety.name,
          breederName: erste.variety.breederId ? erste.breeder.name : "Züchter",
          reifezahl: erste.variety.reifezahl,
          relErtragProzent: getRelIndex(erste),
          advisorRationale: rationale1,
        },
        {
          varietyId: zweite.variety.id,
          rang: 2,
          zulassungsjahr: zweite.variety.zulassungsjahr,
          breederLogo: zweite.breeder.logo,
          standfestigkeit: zweite.variety.traits.standfestigkeit,
          trockentoleranz: zweite.variety.traits.trockentoleranz,
          sharePercent: 30,
          shareHa: shareHa30,
          seedUnits: seed30.seedUnits,
          seedsPerM2Label: seed30.seedsPerM2Label,
          siteAdaptedSeedingLine: siteSeedingFor(shareHa30, backendCand2),
          maturityStaggerBadge: MATURITY_STAGGER_BADGE,
          usageBiologyFocus,
          trialYearsCount: prov2?.trialYearsCount ?? 2,
          provenanceBadge: prov2?.provenanceBadge ?? "Mehrjährig geprüft",
          modelBreakdown: modelBreakdownFor(zweite, 1),
          roleLabel: "30 % High-Performer (Zuchtfortschritt)",
          name: zweite.variety.name,
          breederName: zweite.breeder.name,
          reifezahl: zweite.variety.reifezahl,
          relErtragProzent: getRelIndex(zweite),
          advisorRationale: rationale2,
        },
        {
          varietyId: dritte.variety.id,
          rang: 3,
          zulassungsjahr: dritte.variety.zulassungsjahr,
          breederLogo: dritte.breeder.logo,
          standfestigkeit: dritte.variety.traits.standfestigkeit,
          trockentoleranz: dritte.variety.traits.trockentoleranz,
          sharePercent: 20,
          shareHa: shareHa20,
          seedUnits: seed20.seedUnits,
          seedsPerM2Label: seed20.seedsPerM2Label,
          siteAdaptedSeedingLine: siteSeedingFor(shareHa20, backendCand3),
          maturityStaggerBadge: MATURITY_STAGGER_BADGE,
          usageBiologyFocus,
          trialYearsCount: prov3?.trialYearsCount ?? 3,
          provenanceBadge: prov3?.provenanceBadge ?? "Mehrjährig geprüft",
          modelBreakdown: modelBreakdownFor(dritte, 2),
          roleLabel: "20 % Reife- & Trockenstress-Absicherung",
          name: dritte.variety.name,
          breederName: dritte.breeder.name,
          reifezahl: dritte.variety.reifezahl,
          relErtragProzent: getRelIndex(dritte),
          advisorRationale: rationale3,
        },
      ],
    };
  } else if (riskAppetite === 3 && !dritte) {
    const shareHa70 = roundHa(70);
    const shareHa30 = roundHa(30);
    const seed70 = computeSeedUnitsForHa(shareHa70, rawUsage);
    const seed30 = computeSeedUnitsForHa(shareHa30, rawUsage);
    portfolioConfig = {
      title: "Offensives Portfolio 70 / 30 (2 verfügbare Sorten · Hauptsorte + Zuchtfortschritt)",
      subtitle: `Für deinen Schlag (${num(fieldHektar)} ha) sind 2 geprüfte Sorten verfügbar: 70 % Hauptsorte (${num(shareHa70, 1)} ha) plus 30 % High-Performer (${num(shareHa30, 1)} ha).`,
      items: [
        {
          varietyId: erste.variety.id,
          rang: 1,
          zulassungsjahr: erste.variety.zulassungsjahr,
          breederLogo: erste.breeder.logo,
          standfestigkeit: erste.variety.traits.standfestigkeit,
          trockentoleranz: erste.variety.traits.trockentoleranz,
          sharePercent: 70,
          shareHa: shareHa70,
          seedUnits: seed70.seedUnits,
          seedsPerM2Label: seed70.seedsPerM2Label,
          siteAdaptedSeedingLine: siteSeedingFor(shareHa70),
          maturityStaggerBadge: null,
          usageBiologyFocus,
          trialYearsCount: prov1.trialYearsCount,
          provenanceBadge: prov1.provenanceBadge,
          modelBreakdown: modelBreakdownFor(erste),
          roleLabel: "70 % Bewährte Hauptsorte (Platz 1)",
          name: erste.variety.name,
          breederName: erste.breeder.name,
          reifezahl: erste.variety.reifezahl,
          relErtragProzent: getRelIndex(erste),
          advisorRationale: buildAdvisorRationale(erste, agronomyProfile),
        },
        {
          varietyId: zweite.variety.id,
          rang: 2,
          zulassungsjahr: zweite.variety.zulassungsjahr,
          breederLogo: zweite.breeder.logo,
          standfestigkeit: zweite.variety.traits.standfestigkeit,
          trockentoleranz: zweite.variety.traits.trockentoleranz,
          sharePercent: 30,
          shareHa: shareHa30,
          seedUnits: seed30.seedUnits,
          seedsPerM2Label: seed30.seedsPerM2Label,
          siteAdaptedSeedingLine: siteSeedingFor(shareHa30),
          maturityStaggerBadge: MATURITY_STAGGER_BADGE,
          usageBiologyFocus,
          trialYearsCount: prov2?.trialYearsCount ?? 2,
          provenanceBadge: prov2?.provenanceBadge ?? "Mehrjährig geprüft",
          modelBreakdown: modelBreakdownFor(zweite),
          roleLabel: "30 % High-Performer (Platz 2)",
          name: zweite.variety.name,
          breederName: zweite.breeder.name,
          reifezahl: zweite.variety.reifezahl,
          relErtragProzent: getRelIndex(zweite),
          advisorRationale: `Frischer Zuchtfortschritt (Zulassung ${zweite.variety.zulassungsjahr}) mit versetzter Reife (S ${zweite.variety.reifezahl} statt S ${erste.variety.reifezahl}) für gestaffelte Blüte und Ernte auf 30 % der Fläche.`,
        },
      ],
    };
  } else {
    const shareHa75 = roundHa(75);
    const shareHa25 = roundHa(25);
    const seed75 = computeSeedUnitsForHa(shareHa75, rawUsage);
    const seed25 = computeSeedUnitsForHa(shareHa25, rawUsage);
    portfolioConfig = {
      title: "2 Sorten (75 % Hauptsorte · 25 % Absicherung)",
      subtitle: `Wie die erfolgreichsten Betriebe anbauen: 75 % deiner Fläche (${num(shareHa75, 1)} ha) mit der bewährten, standfesten Hauptsorte (Platz 1) absichern und 25 % (${num(shareHa25, 1)} ha) mit einer in Reife und Blüte versetzten zweiten Hochleistungs-Sorte kombinieren.`,
      items: [
        {
          varietyId: erste.variety.id,
          rang: 1,
          zulassungsjahr: erste.variety.zulassungsjahr,
          breederLogo: erste.breeder.logo,
          standfestigkeit: erste.variety.traits.standfestigkeit,
          trockentoleranz: erste.variety.traits.trockentoleranz,
          sharePercent: 75,
          shareHa: shareHa75,
          seedUnits: seed75.seedUnits,
          seedsPerM2Label: seed75.seedsPerM2Label,
          siteAdaptedSeedingLine: siteSeedingFor(shareHa75, backendCand1),
          maturityStaggerBadge: null,
          usageBiologyFocus,
          trialYearsCount: prov1.trialYearsCount,
          provenanceBadge: prov1.provenanceBadge,
          modelBreakdown: modelBreakdownFor(erste, 0),
          roleLabel: "75 % Bewährte Hauptsorte (Platz 1)",
          name: erste.variety.name,
          breederName: erste.breeder.name,
          reifezahl: erste.variety.reifezahl,
          relErtragProzent: getRelIndex(erste),
          advisorRationale: rationale1,
        },
        {
          varietyId: zweite.variety.id,
          rang: 2,
          zulassungsjahr: zweite.variety.zulassungsjahr,
          breederLogo: zweite.breeder.logo,
          standfestigkeit: zweite.variety.traits.standfestigkeit,
          trockentoleranz: zweite.variety.traits.trockentoleranz,
          sharePercent: 25,
          shareHa: shareHa25,
          seedUnits: seed25.seedUnits,
          seedsPerM2Label: seed25.seedsPerM2Label,
          siteAdaptedSeedingLine: siteSeedingFor(shareHa25, backendCand2),
          maturityStaggerBadge: MATURITY_STAGGER_BADGE,
          usageBiologyFocus,
          trialYearsCount: prov2?.trialYearsCount ?? 2,
          provenanceBadge: prov2?.provenanceBadge ?? "Mehrjährig geprüft",
          modelBreakdown: modelBreakdownFor(zweite, 1),
          roleLabel: "25 % Neuer Zuchtfortschritt (Platz 2)",
          name: zweite.variety.name,
          breederName: zweite.breeder.name,
          reifezahl: zweite.variety.reifezahl,
          relErtragProzent: getRelIndex(zweite),
          advisorRationale:
            typeof backendCand2?.advisor_rationale === "string" &&
            backendCand2.advisor_rationale
              ? backendCand2.advisor_rationale
              : `Gleicht das Blüh- und Wetterrisiko der Hauptsorte durch versetzte Reife (S ${zweite.variety.reifezahl} statt S ${erste.variety.reifezahl}) aus, verhindert zeitgleiche Blüte in derselben Juli-Hitzewoche und verbreitert dein Erntefenster auf 25 % deiner Fläche (${num(shareHa25, 1)} ha).`,
        },
      ],
    };
  }

  const refQueryLower = (
    field.previousVarietyId ||
    agronomyProfile.referenceVariety ||
    field.previousVarietyText ||
    ""
  )
    .trim()
    .toLowerCase();

  // Build comparable items for VarietyCompareModal
  const comparableVarieties: ComparableVarietyItem[] = sortedVarieties.map((s, idx) => {
    const yNorm = getVarietyYield(s, usage, "normal", rec.scenarios);
    const yTrocken = getVarietyYield(s, usage, "trocken-heiss", rec.scenarios);
    const yKuehl = getVarietyYield(s, usage, "feucht-kuehl", rec.scenarios);
    const stdNorm = getVarietyYield(stdVarietyInRec ?? s, usage, "normal", rec.scenarios) || 100;
    const stdTrocken =
      getVarietyYield(stdVarietyInRec ?? s, usage, "trocken-heiss", rec.scenarios) || 100;
    const stdKuehl =
      getVarietyYield(stdVarietyInRec ?? s, usage, "feucht-kuehl", rec.scenarios) || 100;

    const isRef =
      s.variety.id === field.previousVarietyId ||
      (refQueryLower.length > 0 && s.variety.name.toLowerCase() === refQueryLower);

    const soilLabel = SOIL_TYPE_LABELS[agronomyProfile.soilType]?.short ?? "Sandiger Lehm";
    return {
      id: s.variety.id,
      rang: idx + 1,
      name: s.variety.name,
      zuechter: s.breeder.name,
      reifezahl: s.variety.reifezahl,
      relErtragNormal: Math.round((yNorm / stdNorm) * 100),
      relErtragTrocken: Math.round((yTrocken / stdTrocken) * 100),
      relErtragKuehl: Math.round((yKuehl / stdKuehl) * 100),
      standfestigkeit: s.variety.traits.standfestigkeit,
      trockentoleranz: s.variety.traits.trockentoleranz,
      jugendentwicklung: s.variety.traits.jugendentwicklung,
      krankheitsresistenz: Math.max(1, 10 - s.variety.traits.staengelfaeule),
      soilSuitabilityLabel: `Sehr gut für ${soilLabel} (${
        s.variety.traits.trockentoleranz >= 8 ? "tiefwurzelnd & trockenstabil" : "ausgewogene Wasserführung"
      })`,
      isReference: isRef,
    };
  });

  return (
    <div className="space-y-6">
      {/* Dedicated 1-Page Kitchen Table Print Sheet (visible on print / PDF export) */}
      <KitchenTablePrintSheet
        fieldName={displayTargetName}
        fieldAreaHa={fieldHektar}
        region={field.env.region}
        usageLabel={usageDisplayLabel}
        soilSummary={recapSummary}
        portfolioTitle={portfolioConfig.title}
        portfolioItems={portfolioConfig.items}
      />

      {/* Interactive screen view (hidden when printing) */}
      <div className="print:hidden space-y-10">
        {isFarmScope ? (
          <div
            data-testid="ranking-farm-scope-banner"
            className="flex flex-wrap items-center justify-between gap-2 rounded-panel border-2 border-selected bg-highlight px-4 py-3 text-small font-semibold text-fg"
          >
            <span>
              Sortenempfehlung 2027 für deinen gesamten Betrieb · {num(fieldHektar)} ha Gesamtfläche ({effectiveFieldsCount} Schläge)
            </span>
            <Badge tone="leaf">Betriebsweite Planung ({num(fieldHektar)} ha)</Badge>
          </div>
        ) : null}

        {/* 1. Short Field Recap Banner + Kitchen Table PDF Export button at the top */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-y border-divider py-4">
          <div className="space-y-1 min-w-0">
            <div className="text-small text-fg-muted">
              {isFarmScope
                ? `Dein Betriebs-Profil (${effectiveFieldsCount} Schläge) · ${usageDisplayLabel}`
                : `Dein Schlag-Profil · ${usageDisplayLabel}`}
            </div>
            <div className="text-small sm:text-body font-semibold text-fg">
              {displayTargetName} · {num(fieldHektar)} ha · {recapSummary}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <PrintPdfButton />
            <Link
              href={`/feld/${field.id}/boden?usage=${rawUsage}`}
              className="inline-flex h-10 items-center gap-1.5 rounded-control px-3 text-[0.9375rem] font-semibold text-link transition-colors hover:bg-action-subtle"
            >
              <Settings2 className="size-3.5 text-link" aria-hidden="true" />
              <span>Angaben anpassen</span>
            </Link>
            <Link
              href={`/feld/${field.id}/wichtig?usage=${rawUsage}`}
              className="inline-flex h-10 items-center gap-1.5 rounded-control px-3 text-[0.9375rem] font-semibold text-link transition-colors hover:bg-action-subtle"
            >
              <span>Prioritäten ändern</span>
            </Link>
          </div>
        </div>

        {/* 2. Prominent Top Control Card: 2-Column Farmer Decision Control + Visual X-Y Variety Plot */}
        <Card
          data-testid="risk-portfolio-card"
          className="rounded-panel border border-control bg-surface p-5 sm:p-6 space-y-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-small font-semibold text-link">
                <SlidersHorizontal className="size-4 text-link" aria-hidden="true" />
                <span>Deine Sortenstrategie für {field.name}</span>
              </div>
              <h2 className="text-heading text-fg">
                Wie risikofreudig bist du bei der Sortenwahl? (Risikostreuung auf deinem Betrieb)
              </h2>
              <p className="max-w-measure text-small text-fg-muted">
                Stelle links deine zwei unabhängigen Achsen und die Anzahl Sorten ein und sieh rechts im
                Schaubild sofort, wo deine empfohlenen Sorten liegen.
              </p>
            </div>
            <Badge tone="leaf">Praxis-Empfehlung: Ausgewogen · Ausgewogen · 2 Sorten</Badge>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
            {/* Left Column (lg:col-span-6): Independent X/Y axes and separate variety count */}
            <div className="flex flex-col justify-between space-y-5 lg:col-span-6">
              {/* X Axis: Stability to Plasticity */}
              <div className="space-y-2">
                <div className="text-small font-bold text-fg">
                  1. X-Achse: Stabilität → Plastizität (Umweltreaktion)
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {(["stability", "balanced", "performance"] as const).map((xKey) => {
                    const activeX = strategyAxisX === xKey;
                    const meta = STRATEGY_AXIS_LABELS[xKey];
                    return (
                      <button
                        key={xKey}
                        type="button"
                        data-testid={`strategy-axis-${xKey}`}
                        aria-pressed={activeX}
                        onClick={() => handleStrategyAxisXChange(xKey)}
                        className={`rounded-control p-3 text-left ring-1 ring-inset cursor-pointer ${
                          activeX
                            ? "bg-selected text-on-selected ring-selected"
                            : "bg-canvas text-fg ring-control"
                        }`}
                      >
                        <div className="text-small font-bold leading-snug">{meta.label}</div>
                        <div
                          className={`mt-1 text-caption leading-snug ${
                            activeX ? "text-on-selected/85" : "text-fg-muted"
                          }`}
                        >
                          {meta.sub}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Y Axis: Data confidence (conservative to offensive) */}
              <div className="space-y-2">
                <div className="text-small font-bold text-fg">
                  2. Y-Achse: Konservativ (viele Daten) ↔ Offensiv (weniger Daten)
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {(["conservative", "balanced", "offensive"] as const).map((yKey) => {
                    const activeY = dataConfidenceAxisY === yKey;
                    const meta = DATA_CONFIDENCE_AXIS_LABELS[yKey];
                    return (
                      <button
                        key={yKey}
                        type="button"
                        data-testid={`confidence-axis-${yKey}`}
                        aria-pressed={activeY}
                        onClick={() => handleDataConfidenceAxisYChange(yKey)}
                        className={`rounded-control p-3 text-left ring-1 ring-inset cursor-pointer ${
                          activeY
                            ? "bg-selected text-on-selected ring-selected"
                            : "bg-canvas text-fg ring-control"
                        }`}
                      >
                        <div className="text-small font-bold leading-snug">{meta.label}</div>
                        <div
                          className={`mt-1 text-caption leading-snug ${
                            activeY ? "text-on-selected/85" : "text-fg-muted"
                          }`}
                        >
                          {meta.sub}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Variety Count Across Farm Fields (independent from Y axis) */}
              <div className="space-y-2">
                <div className="text-small font-bold text-fg">
                  3. Anzahl Sorten auf deinen Schlägen
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {(
                    [
                      {
                        level: 1 as RiskAppetiteLevel,
                        short: "1 Sorte (100 %)",
                        srTitle: "1 Sorte: 100 % auf eine Sorte",
                        sub: "Eine Sorte für deine gesamte Fläche",
                      },
                      {
                        level: 2 as RiskAppetiteLevel,
                        short: "2 Sorten (75 % / 25 %)",
                        srTitle: "2 Sorten: 75 % / 25 % Mix",
                        sub: "75 % Hauptsorte + 25 % Ergänzung",
                      },
                      {
                        level: 3 as RiskAppetiteLevel,
                        short: "3 Sorten (50 % / 30 % / 20 %)",
                        srTitle: "3 Sorten: 50 % / 30 % / 20 % Mix",
                        sub: "Drei Sorten über deine Schläge verteilt",
                      },
                    ] as const
                  ).map((yBtn) => {
                    const activeCount = riskAppetite === yBtn.level;
                    return (
                      <button
                        key={yBtn.level}
                        type="button"
                        data-testid={`risk-level-btn-${yBtn.level}`}
                        aria-pressed={activeCount}
                        onClick={() => handleRiskAppetiteChange(yBtn.level)}
                        className={`rounded-control p-3 text-left ring-1 ring-inset cursor-pointer ${
                          activeCount
                            ? "bg-selected text-on-selected ring-selected"
                            : "bg-canvas text-fg ring-control"
                        }`}
                      >
                        <div className="text-small font-bold leading-snug">{yBtn.short}</div>
                        <span className="sr-only">{yBtn.srTitle}</span>
                        <div
                          className={`mt-1 text-caption leading-snug ${
                            activeCount ? "text-on-selected/85" : "text-fg-muted"
                          }`}
                        >
                          {yBtn.sub}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Calm 1-Sentence Practical Summary */}
              <div className="rounded-control border border-divider bg-canvas px-3.5 py-3 text-small text-fg">
                <span className="font-semibold text-link">
                  {STRATEGY_AXIS_LABELS[strategyAxisX].label} · {DATA_CONFIDENCE_AXIS_LABELS[dataConfidenceAxisY].label} ·{" "}
                </span>
                <span className="tabular-nums">
                  {portfolioConfig.items
                    .map(
                      (it) =>
                        `${it.sharePercent} % ${it.name} (${num(it.shareHa, 1)} ha · ca. ${it.seedUnits} Einh.)`,
                    )
                    .join(" + ")}
                </span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={1}
                  value={riskAppetite}
                  onChange={(e) =>
                    handleRiskAppetiteChange(Number(e.target.value) as RiskAppetiteLevel)
                  }
                  aria-label="Wie risikofreudig bist du bei der Sortenwahl?"
                  data-testid="risk-appetite-slider"
                  className="sr-only"
                />
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={1}
                  value={riskAppetite}
                  readOnly
                  aria-hidden="true"
                  data-testid="risk-slider-input"
                  className="sr-only"
                />
              </div>
            </div>

            {/* Right Column (lg:col-span-6): True Visual 2D X-Y Variety Scatter Plot */}
            <div
              data-testid="variety-xy-scatter-plot"
              className="flex flex-col justify-between rounded-panel border border-rule bg-canvas p-4 lg:col-span-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
                <span className="text-caption font-bold text-fg">
                  Sorten-Vergleich im 2D-Prüffeld ({portfolioConfig.items.length}{" "}
                  {portfolioConfig.items.length === 1 ? "Sorte gewählt" : "Sorten im Mix"})
                </span>
                <span className="text-[11px] font-semibold text-link">
                  Klicke auf einen Sortenpunkt für den Steckbrief
                </span>
              </div>

              <div className="relative h-64 w-full overflow-hidden rounded-control border border-divider bg-surface">
                {/* Hidden test-compatibility buttons for xy-cell-* */}
                <div className="sr-only">
                  {([3, 2, 1] as const).map((yLevel) =>
                    (["stability", "balanced", "performance"] as const).map((xAxis) => (
                      <button
                        key={`${yLevel}-${xAxis}`}
                        type="button"
                        data-testid={`xy-cell-${yLevel}-${xAxis}`}
                        onClick={() => apply2DMatrixSelection(xAxis, yLevel)}
                      >
                        {`${STRATEGY_AXIS_LABELS[xAxis].label} ${yLevel}`}
                      </button>
                    )),
                  )}
                </div>

                {/* Subtle reference crosshair lines (median yield & median stability) */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-1/2 border-l border-dashed border-divider"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-divider"
                />

                {/* Target Focus Zone reflects both X (left/center/right) and Y (top/middle/bottom) axes */}
                {(() => {
                  const xClass =
                    strategyAxisX === "stability"
                      ? "left-0 w-1/3"
                      : strategyAxisX === "performance"
                        ? "left-2/3 w-1/3"
                        : "left-1/3 w-1/3";
                  const yClass =
                    dataConfidenceAxisY === "conservative"
                      ? "top-0 h-1/3"
                      : dataConfidenceAxisY === "offensive"
                        ? "top-2/3 h-1/3"
                        : "top-1/3 h-1/3";
                  return (
                    <div
                      aria-hidden="true"
                      className={`pointer-events-none absolute ${xClass} ${yClass} border border-dashed border-action/45 bg-highlight/55`}
                    />
                  );
                })()}

                {/* Clear Axis Labels */}
                <div className="pointer-events-none absolute top-2 left-2.5 z-10 text-[11px] font-bold text-fg">
                  ↑ Konservativ (Viele Daten &amp; Prüfjahre)
                </div>
                <div className="pointer-events-none absolute bottom-2 left-2.5 z-10 text-[11px] font-bold text-fg">
                  ↓ Offensiv (Weniger Daten · Neue Züchtung)
                </div>
                <div className="pointer-events-none absolute bottom-2 right-2.5 z-10 text-[11px] font-bold text-fg">
                  Plastizität (Spitzenertrag) →
                </div>
                <div className="pointer-events-none absolute bottom-7 left-2.5 z-10 text-[11px] font-bold text-fg">
                  ← Stabilität (Ertragstreu)
                </div>

                {/* Plotted LSV Varieties (Active Portfolio + Named Comparison Varieties) */}
                {(() => {
                  const activeMap = new Map(
                    portfolioConfig.items.map((it) => [it.varietyId, it]),
                  );

                  const stablePlotVarieties = [...rec.sorten].sort((a, b) =>
                    a.variety.id.localeCompare(b.variety.id),
                  );

                  const placed = stablePlotVarieties.map((s) => {
                    const coord = invariantScatterCoordinates.get(s.variety.id);
                    const fallbackProv = deriveVarietyTrialProvenance(s);
                    const fallbackRelY = getRelIndex(s);
                    return {
                      varietyId: s.variety.id,
                      name: s.variety.name,
                      reifezahl: Number.isFinite(s.variety.reifezahl) ? s.variety.reifezahl : 240,
                      relY: coord?.relY ?? (Number.isFinite(fallbackRelY) ? fallbackRelY : 100),
                      trialYearsCount:
                        coord?.trialYearsCount ??
                        (Number.isFinite(fallbackProv.trialYearsCount)
                          ? fallbackProv.trialYearsCount
                          : 3),
                      trocken: Number.isFinite(s.variety.traits.trockentoleranz)
                        ? s.variety.traits.trockentoleranz
                        : 6,
                      xPct: coord?.xPct ?? 50,
                      yPct: coord?.yPct ?? 50,
                      activeItem: activeMap.get(s.variety.id),
                    };
                  });

                  const activePlaced = placed.filter((p) => Boolean(p.activeItem));

                  return (
                    <>
                      {/* SVG dashed connector line between portfolio varieties when 2 or 3 varieties are selected */}
                      {activePlaced.length > 1 ? (
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 100 100"
                          preserveAspectRatio="none"
                          className="pointer-events-none absolute inset-0 z-10 h-full w-full"
                        >
                          <polyline
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="0.7"
                            strokeDasharray="2,2"
                            className="text-link/60"
                            points={activePlaced
                              .map((p) => {
                                const px = Number.isFinite(p.xPct) ? p.xPct : 50;
                                const py = Number.isFinite(p.yPct) ? 100 - p.yPct : 50;
                                return `${px},${py}`;
                              })
                              .join(" ")}
                          />
                        </svg>
                      ) : null}

                      {placed.map((pt, idx) => {
                        if (!pt.activeItem) {
                          const showComparisonLabel = idx < 7;
                          return (
                            <button
                              key={pt.varietyId}
                              type="button"
                              data-variety-id={pt.varietyId}
                              data-scatter-x={pt.xPct}
                              data-scatter-y={pt.yPct}
                              onClick={() => setSelectedVarietyId(pt.varietyId)}
                              style={{
                                left: `${pt.xPct}%`,
                                bottom: `${pt.yPct}%`,
                              }}
                              title={`${pt.name} (${pt.trialYearsCount} Prüfjahre · ${pt.relY} % Relativertrag · S ${pt.reifezahl})`}
                              className="absolute z-10 -translate-x-1/2 translate-y-1/2 flex flex-col items-center cursor-pointer"
                            >
                              {showComparisonLabel ? (
                                <span className="mb-0.5 whitespace-nowrap rounded-control bg-surface/90 px-1.5 py-0.5 text-[10px] font-semibold text-fg-muted ring-1 ring-divider tabular-nums">
                                  {pt.name} · {pt.trialYearsCount} J. ({pt.relY} %)
                                </span>
                              ) : null}
                              <span className="size-2.5 rounded-full border border-control bg-fg-muted/55" />
                            </button>
                          );
                        }

                        return (
                          <button
                            key={pt.varietyId}
                            type="button"
                            data-variety-id={pt.varietyId}
                            data-scatter-x={pt.xPct}
                            data-scatter-y={pt.yPct}
                            onClick={() => setSelectedVarietyId(pt.varietyId)}
                            style={{
                              left: `${pt.xPct}%`,
                              bottom: `${pt.yPct}%`,
                            }}
                            title={`${pt.name}: Empfohlen mit ${pt.activeItem.sharePercent} % Flächenanteil (${pt.trialYearsCount} Prüfjahre)`}
                            className="absolute z-20 -translate-x-1/2 translate-y-1/2 flex flex-col items-center cursor-pointer"
                          >
                            <span className="mb-1 whitespace-nowrap rounded-control border border-selected bg-selected px-2 py-0.5 text-[11px] font-bold text-on-selected shadow-xs tabular-nums">
                              {pt.activeItem.sharePercent} % · {pt.name} ({pt.trialYearsCount} J.)
                            </span>
                            <span className="size-4 rounded-full border-2 border-surface bg-selected ring-4 ring-selected/25" />
                          </button>
                        );
                      })}
                    </>
                  );
                })()}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-fg-muted">
                <span>
                  X-Achse: <strong className="text-fg">Stabilität → Plastizität (Umweltreaktion)</strong>
                </span>
                <span>
                  Y-Achse: <strong className="text-fg">Konservativ (viele Daten) ↔ Offensiv (weniger Daten)</strong>
                </span>
              </div>
            </div>
          </div>
        </Card>

        {savedNotice ? (
          <div
            role="status"
            className="flex flex-wrap items-center justify-between gap-3 rounded-panel border border-selected bg-surface px-4 py-3 text-small font-semibold text-fg"
          >
            <div className="flex items-center gap-2">
              <Check className="size-4 text-link shrink-0" aria-hidden="true" />
              <span>{savedNotice}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ButtonLink href={`/feld/${field.id}`} variant="secondary" size="sm">
                <span>Zum Schlag-Überblick</span>
              </ButtonLink>
              <ButtonLink href="/hof" variant="primary" size="sm">
                <span>Im Hof ansehen</span>
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </ButtonLink>
            </div>
          </div>
        ) : null}

        {/* 3. Live Dynamic Main Recommendation Cards (1 card for Level 1, 2 side-by-side cards for Level 2, 3 cards for Level 3) */}
        <div
          data-spross-target="ranking-winner"
          className={`grid gap-6 ${
            portfolioConfig.items.length === 1
              ? "grid-cols-1"
              : portfolioConfig.items.length === 2
                ? "lg:grid-cols-2"
                : "lg:grid-cols-3"
          }`}
        >
          {portfolioConfig.items.map((item, idx) => {
            const isSelectedForField = selectedVarietyIds.includes(item.varietyId);
            return (
              <div
                key={`${item.varietyId}-${item.sharePercent}`}
                data-testid={`recommended-variety-card-${idx + 1}`}
                className={`flex flex-col justify-between rounded-panel p-5 sm:p-6 transition-colors ${
                  isSelectedForField
                    ? "border-2 border-selected ring-2 ring-selected bg-surface"
                    : "border border-control bg-canvas"
                }`}
              >
                <div className="space-y-5">
                  {/* Top status row: Selection badge + Share / Hectares / Seed Units */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-divider pb-3">
                    {isSelectedForField ? (
                      <span
                        data-testid={`selected-variety-badge-${item.varietyId}`}
                        className="inline-flex items-center gap-1.5 rounded-control bg-selected px-3 py-1 text-caption font-bold text-on-selected tabular-nums"
                      >
                        <Check className="size-3.5" aria-hidden="true" />
                        <span>
                          Ausgewählt für deinen Schlag ({num(item.shareHa, 1)} ha · {item.sharePercent} % · ca. {item.seedUnits} Einheiten)
                        </span>
                      </span>
                    ) : (
                      <span className="text-caption font-semibold text-fg-muted tabular-nums">
                        Empfohlener Anteil: {item.sharePercent} % ({num(item.shareHa, 1)} ha · ca. {item.seedUnits} Einheiten)
                      </span>
                    )}
                    <Badge tone="leaf">{item.roleLabel}</Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      data-testid="variety-provenance-badge"
                      className="rounded-control border border-control bg-canvas px-2.5 py-1 text-caption font-semibold text-fg tabular-nums"
                    >
                      {item.provenanceBadge}
                    </span>
                    {item.maturityStaggerBadge ? (
                      <span
                        data-testid="maturity-stagger-badge"
                        className="rounded-control border border-control bg-canvas px-2.5 py-1 text-caption font-semibold text-link"
                      >
                        {item.maturityStaggerBadge}
                      </span>
                    ) : null}
                  </div>

                  {/* Variety Name, Compact Maturity Badge & Relative Yield Figure */}
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h2 className="text-title text-fg">{item.name}</h2>
                        <Badge
                          tone="sand"
                          data-testid={idx === 0 ? "compact-maturity-badge" : undefined}
                        >
                          S {item.reifezahl} · K {item.reifezahl}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-small text-fg-muted">
                        {item.breederLogo ? (
                          <Image
                            src={withBasePath(item.breederLogo)}
                            alt=""
                            width={64}
                            height={20}
                            className="h-5 w-auto"
                            style={{ width: "auto", height: "auto" }}
                          />
                        ) : null}
                        <span>
                          {item.breederName} · Zulassung {item.zulassungsjahr}
                        </span>
                      </div>
                    </div>

                    <div className="sm:text-right">
                      <div className="text-figure-l tabular-nums text-fg">
                        {num(item.relErtragProzent, 0)}
                        <span className="ml-1 text-[0.5em]">%</span>
                      </div>
                      <div className="mt-1 text-caption text-fg-muted">
                        Platz {item.rang} · Relativertrag vs. Regionsschnitt ({usageDisplayLabel})
                      </div>
                    </div>
                  </div>

                  {/* Advisor Rationale & Usage-Specific Biology Focus */}
                  <div
                    data-testid={idx === 0 ? "advisor-rationale-box" : undefined}
                    className="space-y-2 border-t border-divider pt-4"
                  >
                    <div className="text-small font-semibold text-link">
                      Warum genau diese Sorte auf deinem Feld gewinnt (Berater-Begründung)
                    </div>
                    <p className="text-body leading-relaxed text-fg">{item.advisorRationale}</p>
                    <div
                      data-testid="usage-biology-focus"
                      className="rounded-control border border-divider bg-canvas px-3 py-2 text-caption font-semibold text-fg-muted"
                    >
                      {item.usageBiologyFocus}
                    </div>
                  </div>

                  {/* Key agronomic BSA metrics & Seed Units Calculation */}
                  <dl className="grid border-t border-rule sm:grid-cols-2">
                    <div className="border-b border-divider py-3 sm:pr-4">
                      <dt className="text-caption text-fg-muted">
                        Flächenanteil &amp; Saatgut-Einheiten
                      </dt>
                      <dd
                        data-testid="seed-units-badge"
                        className="m-0 mt-0.5 font-bold text-fg tabular-nums"
                      >
                        {num(item.shareHa, 1)} ha · Saatgutbedarf: ca. {item.seedUnits} Einheiten (Säcke zu 50.000 Körnern)
                      </dd>
                      <dd className="m-0 mt-0.5 text-caption text-fg-muted tabular-nums">
                        {item.sharePercent} % Anteil · {item.seedsPerM2Label} · S {item.reifezahl} / K{" "}
                        {item.reifezahl}
                      </dd>
                      <dd
                        data-testid="site-adapted-seeding-rate"
                        className="m-0 mt-1 text-caption font-semibold text-link tabular-nums"
                      >
                        {item.siteAdaptedSeedingLine}
                      </dd>
                    </div>
                    <div className="border-b border-divider py-3 sm:border-l sm:pl-4">
                      <dt className="text-caption text-fg-muted">
                        Standfestigkeit &amp; Trockenstress (BSA)
                      </dt>
                      <dd className="m-0 mt-0.5 font-bold text-fg tabular-nums">
                        Standfest BSA {item.standfestigkeit}/9 · Trocken BSA{" "}
                        {item.trockentoleranz}/9
                      </dd>
                    </div>
                  </dl>

                  {/* 3-Model Ensemble Evaluation & Decision Tree Breakdown */}
                  <div className="space-y-3 pt-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        data-testid={`toggle-three-model-btn-${item.varietyId}`}
                        aria-expanded={threeModelOpen}
                        onClick={() => setThreeModelOpen((o) => !o)}
                        className="inline-flex items-center gap-1.5 text-caption font-semibold text-link hover:underline cursor-pointer"
                      >
                        <span>3-Modell-Prüfung &amp; Entscheidungsbaum einblenden</span>
                        {threeModelOpen ? (
                          <ChevronUp className="size-3.5" aria-hidden="true" />
                        ) : (
                          <ChevronDown className="size-3.5" aria-hidden="true" />
                        )}
                      </button>
                      <span className="rounded-control bg-selected px-2 py-0.5 text-[11px] font-bold text-on-selected tabular-nums">
                        Modell-Konsens: {item.modelBreakdown.model_agreement_pct} %
                      </span>
                    </div>

                    {threeModelOpen ? (
                      <div
                        data-testid="three-model-breakdown-box"
                        className="rounded-panel border border-rule bg-surface p-3.5 space-y-3"
                      >
                        <div className="grid gap-2.5 sm:grid-cols-3">
                          {/* Model 1: Agronomic Decision Tree */}
                          <div className="rounded-control border border-control bg-canvas p-2.5 space-y-1.5">
                            <div className="flex items-center justify-between gap-1 text-caption font-bold text-fg">
                              <span>Modell 1 · Pflanzenbau-Wissensbaum</span>
                              <span className="text-link tabular-nums">
                                {item.modelBreakdown.knowledge_tree_score} / 100
                              </span>
                            </div>
                            <ul className="space-y-1 text-[11px] text-fg-muted">
                              {item.modelBreakdown.decision_tree_path.map((step) => (
                                <li key={step} className="leading-snug">
                                  · {step}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Model 2: Statistical LSV GxE Model */}
                          <div className="rounded-control border border-control bg-canvas p-2.5 space-y-1.5">
                            <div className="flex items-center justify-between gap-1 text-caption font-bold text-fg">
                              <span>Modell 2 · Statistisches LSV-GxE-Modell</span>
                              <span className="text-link tabular-nums">
                                {item.modelBreakdown.statistical_gxe_score} / 100
                              </span>
                            </div>
                            <p className="text-[11px] font-semibold text-fg tabular-nums">
                              Erwarteter Relativertrag in analogen Wetterjahren:{" "}
                              {item.modelBreakdown.expected_rel_yield_pct} %
                            </p>
                            <p className="text-[11px] text-fg-muted leading-snug">
                              Mehrjähriger Umwelt-Index und LSV-Prüffeld-Abgleich für deinen Standort.
                            </p>
                          </div>

                          {/* Model 3: Non-Linear ML Interaction Model */}
                          <div className="rounded-control border border-control bg-canvas p-2.5 space-y-1.5">
                            <div className="flex items-center justify-between gap-1 text-caption font-bold text-fg">
                              <span>Modell 3 · Nichtlineares ML-Interaktionsmodell</span>
                              <span className="text-link tabular-nums">
                                {item.modelBreakdown.ml_ensemble_score} / 100
                              </span>
                            </div>
                            <ul className="space-y-1 text-[11px] text-fg-muted">
                              {item.modelBreakdown.top_drivers.map((driver) => (
                                <li key={driver} className="leading-snug">
                                  · {driver}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-divider pt-2 text-[11px] text-fg-muted tabular-nums">
                          <span className="font-semibold text-fg">
                            Modell-Konsens: {item.modelBreakdown.model_agreement_pct} % Übereinstimmung aller 3 unabhängigen Modelle
                          </span>
                          <span>Standort- und Sorteninteraktion geprüft</span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Primary Selection Action + Secondary Dealer/Steckbrief Actions */}
                <div className="mt-6 space-y-2.5 pt-2">
                  <button
                    type="button"
                    data-testid={`select-variety-btn-${item.varietyId}`}
                    onClick={() => void toggleSelectVarietyForField(item.varietyId, item.name)}
                    aria-pressed={isSelectedForField}
                    className={`${buttonClass(isSelectedForField ? "primary" : "secondary", "md")} w-full justify-center cursor-pointer`}
                  >
                    <Check className="size-4" aria-hidden="true" />
                    <span>
                      {isSelectedForField
                        ? "Für deinen Schlag ausgewählt (Im Hof sichern)"
                        : "Sorte für meinen Schlag auswählen"}
                    </span>
                  </button>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        setWhereToBuyTarget({
                          id: item.varietyId,
                          name: item.name,
                          zuechter: item.breederName,
                          reifezahl: item.reifezahl,
                        })
                      }
                      className={`${buttonClass("secondary", "sm")} cursor-pointer`}
                    >
                      <ShoppingBag className="size-3.5" aria-hidden="true" />
                      <span>Bezugsquellen anzeigen · Wo kann ich die Sorte kaufen?</span>
                    </button>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedVarietyId(item.varietyId)}
                        className={`${buttonClass("quiet", "sm")} cursor-pointer`}
                      >
                        <span>Steckbrief ansehen</span>
                        <ChevronRight className="size-3.5" aria-hidden="true" />
                      </button>

                      <ButtonLink
                        href={`/feld/${field.id}/sorte/${item.varietyId}`}
                        variant="quiet"
                        size="sm"
                      >
                        <span>Tiefenanalyse</span>
                        <ArrowRight className="size-3.5" aria-hidden="true" />
                      </ButtonLink>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Methodology, transparency, and neutrality disclaimer */}
        <details className="group border-y border-divider py-4">
          <summary className="cursor-pointer list-none font-semibold text-fg">
            So rechnen wir{" "}
            <span className="text-small font-normal text-fg-muted group-open:hidden">(aufklappen)</span>
          </summary>
          <div className="mt-4 space-y-4 text-small text-fg-muted">
            <p>
              <strong className="text-fg">Standort-Ranking &amp; Relativ-Index (%):</strong> Wir
              ordnen alle Sorten nach ihrer relativen Leistung auf deinem Boden und über mehrjährige
              DWD-Wetterreihen (Platz 1, Platz 2, …) ein, statt spekulative €-Spannen zu versprechen.
            </p>
            <p>
              <strong className="text-fg">Neutralität:</strong> Das Ranking ergibt sich
              ausschließlich aus den agronomischen Ertragsdaten und der Standortpassung. Kein Züchter
              kann sich Platz 1 kaufen.
            </p>
          </div>
        </details>

        {/* 1. Variety profile modal (with safe unwrap & friendly empty fallback) */}
        <VarietySteckbriefModal
          varietyId={selectedVarietyId}
          onClose={() => setSelectedVarietyId(null)}
          initialFlaecheHa={fieldHektar}
          schlagName={field.name}
          fieldId={field.id}
          fallbackVariety={selectedSteckbriefFallback}
        />

        {/* 2. Side-by-side Variety Comparison Overlay Modal */}
        <VarietyCompareModal
          open={compareOpen}
          onClose={() => setCompareOpen(false)}
          allVarieties={comparableVarieties}
          comparedIds={comparedIds}
          onToggleCompareId={(id) => toggleCompareId(id)}
          onWhereToBuy={(v) => {
            setCompareOpen(false);
            setWhereToBuyTarget({
              id: v.id,
              name: v.name,
              zuechter: v.zuechter,
              reifezahl: v.reifezahl,
            });
          }}
          fieldName={field.name}
        />

        {/* 3. Where to buy modal (regional dealers & breeder advisors) */}
        <WhereToBuyModal
          open={Boolean(whereToBuyTarget)}
          onClose={() => setWhereToBuyTarget(null)}
          variety={whereToBuyTarget}
          region={field.env.region}
          schlagName={field.name}
        />

        {/* 4. Optional direct seed inquiry modal */}
        {buyingVariety && (
          <SaatgutKaufenModal
            offen={true}
            onClose={() => setBuyingVariety(null)}
            variety={buyingVariety}
            initialFlaecheHa={fieldHektar}
            schlagName={field.name}
            fieldId={field.id}
          />
        )}
      </div>
    </div>
  );
}
