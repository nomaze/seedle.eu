"use client";

import { Building2, ChevronLeft, ChevronRight, Loader2, Search, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useSpross } from "@/components/spross/SprossContext";
import { Badge } from "@/components/ui/Badge";
import { buttonClass } from "@/components/ui/Button";
import { Card, SectionTitle } from "@/components/ui/Card";
import type { BreederOption, DmkVarietyItem, VarietySearchResult } from "@/server/services/dmk";
import { segmentClass } from "@/components/ui/Choice";

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
      <div className="relative max-w-measure">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-fg-muted" aria-hidden />
        <input
          type="text"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          placeholder="Sorte oder Züchter suchen (z. B. AW Talkrone, AckerWerk, Feldmark)..."
          className="h-control w-full rounded-control border border-control bg-surface pl-11 pr-11 text-body text-fg placeholder:text-fg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        />
        {q ? (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setPage(0);
            }}
            className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-control text-fg-muted transition-colors hover:bg-highlight hover:text-fg"
            aria-label="Suchtext löschen"
          >
            <X className="size-4" aria-hidden />
          </button>
        ) : null}
      </div>

      {/* Filter bar */}
      <div className="mt-6 space-y-5">
        {/* Quick breeder selector */}
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-small font-semibold text-fg">
            <Building2 className="size-4 text-fg-muted" aria-hidden /> Züchter
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
                  aria-pressed={active}
                  className={segmentClass(active)}
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
              aria-label="Weitere Züchter"
              className="h-control-sm cursor-pointer rounded-control border border-control bg-surface pl-3 pr-8 text-small text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Usage direction */}
          <div>
            <div className="mb-2 text-small font-semibold text-fg">
              Nutzung
            </div>
            <div className="inline-flex flex-wrap gap-1.5">
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
                  aria-pressed={selectedNutzung === key}
                  className={segmentClass(selectedNutzung === key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Maturity group */}
          <div>
            <div className="mb-2 text-small font-semibold text-fg">
              Reifegruppe
            </div>
            <div className="inline-flex flex-wrap gap-1.5">
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
                  aria-pressed={selectedReife === key}
                  className={segmentClass(selectedReife === key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active filter status and reset action */}
        {(q || selectedBreeder !== "alle" || selectedNutzung !== "alle" || selectedReife !== "alle") && (
          <div className="flex flex-wrap items-center justify-between gap-x-4 border-t border-divider pt-3 text-small">
            <span className="tabular-nums text-fg-muted">
              Filter aktiv: {total} {total === 1 ? "Sorte gefunden" : "Sorten gefunden"}
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex min-h-touch cursor-pointer items-center font-semibold text-link underline-offset-4 hover:underline"
            >
              Filter zurücksetzen
            </button>
          </div>
        )}
      </div>

      {/* Variety list */}
      <div className="mt-8">
        {isPending ? (
          <div className="flex items-center gap-2 border-t border-rule py-8 text-fg-muted">
            <Loader2 className="size-5 animate-spin text-link" aria-hidden />
            <span className="text-small">Lade Versuchsdaten...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="border-t border-rule py-8">
            <p className="font-semibold text-fg">Keine Sorten gefunden</p>
            <p className="mt-1 max-w-measure text-small text-fg-muted">
              Versuche andere Suchbegriffe oder setze den Züchter- bzw. Reifegruppenfilter zurück.
            </p>
            <button
              type="button"
              onClick={handleReset}
              className={buttonClass("secondary", "sm", "mt-4 cursor-pointer")}
            >
              Alle Filter aufheben
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-divider border-y border-rule">
            {items.map((sorte) => {
              const reifeSilo = sorte.siloreifezahl ? `S ${sorte.siloreifezahl}` : null;
              const reifeKorn = sorte.koernerreifezahl ? `K ${sorte.koernerreifezahl}` : null;
              const reifeLabel = [reifeSilo, reifeKorn].filter(Boolean).join(" · ") || "Reife k.A.";

              return (
                <li
                  key={sorte.sorte_id}
                  onClick={() => onSelectVariety(sorte.sorte_id)}
                  className="group -mx-2 flex cursor-pointer flex-col gap-2 px-2 py-3.5 transition-colors hover:bg-highlight sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                >
                  <div className="min-w-0">
                    {/* Variety name & BSA label */}
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <h4 className="text-subheading text-fg transition-colors group-hover:text-link">
                        {sorte.sorte}
                      </h4>
                      {Boolean(sorte.in_aktueller_bsl) && (
                        <Badge tone="leaf" title="In aktueller Beschreibender Sortenliste des BSA">
                          BSA
                        </Badge>
                      )}
                    </div>

                    {/* Meta line: breeder · maturity · approval · usage */}
                    <div className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 text-small text-fg-muted">
                      <span className="max-w-[16rem] truncate" title={sorte.zuechter || ""}>
                        {sorte.zuechter || "Züchter unbekannt"}
                      </span>
                      <span aria-hidden>·</span>
                      <span className="font-semibold tabular-nums text-fg">
                        {reifeLabel}
                      </span>
                      {sorte.zulassungsjahr && (
                        <>
                          <span aria-hidden>·</span>
                          <span className="tabular-nums">Zulassung {sorte.zulassungsjahr}</span>
                        </>
                      )}
                      {Boolean(sorte.nutzung_silo) && (
                        <>
                          <span aria-hidden>·</span>
                          <span>Silomais</span>
                        </>
                      )}
                      {Boolean(sorte.nutzung_koerner) && (
                        <>
                          <span aria-hidden>·</span>
                          <span>Körnermais</span>
                        </>
                      )}
                      {Boolean(sorte.nutzung_biogas) && (
                        <>
                          <span aria-hidden>·</span>
                          <span>Biogas</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-5 text-small">
                    <span className="inline-flex items-center gap-1 font-semibold text-link underline-offset-4 group-hover:underline">
                      Steckbrief öffnen <ChevronRight className="size-4" aria-hidden />
                    </span>
                    <Link
                      href="/feld"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex min-h-touch items-center text-fg-muted underline-offset-4 hover:text-link hover:underline"
                    >
                      Auf Schlag testen
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between gap-4 text-small">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className={buttonClass("secondary", "sm", "cursor-pointer")}
            >
              <ChevronLeft className="size-4" aria-hidden /> Vorherige
            </button>
            <span className="tabular-nums text-fg-muted">
              Seite {page + 1} von {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className={buttonClass("secondary", "sm", "cursor-pointer")}
            >
              Nächste <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
