"use client";

import {
  ChevronDown,
  ChevronUp,
  MapPin,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSpross } from "@/components/spross/SprossContext";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import { SectionTitle } from "@/components/ui/Card";
import { KennzahlLeiste } from "@/components/ui/Kennzahl";
import { num } from "@/lib/format";
import type { RegionalStats, RegionalTopVariety } from "@/server/services/dmk";
import { StandortPerformancePanel } from "./StandortPerformancePanel";
import { VarietyRankingTable, type RankingVarietyItem } from "./VarietyRankingTable";
import { segmentClass } from "@/components/ui/Choice";

/** Segmented control (design system): rectangular segments side by side, active one in the selected role. */
const SEGMENT_GROUP = "inline-flex flex-wrap gap-1.5";


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
    <div className={`space-y-10 ${className}`}>
      {/* 1. Usage toggle (silage vs grain) */}
      <div className="flex flex-col justify-between gap-3 border-y border-divider py-4 sm:flex-row sm:items-center">
        <div>
          <span className="text-body font-semibold text-fg">
            Nutzungsrichtung
          </span>
          <p className="mt-0.5 text-small text-fg-muted">
            Getrennte Versuchsreihen & Reifezahlen für {region.name}
          </p>
        </div>

        <div className={`${SEGMENT_GROUP} self-start sm:self-auto`}>
          <button
            type="button"
            onClick={() => {
              setNutzung("silo");
              setShowAll(false);
            }}
            aria-pressed={nutzung === "silo"}
            className={segmentClass(nutzung === "silo")}
          >
            Silomais (GTM)
          </button>
          <button
            type="button"
            onClick={() => {
              setNutzung("koerner");
              setShowAll(false);
            }}
            aria-pressed={nutzung === "koerner"}
            className={segmentClass(nutzung === "koerner")}
          >
            Körnermais
          </button>
        </div>
      </div>

      {/* 2. Regional key figures */}
      <section>
        <SectionTitle
          hint={`${totals.min_jahr}–${totals.max_jahr} · ${totals.datenpunkte.toLocaleString(
            "de-DE",
          )} Datenpunkte`}
        >
          Regionales Sorten-Ranking & Versuchsbasis für {region.name} ({region.region_code})
        </SectionTitle>

        <p className="mb-5 max-w-measure text-small text-fg-muted">
          {region.boden_klima_beschreibung}
        </p>

        <KennzahlLeiste>
          {/* Regional reference baseline */}
          {nutzung === "silo" ? (
            <div>
              <div className="text-small text-fg-muted">
                LSV-Basis Silomais
              </div>
              <div className="mt-1 text-figure-m tabular-nums text-fg">
                100 % Referenz
              </div>
              <div className="mt-1 text-caption tabular-nums text-fg-muted">
                {averages.silomais.messungen_gtm > 0
                  ? `${averages.silomais.messungen_gtm.toLocaleString("de-DE")} Wägungen`
                  : "Keine Siloversuche"}
              </div>
            </div>
          ) : (
            <div>
              <div className="text-small text-fg-muted">
                LSV-Basis Körnermais
              </div>
              <div className="mt-1 text-figure-m tabular-nums text-fg">
                100 % Referenz
              </div>
              <div className="mt-1 text-caption tabular-nums text-fg-muted">
                {averages.koernermais.messungen_ke > 0
                  ? `${averages.koernermais.messungen_ke.toLocaleString("de-DE")} Wägungen`
                  : "Keine Kornversuche"}
              </div>
            </div>
          )}

          {/* Dry matter content */}
          {nutzung === "silo" ? (
            <div>
              <div className="text-small text-fg-muted">
                Ø TS-Gehalt Silo
              </div>
              <div className="mt-1 text-figure-m tabular-nums text-fg">
                {averages.silomais.avg_tsg_prozent != null
                  ? `${num(averages.silomais.avg_tsg_prozent)} %`
                  : "—"}
              </div>
              <div className="mt-1 text-caption text-fg-muted">Reife bei Ernte</div>
            </div>
          ) : (
            <div>
              <div className="text-small text-fg-muted">
                Ø Korn-TS
              </div>
              <div className="mt-1 text-figure-m tabular-nums text-fg">
                {averages.koernermais.avg_tsg_prozent != null
                  ? `${num(averages.koernermais.avg_tsg_prozent)} %`
                  : "—"}
              </div>
              <div className="mt-1 text-caption text-fg-muted">Erntefeuchte standardisiert</div>
            </div>
          )}

          {/* Trial locations */}
          <div>
            <div className="text-small text-fg-muted">
              Standorte (LSV)
            </div>
            <div className="mt-1 text-figure-m tabular-nums text-fg">
              bis zu {totals.max_standorte}
            </div>
            <div className="mt-1 text-caption tabular-nums text-fg-muted">
              {totals.summe_standortmessungen.toLocaleString("de-DE")} Messungen gesamt
            </div>
          </div>

          {/* Varieties in dataset */}
          <div>
            <div className="text-small text-fg-muted">
              Geprüfte Sorten
            </div>
            <div className="mt-1 text-figure-m tabular-nums text-fg">
              {sourceVarieties.length}
            </div>
            <div className="mt-1 text-caption text-fg-muted">
              in {nutzung === "silo" ? "Silomais" : "Körnermais"}
            </div>
          </div>
        </KennzahlLeiste>
      </section>

      {/* 3. Maturity group filter (segmented control) */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-small font-semibold text-fg">Reifegruppe:</span>
        <div className={SEGMENT_GROUP}>
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
              aria-pressed={reifegruppe === pill.id}
              className={`inline-flex items-center gap-1.5 ${segmentClass(reifegruppe === pill.id)}`}
            >
              <span>{pill.label}</span>
              <span
                className={`font-normal tabular-nums ${
                  reifegruppe === pill.id ? "opacity-80" : "text-fg-muted"
                }`}
              >
                {pill.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Main grid: 2-column layout on desktop (table left, sticky panel right) */}
      <div className="items-start lg:grid lg:grid-cols-12 lg:gap-x-12">
        {/* Left column: Results table */}
        <div className="min-w-0 space-y-10 lg:col-span-8">
          <section>
            <SectionTitle hint={`${filteredVarieties.length} Sorten im Vergleich`}>
              Top-geprüfte {nutzung === "silo" ? "Silomaissorten" : "Körnermaissorten"} in{" "}
              {region.name}
            </SectionTitle>
            <p className="-mt-2 mb-4 max-w-measure text-small text-fg-muted">
              Sortiert nach Relativertrag (%) zur amtlichen Bezugsbasis · Tippe auf eine Zeile,
              um den Standort-Check zu aktualisieren
            </p>

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
              <div className="mt-2 border-t border-divider pt-3">
                <button
                  type="button"
                  onClick={() => setShowAll((prev) => !prev)}
                  className={buttonClass("quiet", "sm", "-ml-4 cursor-pointer")}
                >
                  {showAll ? (
                    <>
                      <span>Auf Top 15 reduzieren</span>
                      <ChevronUp className="size-4" aria-hidden />
                    </>
                  ) : (
                    <>
                      <span>
                        Alle {filteredVarieties.length} geprüften {nutzung === "silo" ? "Silomaissorten" : "Körnermaissorten"} anzeigen
                      </span>
                      <ChevronDown className="size-4" aria-hidden />
                    </>
                  )}
                </button>
              </div>
            )}
          </section>

          {/* Bridge to full variety catalog */}
          {onOpenKatalog && (
            <div className="flex flex-col gap-3 border-t border-divider pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-measure text-small text-fg-muted">
                Suchst du eine ganz bestimmte Sorte aus einem anderen Anbaugebiet oder möchtest gezielt nach
                Züchter (AckerWerk, Feldmark, Bergland etc.) filtern?
              </p>
              <button
                type="button"
                onClick={onOpenKatalog}
                className={buttonClass("secondary", "sm", "shrink-0 self-start whitespace-nowrap cursor-pointer sm:self-auto")}
              >
                <Search className="size-4" aria-hidden />
                Alle 715 Sorten durchsuchen →
              </button>
            </div>
          )}
        </div>

        {/* Right column: Desktop sticky performance panel */}
        <div className="sticky top-6 hidden self-start lg:col-span-4 lg:block">
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
            <div className="pointer-events-none fixed inset-x-0 bottom-16 z-30 px-3 pb-2 pt-1 sm:bottom-0">
              <div className="pointer-events-auto mx-auto flex max-w-md items-center justify-between gap-2 rounded-panel border border-control bg-surface p-2.5 shadow-lift">
                <div
                  onClick={() => setMobileDrawerOpen(true)}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-2"
                >
                  <span className="shrink-0 text-figure-s tabular-nums text-fg-muted">
                    #{selectedRang}
                  </span>
                  <div className="min-w-0 truncate">
                    <span className="block truncate text-small font-bold text-fg">
                      {selectedVariety.sorte}
                    </span>
                    <span className="block truncate text-caption tabular-nums text-fg-muted">
                      {selectedVariety.avg_rel_ertrag != null
                        ? `${num(selectedVariety.avg_rel_ertrag)} % rel.`
                        : "LSV-geprüft"}
                      {selectedVariety.reife_anzeige ? ` · ${selectedVariety.reife_anzeige}` : ""}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <ButtonLink
                    href={`/feld?sorte=${selectedVariety.sorte_id}`}
                    variant="primary"
                    size="sm"
                    className="whitespace-nowrap px-3"
                  >
                    <MapPin className="size-4" aria-hidden />
                    Schlag-Check
                  </ButtonLink>

                  <button
                    type="button"
                    onClick={() => setMobileDrawerOpen(true)}
                    aria-label="Standort-Details aufklappen"
                    className="flex size-10 cursor-pointer items-center justify-center rounded-control text-link transition-colors hover:bg-action-subtle"
                  >
                    <ChevronUp className="size-5" aria-hidden />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Expanded drawer modal */}
          {mobileDrawerOpen && (
            <div className="fixed inset-0 z-50 flex items-end bg-scrim p-0 sm:items-center sm:justify-center sm:p-4">
              <div
                className="fixed inset-0"
                onClick={() => setMobileDrawerOpen(false)}
              />
              <div className="relative z-10 max-h-[85vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-t-panel border border-control bg-surface p-4 shadow-lift sm:rounded-panel sm:p-5">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-subheading text-fg">
                    Standort-Performance
                  </span>
                  <button
                    type="button"
                    onClick={() => setMobileDrawerOpen(false)}
                    className={buttonClass("quiet", "sm", "-mr-2 cursor-pointer")}
                  >
                    <ChevronDown className="size-4" aria-hidden />
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
