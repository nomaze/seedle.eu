"use client";

import {
  ChevronLeft,
  MapPin,
  Search,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
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
    <div className="seite-breit space-y-6 sm:space-y-8">
      {/* 1. Header with location confirmation and back navigation */}
      <header className="pt-1 sm:pt-2">
        <div className="flex items-center justify-between gap-4">
          <Link
            href={backUrl}
            className="inline-flex h-9 items-center gap-1 rounded-full bg-white/90 pl-2 pr-3.5 text-xs sm:text-sm font-semibold text-ink ring-1 ring-line hover:ring-leaf-300 hover:bg-white transition shadow-sm"
          >
            <ChevronLeft className="size-4 text-leaf-700" />
            <span>Standort ändern</span>
          </Link>

          {locationLabel && (
            <span className="inline-flex items-center gap-1 rounded-full bg-leaf-50 px-3 py-1 text-xs font-semibold text-leaf-800 ring-1 ring-leaf-200">
              <MapPin className="size-3 text-leaf-700" />
              {locationLabel}
            </span>
          )}
        </div>

        <div className="mt-4">
          <div className="text-xs font-bold uppercase tracking-wider text-leaf-700">
            Regionale Sortenversuche (Demo-Datensatz)
          </div>
          <h1 className="mt-1 text-2xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
            Versuchsergebnisse für {stats.region.name}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-muted">
            Basiert auf{" "}
            <strong className="text-ink font-semibold">
              {stats.totals.max_standorte} regionalen Versuchsstandorten (Demo-Datensatz)
            </strong>{" "}
            · {stats.totals.min_jahr}–
            {stats.totals.max_jahr} ({stats.totals.datenpunkte.toLocaleString("de-DE")} Datenpunkte)
          </p>
        </div>
      </header>

      {/* 2. Navigation tabs: regional champions (default) vs full variety catalog */}
      <section aria-label="Sortenergebnisse">
        <div className="flex border-b border-line gap-2 sm:gap-6 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("regional")}
            className={`flex items-center gap-2 pb-3.5 text-sm sm:text-base font-bold transition border-b-2 -mb-px whitespace-nowrap cursor-pointer ${
              activeTab === "regional"
                ? "border-leaf-600 text-leaf-800"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            <Trophy className="size-4 text-sun-600" />
            <span>Regionale Spitzenreiter</span>
            {stats.topSorten && (
              <span className="rounded-full bg-leaf-100 px-2 py-0.5 text-xs text-leaf-800 font-semibold font-mono tabular-nums">
                {stats.topSortenSilo?.length ?? stats.topSorten.length} Sorten
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("katalog")}
            className={`flex items-center gap-2 pb-3.5 text-sm sm:text-base font-bold transition border-b-2 -mb-px whitespace-nowrap cursor-pointer ${
              activeTab === "katalog"
                ? "border-leaf-600 text-leaf-800"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            <Search className="size-4" />
            <span>Alle Sorten im Gesamtkatalog durchsuchen</span>
          </button>
        </div>

        {/* Tab 1: Regional metrics, usage toggle, table & sticky panel */}
        {activeTab === "regional" && (
          <div className="mt-6 space-y-6">
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
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveTab("regional")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-leaf-700 hover:text-leaf-900 transition cursor-pointer"
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
