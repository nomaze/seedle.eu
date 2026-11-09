"use client";

import {
  ChevronDown,
  ChevronUp,
  MapPin,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSpross } from "@/components/spross/SprossContext";
import { ButtonLink } from "@/components/ui/Button";
import { Card, SectionTitle } from "@/components/ui/Card";
import { num } from "@/lib/format";
import type { RegionalStats, RegionalTopVariety } from "@/server/services/dmk";
import { StandortPerformancePanel } from "./StandortPerformancePanel";
import { VarietyRankingTable, type RankingVarietyItem } from "./VarietyRankingTable";

export interface RegionalSummaryCardProps {
  stats: RegionalStats;
  selectedVarietyId: number | null;
  onSelectVariety: (sorteId: number) => void;
  onOpenSteckbrief: (sorteId: number) => void;
  onBuyVariety?: (variety: RegionalTopVariety) => void;
  onOpenKatalog?: () => void;
  locationLabel?: string | null;
  className?: string;
}

export function RegionalSummaryCard({
  stats,
  selectedVarietyId,
  onSelectVariety,
  onOpenSteckbrief,
  onBuyVariety,
  onOpenKatalog,
  locationLabel,
  className = "",
}: RegionalSummaryCardProps) {
  const { region, totals, averages } = stats;

  // 1. Filter states: usage direction & maturity group
  const [nutzung, setNutzung] = useState<"silo" | "koerner">("silo");
  const [reifegruppe, setReifegruppe] = useState<"alle" | "frueh" | "mittelfrueh" | "spaet">("alle");
  const [showAll, setShowAll] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // 2. Variety candidates for selected usage
  const sourceVarieties: RegionalTopVariety[] = useMemo(
    () =>
      nutzung === "silo"
        ? (stats.topSortenSilo && stats.topSortenSilo.length > 0 ? stats.topSortenSilo : stats.topSorten)
        : (stats.topSortenKoerner ?? []),
    [nutzung, stats.topSorten, stats.topSortenKoerner, stats.topSortenSilo]
  );

  // Count tallies for maturity filter tabs
  const countAlle = sourceVarieties.length;
  const countFrueh = sourceVarieties.filter((v) => v.reifegruppe_stufe === "frueh").length;
  const countMittelfrueh = sourceVarieties.filter((v) => v.reifegruppe_stufe === "mittelfrueh").length;
  const countSpaet = sourceVarieties.filter((v) => v.reifegruppe_stufe === "spaet").length;

  // Filter by maturity group
  const filteredVarieties =
    reifegruppe === "alle"
      ? sourceVarieties
      : sourceVarieties.filter((v) => v.reifegruppe_stufe === reifegruppe);

  // Active selected variety for performance panel
  const selectedVariety =
    filteredVarieties.find((v) => v.sorte_id === selectedVarietyId) ??
    sourceVarieties.find((v) => v.sorte_id === selectedVarietyId) ??
    filteredVarieties[0] ??
    null;

  const selectedRang = selectedVariety
    ? Math.max(1, filteredVarieties.indexOf(selectedVariety) + 1)
    : 1;

  // Variety pagination limit or display-all
  const visibleVarieties = useMemo(
    () => (showAll ? filteredVarieties : filteredVarieties.slice(0, 15)),
    [showAll, filteredVarieties]
  );

  const { updatePageState, registerActionHandler } = useSpross();

  const selectedVarietyName = selectedVariety?.sorte;
  const topNames = useMemo(
    () => visibleVarieties.slice(0, 6).map((v) => v.sorte),
    [visibleVarieties]
  );

  useEffect(() => {
    updatePageState({
      stepLabel: `Regionale Champions · ${region.name}`,
      activeFilters: {
        tab: "regional",
        usage: nutzung === "silo" ? "silomais" : "koernermais",
        reifegruppe,
      },
      visibleVarieties: topNames,
      nextBestAction: selectedVarietyName
        ? `Steckbrief für ${selectedVarietyName} öffnen oder mit eigenem Schlag abgleichen`
        : "Sorte in der Tabelle auswählen",
    });
  }, [nutzung, reifegruppe, region.name, selectedVarietyName, updatePageState, topNames]);

  useEffect(() => {
    return registerActionHandler((action) => {
      if (action.type === "set_filter") {
        const val = (action.filterValue || "").toLowerCase();
        if (action.filterKey === "usage") {
          if (val.includes("koerner") || val.includes("körner") || val.includes("korn")) {
            setNutzung("koerner");
            setShowAll(false);
            return true;
          }
          if (val.includes("silo")) {
            setNutzung("silo");
            setShowAll(false);
            return true;
          }
        }
        if (action.filterKey === "reifegruppe") {
          if (val.includes("frueh") || val.includes("früh")) {
            setReifegruppe("frueh");
            return true;
          }
          if (val.includes("mittel")) {
            setReifegruppe("mittelfrueh");
            return true;
          }
          if (val.includes("spaet") || val.includes("spät")) {
            setReifegruppe("spaet");
            return true;
          }
          setReifegruppe("alle");
          return true;
        }
      }
      if (action.type === "open_variety_detail") {
        const q = (action.varietyId || action.label || "").toLowerCase();
        const found =
          sourceVarieties.find(
            (v) =>
              String(v.sorte_id) === q ||
              v.sorte.toLowerCase().includes(q) ||
              q.includes(v.sorte.toLowerCase())
          ) ?? selectedVariety;
        if (found) {
          onOpenSteckbrief(found.sorte_id);
          return true;
        }
      }
      return false;
    });
  }, [onOpenSteckbrief, registerActionHandler, selectedVariety, sourceVarieties]);

  const tableVarieties: RankingVarietyItem[] = visibleVarieties.map((sorte, idx) => ({
    id: sorte.sorte_id,
    rang: idx + 1,
    name: sorte.sorte,
    zuechter: sorte.zuechter,
    reifeLabel: sorte.reife_anzeige,
    reife_anzeige: sorte.reife_anzeige,
    reifegruppe_stufe: sorte.reifegruppe_stufe,
    siloreifezahl: sorte.siloreifezahl,
    koernerreifezahl: sorte.koernerreifezahl,
    zulassungsjahr: sorte.zulassungsjahr,
    ertragDtHa: null,
    relativertragProzent: sorte.avg_rel_ertrag,
    tsGehaltProzent: sorte.avg_tsg,
    totalOrte: sorte.total_orte,
    jahreAnzahl: sorte.jahre_anzahl,
    badge: idx === 0 ? "Regionssieger" : null,
    badgeTone: "leaf",
    nutzung,
  }));

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Usage toggle (silage vs grain) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-white border border-line p-3 sm:p-4 shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-leaf-800">
            Nutzungsrichtung
          </span>
          <p className="text-xs text-muted mt-0.5">
            Getrennte Versuchsreihen & Reifezahlen für {region.name}
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-sand-100 p-1 ring-1 ring-line self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setNutzung("silo");
              setShowAll(false);
            }}
            className={`px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition cursor-pointer ${
              nutzung === "silo"
                ? "bg-leaf-700 text-white shadow-sm"
                : "text-ink hover:text-leaf-800 hover:bg-sand-200/60"
            }`}
          >
            Silomais (GTM)
          </button>
          <button
            type="button"
            onClick={() => {
              setNutzung("koerner");
              setShowAll(false);
            }}
            className={`px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition cursor-pointer ${
              nutzung === "koerner"
                ? "bg-leaf-700 text-white shadow-sm"
                : "text-ink hover:text-leaf-800 hover:bg-sand-200/60"
            }`}
          >
            Körnermais
          </button>
        </div>
      </div>

      {/* 2. Regional stats tiles */}
      <Card>
        <SectionTitle
          hint={`${totals.min_jahr}–${totals.max_jahr} · ${totals.datenpunkte.toLocaleString(
            "de-DE",
          )} Datenpunkte`}
        >
          Regionales Sorten-Ranking & Versuchsbasis für {region.name} ({region.region_code})
        </SectionTitle>

        <p className="text-sm text-muted mb-4 leading-relaxed">
          {region.boden_klima_beschreibung}
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* Regional reference baseline */}
          {nutzung === "silo" ? (
            <div className="rounded-xl bg-leaf-50/70 p-3.5 ring-1 ring-leaf-200">
              <div className="text-xs font-semibold text-leaf-800 uppercase tracking-wider">
                LSV-Basis Silomais
              </div>
              <div className="mt-1 text-2xl font-bold text-ink font-mono tabular-nums">
                100 % Referenz
              </div>
              <div className="mt-0.5 text-xs text-muted">
                {averages.silomais.messungen_gtm > 0
                  ? `${averages.silomais.messungen_gtm.toLocaleString("de-DE")} Wägungen`
                  : "Keine Siloversuche"}
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-leaf-50/70 p-3.5 ring-1 ring-leaf-200">
              <div className="text-xs font-semibold text-leaf-800 uppercase tracking-wider">
                LSV-Basis Körnermais
              </div>
              <div className="mt-1 text-2xl font-bold text-ink font-mono tabular-nums">
                100 % Referenz
              </div>
              <div className="mt-0.5 text-xs text-muted">
                {averages.koernermais.messungen_ke > 0
                  ? `${averages.koernermais.messungen_ke.toLocaleString("de-DE")} Wägungen`
                  : "Keine Kornversuche"}
              </div>
            </div>
          )}

          {/* Dry matter content */}
          {nutzung === "silo" ? (
            <div className="rounded-xl bg-leaf-50/70 p-3.5 ring-1 ring-leaf-200">
              <div className="text-xs font-semibold text-leaf-800 uppercase tracking-wider">
                Ø TS-Gehalt Silo
              </div>
              <div className="mt-1 text-2xl font-bold text-ink font-mono tabular-nums">
                {averages.silomais.avg_tsg_prozent != null
                  ? `${num(averages.silomais.avg_tsg_prozent)} %`
                  : "—"}
              </div>
              <div className="mt-0.5 text-xs text-muted">Reife bei Ernte</div>
            </div>
          ) : (
            <div className="rounded-xl bg-leaf-50/70 p-3.5 ring-1 ring-leaf-200">
              <div className="text-xs font-semibold text-leaf-800 uppercase tracking-wider">
                Ø Korn-TS
              </div>
              <div className="mt-1 text-2xl font-bold text-ink font-mono tabular-nums">
                {averages.koernermais.avg_tsg_prozent != null
                  ? `${num(averages.koernermais.avg_tsg_prozent)} %`
                  : "—"}
              </div>
              <div className="mt-0.5 text-xs text-muted">Erntefeuchte standardisiert</div>
            </div>
          )}

          {/* Trial locations */}
          <div className="rounded-xl bg-sand-100/70 p-3.5 ring-1 ring-sand-300">
            <div className="text-xs font-semibold text-muted uppercase tracking-wider">
              Standorte (LSV)
            </div>
            <div className="mt-1 text-2xl font-bold text-ink font-mono tabular-nums">
              bis zu {totals.max_standorte}
            </div>
            <div className="mt-0.5 text-xs text-muted">
              {totals.summe_standortmessungen.toLocaleString("de-DE")} Messungen gesamt
            </div>
          </div>

          {/* Varieties in dataset */}
          <div className="rounded-xl bg-sand-100/70 p-3.5 ring-1 ring-sand-300">
            <div className="text-xs font-semibold text-muted uppercase tracking-wider">
              Geprüfte Sorten
            </div>
            <div className="mt-1 text-2xl font-bold text-ink font-mono tabular-nums">
              {sourceVarieties.length}
            </div>
            <div className="mt-0.5 text-xs text-muted">
              in {nutzung === "silo" ? "Silomais" : "Körnermais"}
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Maturity group pill filters */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-xs font-semibold text-muted mr-1">Reifegruppe:</span>
        {[
          { id: "alle", label: "Alle Reifegruppen", count: countAlle },
          {
            id: "frueh",
            label: nutzung === "silo" ? "Früh (bis S 220)" : "Früh (bis K 220)",
            count: countFrueh,
          },
          {
            id: "mittelfrueh",
            label: nutzung === "silo" ? "Mittelfrüh (S 230–250)" : "Mittelfrüh (K 230–250)",
            count: countMittelfrueh,
          },
          {
            id: "spaet",
            label: nutzung === "silo" ? "Mittelspät / Spät (ab S 260)" : "Mittelspät / Spät (ab K 260)",
            count: countSpaet,
          },
        ].map((pill) => (
          <button
            key={pill.id}
            type="button"
            onClick={() => {
              setReifegruppe(pill.id as "alle" | "frueh" | "mittelfrueh" | "spaet");
              setShowAll(false);
            }}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              reifegruppe === pill.id
                ? "bg-leaf-700 text-white shadow-sm ring-1 ring-leaf-800"
                : "bg-white text-ink hover:bg-sand-100 ring-1 ring-line"
            }`}
          >
            <span>{pill.label}</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono tabular-nums ${
                reifegruppe === pill.id ? "bg-white/20 text-white" : "bg-sand-200 text-muted"
              }`}
            >
              {pill.count}
            </span>
          </button>
        ))}
      </div>

      {/* 4. Main grid: 2-column layout on desktop (table left, sticky panel right) */}
      <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
        {/* Left column: Results table */}
        <div className="lg:col-span-8 min-w-0 space-y-4">
          <Card>
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
              <div>
                <SectionTitle hint={`${filteredVarieties.length} Sorten im Vergleich`}>
                  Top-geprüfte {nutzung === "silo" ? "Silomaissorten" : "Körnermaissorten"} in{" "}
                  {region.name}
                </SectionTitle>
                <p className="text-xs text-muted mt-1">
                  Sortiert nach Relativertrag (%) zur amtlichen Bezugsbasis · Tippe auf eine Zeile,
                  um den Standort-Check zu aktualisieren
                </p>
              </div>
            </div>

            <VarietyRankingTable
              varieties={tableVarieties}
              nutzung={nutzung}
              selectedVarietyId={selectedVariety?.sorte_id ?? null}
              onSelectVariety={(id) => onSelectVariety(Number(id))}
              onOpenSteckbrief={(id) => onOpenSteckbrief(Number(id))}
              onBuyVariety={
                onBuyVariety
                  ? (v) => {
                      const original = sourceVarieties.find((s) => s.sorte_id === Number(v.id));
                      if (original) onBuyVariety(original);
                    }
                  : undefined
              }
              emptyText={`Für ${
                nutzung === "silo" ? "Silomais" : "Körnermais"
              } liegen in dieser Auswahl keine Sortenversuche vor.`}
            />

            {/* Show all varieties toggle */}
            {filteredVarieties.length > 15 && (
              <div className="mt-4 pt-4 border-t border-line flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowAll((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-full bg-sand-100 hover:bg-sand-200 text-ink px-4 py-2 text-xs font-semibold ring-1 ring-line transition cursor-pointer"
                >
                  {showAll ? (
                    <>
                      <span>Auf Top 15 reduzieren</span>
                      <ChevronUp className="size-3.5 text-muted" />
                    </>
                  ) : (
                    <>
                      <span>
                        Alle {filteredVarieties.length} geprüften {nutzung === "silo" ? "Silomaissorten" : "Körnermaissorten"} anzeigen
                      </span>
                      <ChevronDown className="size-3.5 text-muted" />
                    </>
                  )}
                </button>
              </div>
            )}
          </Card>

          {/* Bridge to full variety catalog */}
          {onOpenKatalog && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl bg-sand-100/70 p-4 ring-1 ring-line text-xs">
              <div className="text-muted max-w-xl leading-relaxed">
                Suchst du eine ganz bestimmte Sorte aus einem anderen Anbaugebiet oder möchtest gezielt nach
                Züchter (AckerWerk, Feldmark, Bergland etc.) filtern?
              </div>
              <button
                type="button"
                onClick={onOpenKatalog}
                className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-white px-3.5 py-1.5 font-semibold text-leaf-700 ring-1 ring-line hover:bg-leaf-50 shadow-sm transition whitespace-nowrap cursor-pointer"
              >
                <Search className="size-3.5" />
                Alle 715 Sorten durchsuchen →
              </button>
            </div>
          )}
        </div>

        {/* Right column: Desktop sticky performance panel */}
        <div className="hidden lg:block lg:col-span-4 sticky top-6 self-start">
          <StandortPerformancePanel
            variety={selectedVariety}
            rang={selectedRang}
            regionName={region.name}
            nutzung={nutzung}
            locationLabel={locationLabel}
            onOpenSteckbrief={onOpenSteckbrief}
            onBuyVariety={onBuyVariety}
          />
        </div>
      </div>

      {/* 5. Mobile bottom drawer (< 1024px) */}
      {selectedVariety && (
        <div className="lg:hidden">
          {/* Collapsed bottom bar */}
          {!mobileDrawerOpen && (
            <div className="fixed inset-x-0 bottom-16 sm:bottom-0 z-30 px-3 pb-2 pt-1 pointer-events-none">
              <div className="pointer-events-auto mx-auto max-w-md rounded-2xl bg-white/95 backdrop-blur-md border border-line shadow-lift p-2.5 flex items-center justify-between gap-2">
                <div
                  onClick={() => setMobileDrawerOpen(true)}
                  className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                >
                  <span className="rounded-md bg-leaf-100 px-1.5 py-0.5 text-xs font-bold font-mono text-leaf-800 tabular-nums shrink-0">
                    #{selectedRang}
                  </span>
                  <div className="min-w-0 truncate">
                    <span className="font-bold text-ink text-xs truncate block">
                      {selectedVariety.sorte}
                    </span>
                    <span className="text-[10px] text-muted truncate block">
                      {selectedVariety.avg_rel_ertrag != null
                        ? `${num(selectedVariety.avg_rel_ertrag)} % rel.`
                        : "LSV-geprüft"}
                      {selectedVariety.reife_anzeige ? ` · ${selectedVariety.reife_anzeige}` : ""}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <ButtonLink
                    href={`/feld?sorte=${selectedVariety.sorte_id}`}
                    variant="primary"
                    size="sm"
                    className="px-2.5 py-1 text-xs font-bold shadow-sm whitespace-nowrap"
                  >
                    <MapPin className="size-3" />
                    Schlag-Check
                  </ButtonLink>

                  <button
                    type="button"
                    onClick={() => setMobileDrawerOpen(true)}
                    aria-label="Standort-Details aufklappen"
                    className="flex size-8 items-center justify-center rounded-full bg-sand-100 text-leaf-800 ring-1 ring-line hover:bg-sand-200 cursor-pointer transition"
                  >
                    <ChevronUp className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Expanded drawer modal */}
          {mobileDrawerOpen && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center p-0 sm:p-4 bg-ink/40 backdrop-blur-xs animate-fade-in">
              <div
                className="fixed inset-0"
                onClick={() => setMobileDrawerOpen(false)}
              />
              <div className="relative z-10 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white shadow-lift border border-line p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-line">
                  <span className="text-xs font-bold uppercase tracking-wider text-leaf-700">
                    Standort-Performance
                  </span>
                  <button
                    type="button"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-ink rounded-full px-2.5 py-1 bg-sand-100 cursor-pointer transition"
                  >
                    <ChevronDown className="size-3.5" />
                    <span>Einklappen</span>
                  </button>
                </div>

                <StandortPerformancePanel
                  variety={selectedVariety}
                  rang={selectedRang}
                  regionName={region.name}
                  nutzung={nutzung}
                  locationLabel={locationLabel}
                  onOpenSteckbrief={(id) => {
                    setMobileDrawerOpen(false);
                    onOpenSteckbrief(id);
                  }}
                  onBuyVariety={onBuyVariety}
                  isMobileDrawer={true}
                  onCloseDrawer={() => setMobileDrawerOpen(false)}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
