"use client";

import { Building2, ChevronLeft, ChevronRight, Loader2, Search, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useSpross } from "@/components/spross/SprossContext";
import { Badge } from "@/components/ui/Badge";
import { Card, SectionTitle } from "@/components/ui/Card";
import type { BreederOption, DmkVarietyItem, VarietySearchResult } from "@/server/services/dmk";

interface VarietySearchAndFilterProps {
  breeders: BreederOption[];
  initialItems?: DmkVarietyItem[];
  initialTotal?: number;
  initialBreeder?: string;
  onSelectVariety: (sorteId: number) => void;
  className?: string;
}

// Quick filter options for breeders
const TOP_BREEDERS = [
  { label: "Alle", value: "alle" },
  { label: "AckerWerk Genetik", value: "AckerWerk Genetik" },
  { label: "Feldmark Genetics", value: "Feldmark Genetics" },
  { label: "Auenhof Saatzucht", value: "Auenhof Saatzucht" },
  { label: "Bergland Seeds", value: "Bergland Seeds" },
  { label: "Rheintal Zucht", value: "Rheintal Zucht" },
];

export function VarietySearchAndFilter({
  breeders,
  initialItems = [],
  initialTotal = 0,
  initialBreeder = "alle",
  onSelectVariety,
  className = "",
}: VarietySearchAndFilterProps) {
  const [q, setQ] = useState("");
  const [selectedBreeder, setSelectedBreeder] = useState(initialBreeder);

  const [selectedNutzung, setSelectedNutzung] = useState<"alle" | "silo" | "koerner">("alle");
  const [selectedReife, setSelectedReife] = useState<"alle" | "frueh" | "mittelfrueh" | "spaet">("alle");

  const { updatePageState, registerActionHandler } = useSpross();

  const [items, setItems] = useState<DmkVarietyItem[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(0);
  const pageSize = 24;

  const [isPending, startTransition] = useTransition();

  const fetchResults = useCallback(
    async (
      queryText: string,
      breederVal: string,
      nutzungVal: string,
      reifeVal: string,
      pageIndex: number,
    ) => {
      const params = new URLSearchParams();
      params.set("view", "search");
      if (queryText.trim()) params.set("q", queryText.trim());
      if (breederVal && breederVal !== "alle") params.set("zuechter", breederVal);
      if (nutzungVal && nutzungVal !== "alle") params.set("nutzung", nutzungVal);
      if (reifeVal && reifeVal !== "alle") params.set("reifegruppe", reifeVal);
      params.set("limit", String(pageSize));
      params.set("offset", String(pageIndex * pageSize));

      try {
        const res = await fetch(`/api/v1/daten?${params.toString()}`);
        if (!res.ok) throw new Error("Fehler beim Abrufen der Sorten");
        const data: VarietySearchResult = await res.json();
        setItems(data.items);
        setTotal(data.total);
      } catch (err) {
        console.error("Variety search error:", err);
      }
    },
    [pageSize],
  );

  // Trigger fetch on filter change with debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      startTransition(() => {
        fetchResults(q, selectedBreeder, selectedNutzung, selectedReife, page);
      });
    }, 150);

    return () => clearTimeout(handler);
  }, [q, selectedBreeder, selectedNutzung, selectedReife, page, fetchResults]);

  const handleReset = () => {
    setQ("");
    setSelectedBreeder("alle");
    setSelectedNutzung("alle");
    setSelectedReife("alle");
    setPage(0);
  };

  useEffect(() => {
    updatePageState({
      stepLabel: "Sorten-Katalog & Freitextsuche",
      activeFilters: {
        tab: "katalog",
        zuechter: selectedBreeder,
        usage: selectedNutzung,
        reifegruppe: selectedReife,
        ...(q ? { suchbegriff: q } : {}),
      },
      visibleVarieties: items.slice(0, 6).map((i) => i.sorte),
      nextBestAction: "Sorte anklicken, um den Steckbrief mit BSA-Noten zu öffnen",
    });
  }, [items, q, selectedBreeder, selectedNutzung, selectedReife, updatePageState]);

  useEffect(() => {
    return registerActionHandler((action) => {
      if (action.type === "set_filter") {
        const val = (action.filterValue || "").trim();
        const lower = val.toLowerCase();
        if (action.filterKey === "zuechter") {
          const matchedBreeder =
            TOP_BREEDERS.find((b) => b.value.toLowerCase() === lower || b.label.toLowerCase().includes(lower))
              ?.value ||
            breeders.find((b) => b.name.toLowerCase().includes(lower))?.name ||
            (lower === "ackerwerk" ? "AckerWerk Genetik" : val);
          setSelectedBreeder(matchedBreeder || "alle");
          setPage(0);
          return true;
        }
        if (action.filterKey === "usage") {
          if (lower.includes("silo")) setSelectedNutzung("silo");
          else if (lower.includes("koerner") || lower.includes("körner")) setSelectedNutzung("koerner");
          else setSelectedNutzung("alle");
          setPage(0);
          return true;
        }
        if (action.filterKey === "reifegruppe") {
          if (lower.includes("frueh") || lower.includes("früh")) setSelectedReife("frueh");
          else if (lower.includes("mittel")) setSelectedReife("mittelfrueh");
          else if (lower.includes("spaet") || lower.includes("spät")) setSelectedReife("spaet");
          else setSelectedReife("alle");
          setPage(0);
          return true;
        }
        if (action.filterKey === "suchbegriff") {
          setQ(val);
          setPage(0);
          return true;
        }
      }
      if (action.type === "open_variety_detail") {
        const qStr = (action.varietyId || action.label || "").toLowerCase();
        const found =
          items.find(
            (i) =>
              String(i.sorte_id) === qStr ||
              i.sorte.toLowerCase().includes(qStr) ||
              qStr.includes(i.sorte.toLowerCase())
          ) ?? items[0];
        if (found) {
          onSelectVariety(found.sorte_id);
          return true;
        }
      }
      return false;
    });
  }, [breeders, items, onSelectVariety, registerActionHandler]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <Card className={className}>
      <SectionTitle hint={`${total} Sorten im Datenpool`}>
        Sorten-Katalog & Freitextsuche
      </SectionTitle>

      {/* Search input bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted pointer-events-none" />
        <input
          type="text"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          placeholder="Sorte oder Züchter suchen (z. B. AW Talkrone, AckerWerk, Feldmark)..."
          className="w-full rounded-2xl border-0 bg-white py-3.5 pl-11 pr-10 text-base font-medium text-ink ring-1 ring-line placeholder:text-muted/70 focus:ring-2 focus:ring-leaf-500 shadow-sm"
        />
        {q ? (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setPage(0);
            }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted hover:bg-sand-100 hover:text-ink"
            aria-label="Suchtext löschen"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      {/* Filter bar */}
      <div className="mt-4 space-y-3 pt-2">
        {/* Quick breeder selector */}
        <div>
          <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Building2 className="size-3.5" /> Züchter
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {TOP_BREEDERS.map((b) => {
              const active = selectedBreeder === b.value;
              return (
                <button
                  key={b.value}
                  type="button"
                  onClick={() => {
                    setSelectedBreeder(b.value);
                    setPage(0);
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    active
                      ? "bg-leaf-600 text-white shadow-soft"
                      : "bg-white text-muted ring-1 ring-line hover:text-ink hover:ring-leaf-300"
                  }`}
                >
                  {b.label}
                </button>
              );
            })}

            {/* Dropdown for remaining breeders */}
            <select
              value={selectedBreeder}
              onChange={(e) => {
                setSelectedBreeder(e.target.value);
                setPage(0);
              }}
              className="rounded-full border-0 bg-white py-1 pl-3 pr-8 text-xs font-medium text-ink ring-1 ring-line hover:ring-leaf-300 focus:ring-2 focus:ring-leaf-500"
            >
              <option value="alle">Weitere Züchter ({breeders.length})...</option>
              {breeders.map((b) => (
                <option key={b.name} value={b.name}>
                  {b.name} ({b.count})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Usage and maturity groups */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Usage direction */}
          <div>
            <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
              Nutzung
            </div>
            <div className="inline-flex rounded-full bg-sand-100/70 p-1 ring-1 ring-line text-xs font-medium">
              {[
                ["alle", "Alle"],
                ["silo", "Silomais"],
                ["koerner", "Körnermais"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setSelectedNutzung(key as "alle" | "silo" | "koerner");
                    setPage(0);
                  }}
                  className={`rounded-full px-3 py-1 transition ${
                    selectedNutzung === key
                      ? "bg-white text-leaf-800 shadow-sm"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Maturity group */}
          <div>
            <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
              Reifegruppe
            </div>
            <div className="inline-flex rounded-full bg-sand-100/70 p-1 ring-1 ring-line text-xs font-medium">
              {[
                ["alle", "Alle"],
                ["frueh", "Früh (≤ 220)"],
                ["mittelfrueh", "Mittelfrüh (230–250)"],
                ["spaet", "Spät (≥ 260)"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setSelectedReife(key as "alle" | "frueh" | "mittelfrueh" | "spaet");
                    setPage(0);
                  }}
                  className={`rounded-full px-2.5 py-1 transition ${
                    selectedReife === key
                      ? "bg-white text-leaf-800 shadow-sm"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active filter status and reset action */}
        {(q || selectedBreeder !== "alle" || selectedNutzung !== "alle" || selectedReife !== "alle") && (
          <div className="flex items-center justify-between border-t border-line pt-2 text-xs">
            <span className="text-muted">
              Filter aktiv: {total} {total === 1 ? "Sorte gefunden" : "Sorten gefunden"}
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="font-medium text-poppy hover:underline"
            >
              Filter zurücksetzen
            </button>
          </div>
        )}
      </div>

      {/* Variety card grid */}
      <div className="mt-6">
        {isPending ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted">
            <Loader2 className="size-6 animate-spin text-leaf-600 mb-2" />
            <span className="text-sm">Lade Versuchsdaten...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl bg-sand-50 p-8 text-center ring-1 ring-line">
            <p className="font-semibold text-ink">Keine Sorten gefunden</p>
            <p className="mt-1 text-sm text-muted">
              Versuche andere Suchbegriffe oder setze den Züchter- bzw. Reifegruppenfilter zurück.
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="mt-4 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-leaf-700 ring-1 ring-line hover:bg-leaf-50"
            >
              Alle Filter aufheben
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {items.map((sorte) => {
              const reifeSilo = sorte.siloreifezahl ? `S ${sorte.siloreifezahl}` : null;
              const reifeKorn = sorte.koernerreifezahl ? `K ${sorte.koernerreifezahl}` : null;
              const reifeLabel = [reifeSilo, reifeKorn].filter(Boolean).join(" · ") || "Reife k.A.";

              return (
                <div
                  key={sorte.sorte_id}
                  onClick={() => onSelectVariety(sorte.sorte_id)}
                  className="group relative flex flex-col justify-between rounded-2xl bg-white p-4 ring-1 ring-line transition hover:ring-leaf-400 hover:shadow-soft cursor-pointer"
                >
                  <div>
                    {/* Header: Variety name & BSA badge */}
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-ink group-hover:text-leaf-700 transition">
                        {sorte.sorte}
                      </h4>
                      {Boolean(sorte.in_aktueller_bsl) && (
                        <Badge tone="leaf" title="In aktueller Beschreibender Sortenliste des BSA">
                          BSA
                        </Badge>
                      )}
                    </div>

                    {/* Breeder */}
                    <div className="mt-1 text-xs text-muted truncate" title={sorte.zuechter || ""}>
                      {sorte.zuechter || "Züchter unbekannt"}
                    </div>

                    {/* Maturity & key traits */}
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="rounded-md bg-sand-100 px-2 py-0.5 font-semibold text-ink ring-1 ring-sand-300">
                        {reifeLabel}
                      </span>
                      {sorte.zulassungsjahr && (
                        <span className="rounded-md bg-white px-2 py-0.5 text-muted ring-1 ring-line">
                          Zulassung {sorte.zulassungsjahr}
                        </span>
                      )}
                    </div>

                    {/* Usage tags */}
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {Boolean(sorte.nutzung_silo) && (
                        <span className="text-[11px] font-medium text-leaf-800 bg-leaf-50 px-1.5 py-0.5 rounded">
                          Silomais
                        </span>
                      )}
                      {Boolean(sorte.nutzung_koerner) && (
                        <span className="text-[11px] font-medium text-ink bg-sand-100 px-1.5 py-0.5 rounded">
                          Körnermais
                        </span>
                      )}
                      {Boolean(sorte.nutzung_biogas) && (
                        <span className="text-[11px] font-medium text-bee-text bg-bee-soft px-1.5 py-0.5 rounded">
                          Biogas
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action footer link */}
                  <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-xs">
                    <span className="font-semibold text-leaf-700 group-hover:underline inline-flex items-center gap-1">
                      Steckbrief öffnen <ChevronRight className="size-3" />
                    </span>
                    <Link
                      href="/feld"
                      onClick={(e) => e.stopPropagation()}
                      className="font-medium text-muted hover:text-leaf-800 hover:underline"
                    >
                      Auf Schlag testen
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-line pt-4 text-sm">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink ring-1 ring-line transition hover:bg-leaf-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="size-4" /> Vorherige
            </button>
            <span className="text-xs text-muted">
              Seite {page + 1} von {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink ring-1 ring-line transition hover:bg-leaf-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Nächste <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
