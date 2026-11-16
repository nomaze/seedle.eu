"use client";

import {
  MapPin,
  Search,
  Trophy,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { useSpross } from "@/components/spross/SprossContext";
import { lookupPlzOffline } from "@/lib/plz";
import type {
  BreederOption,
  DmkVarietyItem,
  RegionalStats,
  RegionalTopVariety,
} from "@/server/services/dmk";
import { RegionalSummaryCard } from "./RegionalSummaryCard";
import { SaatgutKaufenModal } from "./SaatgutKaufenModal";
import { VarietySearchAndFilter } from "./VarietySearchAndFilter";
import { VarietySteckbriefModal } from "./VarietySteckbriefModal";

interface RegionaleChampionsViewProps {
  stats: RegionalStats;
  initialBreeders: BreederOption[];
  initialVarieties: DmkVarietyItem[];
  initialTotalVarieties: number;
  initialPlz?: string;
  initialVarietyId?: number | null;
  initialTab?: "regional" | "katalog";
}

export function RegionaleChampionsView({
  stats,
  initialBreeders,
  initialVarieties,
  initialTotalVarieties,
  initialPlz = "",
  initialVarietyId = null,
  initialTab = "regional",
}: RegionaleChampionsViewProps) {
  const searchParams = useSearchParams();

  // Evaluate query parameter state
  const urlSorte = searchParams.get("sorte");
  const urlPlz = searchParams.get("plz") || initialPlz;

  const [activeTab, setActiveTab] = useState<"regional" | "katalog">(initialTab);
  const [catalogBreederFilter, setCatalogBreederFilter] = useState<string>("alle");

  // Selected variety for active table row and accompanying sticky performance panel
  const [selectedVarietyId, setSelectedVarietyId] = useState<number | null>(() => {
    if (urlSorte) return Number(urlSorte);
    return initialVarietyId;
  });

  // Control variety profile modal visibility
  const [steckbriefVarietyId, setSteckbriefVarietyId] = useState<number | null>(null);

  const [buyingVariety, setBuyingVariety] = useState<{
    id: number;
    name: string;
    zuechter?: string | null;
    siloreifezahl?: number | null;
    koernerreifezahl?: number | null;
  } | null>(null);

  // Connect Spross companion context with activeRegion, PageState, and ActionHandler
  const { setActiveRegion, updatePageState, registerActionHandler } = useSpross();
  useEffect(() => {
    setActiveRegion(stats.region.name);
    return () => setActiveRegion(null);
  }, [stats.region.name, setActiveRegion]);

  useEffect(() => {
    const topNames = (stats.topSortenSilo ?? stats.topSorten ?? [])
      .slice(0, 6)
      .map((s) => s.sorte);
    updatePageState({
      stepLabel:
        activeTab === "regional"
          ? `Versuchsdaten · ${stats.region.name}`
          : `Gesamtkatalog · ${stats.region.name}`,
      activeFilters: {
        tab: activeTab,
        ...(catalogBreederFilter !== "alle" ? { zuechter: catalogBreederFilter } : {}),
      },
      visibleVarieties: topNames,
      nextBestAction:
        activeTab === "regional"
          ? "Nutzungsrichtung (Silo/Körner) wählen oder Sorten-Steckbrief öffnen"
          : "Nach Züchter (z. B. AckerWerk Genetik) oder Reifegruppe filtern",
    });
  }, [activeTab, catalogBreederFilter, stats.region.name, stats.topSorten, stats.topSortenSilo, updatePageState]);

  // Resolve municipality name from postal code for location badge in header
  const plzMatch = urlPlz && urlPlz.length >= 2 ? lookupPlzOffline(urlPlz) : null;
  const locationLabel = plzMatch
    ? `${plzMatch.plz}${plzMatch.city ? ` ${plzMatch.city}` : ""}`
    : urlPlz
      ? `PLZ ${urlPlz}`
      : null;

  // Select variety for sticky performance panel
  const handleSelectVariety = useCallback((sorteId: number) => {
    setSelectedVarietyId(sorteId);
    const params = new URLSearchParams(window.location.search);
    params.set("sorte", String(sorteId));
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, []);

  // Open variety profile modal
  const handleOpenSteckbrief = useCallback((sorteId: number) => {
    setSelectedVarietyId(sorteId);
    setSteckbriefVarietyId(sorteId);
  }, []);

  useEffect(() => {
    return registerActionHandler((action) => {
      if (action.type === "set_filter") {
        const val = (action.filterValue || "").toLowerCase();
        if (action.filterKey === "tab") {
          setActiveTab(val.includes("katalog") ? "katalog" : "regional");
          return true;
        }
        if (action.filterKey === "zuechter") {
          setCatalogBreederFilter(val === "ackerwerk" ? "AckerWerk Genetik" : (action.filterValue || "AckerWerk Genetik"));
          setActiveTab("katalog");
          return true;
        }
        if (action.filterKey === "suchbegriff") {
          setActiveTab("katalog");
          return true;
        }
      }
      if (action.type === "open_variety_detail") {
        const q = (action.varietyId || action.label || "").toLowerCase();
        const allRegional = [
          ...(stats.topSortenSilo ?? []),
          ...(stats.topSortenKoerner ?? []),
          ...(stats.topSorten ?? []),
        ];
        const found = allRegional.find(
          (v) =>
            String(v.sorte_id) === q ||
            v.sorte.toLowerCase().includes(q) ||
            q.includes(v.sorte.toLowerCase())
        );
        if (found) {
          handleOpenSteckbrief(found.sorte_id);
          return true;
        }
      }
      return false;
    });
  }, [handleOpenSteckbrief, registerActionHandler, stats.topSorten, stats.topSortenKoerner, stats.topSortenSilo]);

  const handleCloseVarietyModal = useCallback(() => {
    setSteckbriefVarietyId(null);
  }, []);

  // Open seed checkout modal directly
  const handleBuyVariety = useCallback((sorte: RegionalTopVariety | DmkVarietyItem) => {
    setBuyingVariety({
      id: sorte.sorte_id,
      name: sorte.sorte,
      zuechter: sorte.zuechter,
      siloreifezahl: sorte.siloreifezahl,
      koernerreifezahl: sorte.koernerreifezahl,
    });
  }, []);

  const backUrl = urlPlz ? `/daten?plz=${encodeURIComponent(urlPlz)}` : "/daten";

  return (
    <div>
      {/* 1. Header with location confirmation and back navigation */}
      <PageHeader
        back={{ href: backUrl, label: "Standort ändern" }}
        eyebrow={
          <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>Regionale Sortenversuche (Demo-Datensatz)</span>
            {locationLabel && (
              <>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1 tabular-nums text-fg">
                  <MapPin className="size-4 text-link" aria-hidden />
                  {locationLabel}
                </span>
              </>
            )}
          </span>
        }
        title={<>Versuchsergebnisse für {stats.region.name}</>}
        lead={
          <>
            Basiert auf{" "}
            <strong className="font-semibold text-fg">
              {stats.totals.max_standorte} regionalen Versuchsstandorten (Demo-Datensatz)
            </strong>{" "}
            · <span className="tabular-nums">{stats.totals.min_jahr}–
            {stats.totals.max_jahr} ({stats.totals.datenpunkte.toLocaleString("de-DE")} Datenpunkte)</span>
          </>
        }
      />

      {/* 2. Navigation tabs: regional champions (default) vs full variety catalog */}
      <section aria-label="Sortenergebnisse">
        <div className="flex gap-6 overflow-x-auto border-b border-divider sm:gap-8">
          <button
            type="button"
            onClick={() => setActiveTab("regional")}
            aria-pressed={activeTab === "regional"}
            className={`-mb-px flex min-h-touch cursor-pointer items-center gap-2 whitespace-nowrap border-b-2 pb-2 text-body font-semibold transition-colors ${
              activeTab === "regional"
                ? "border-selected text-fg"
                : "border-transparent text-fg-muted hover:text-fg"
            }`}
          >
            <Trophy className="size-4" aria-hidden />
            <span>Regionale Spitzenreiter</span>
            {stats.topSorten && (
              <span className="text-small font-normal tabular-nums text-fg-muted">
                {stats.topSortenSilo?.length ?? stats.topSorten.length} Sorten
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("katalog")}
            aria-pressed={activeTab === "katalog"}
            className={`-mb-px flex min-h-touch cursor-pointer items-center gap-2 whitespace-nowrap border-b-2 pb-2 text-body font-semibold transition-colors ${
              activeTab === "katalog"
                ? "border-selected text-fg"
                : "border-transparent text-fg-muted hover:text-fg"
            }`}
          >
            <Search className="size-4" aria-hidden />
            <span>Alle Sorten im Gesamtkatalog durchsuchen</span>
          </button>
        </div>

        {/* Tab 1: Regional metrics, usage toggle, table & sticky panel */}
        {activeTab === "regional" && (
          <div className="mt-8">
            <RegionalSummaryCard
              stats={stats}
              selectedVarietyId={selectedVarietyId}
              onSelectVariety={handleSelectVariety}
              onOpenSteckbrief={handleOpenSteckbrief}
              onBuyVariety={handleBuyVariety}
              onOpenKatalog={() => setActiveTab("katalog")}
              locationLabel={locationLabel}
            />
          </div>
        )}

        {/* Tab 2: Full catalog & free text search */}
        {activeTab === "katalog" && (
          <div className="mt-6 space-y-6">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveTab("regional")}
                className="-ml-1 inline-flex min-h-touch cursor-pointer items-center gap-1.5 rounded-control px-1 text-small font-semibold text-link underline-offset-4 transition-colors hover:underline"
              >
                ← Zurück zu den Top-Sorten für {stats.region.name}
              </button>
            </div>

            <VarietySearchAndFilter
              key={catalogBreederFilter}
              breeders={initialBreeders}
              initialItems={initialVarieties}
              initialTotal={initialTotalVarieties}
              initialBreeder={catalogBreederFilter}
              onSelectVariety={handleOpenSteckbrief}
            />
          </div>
        )}
      </section>

      {/* 3. Variety profile modal (details, BSA ratings, trial history & seed inquiry) */}
      <VarietySteckbriefModal
        varietyId={steckbriefVarietyId}
        onClose={handleCloseVarietyModal}
      />

      {/* 4. Seed inquiry modal (direct trigger from table / map) */}
      {buyingVariety && (
        <SaatgutKaufenModal
          offen={true}
          onClose={() => setBuyingVariety(null)}
          variety={{
            id: buyingVariety.id,
            name: buyingVariety.name,
            zuechter: buyingVariety.zuechter,
            siloreifezahl: buyingVariety.siloreifezahl,
            koernerreifezahl: buyingVariety.koernerreifezahl,
          }}
        />
      )}
    </div>
  );
}
