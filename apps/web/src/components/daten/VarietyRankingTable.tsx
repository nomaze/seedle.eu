"use client";

import { Building2, ChevronRight, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { num } from "@/lib/format";
import { useDemo } from "@/components/shell/DemoContext";

export interface RankingVarietyItem {
  id: number | string;
  rang: number;
  name: string;
  zuechter?: string | null;
  reifeLabel?: string | null;
  reife_anzeige?: string | null;
  reifegruppe_stufe?: "frueh" | "mittelfrueh" | "spaet";
  siloreifezahl?: number | null;
  koernerreifezahl?: number | null;
  zulassungsjahr?: number | null;
  ertragDtHa?: number | null;
  ertragEinheit?: string;
  relativertragProzent: number | null;
  relativertragSubtext?: string | null;
  standfestigkeitNote?: number | null; // BSA-Note 1-9 (9 = sehr standfest)
  tsGehaltProzent?: number | null;
  staerkeProzent?: number | null;
  totalOrte?: number | null;
  jahreAnzahl?: number | null;
  badge?: string | null;
  badgeTone?: "leaf" | "sand" | "bee" | "poppy" | "neutral";
  detailHref?: string | null;
  nutzung?: "silo" | "koerner";
}

export interface VarietyRankingTableProps {
  varieties: RankingVarietyItem[];
  onSelectVariety: (varietyId: number | string) => void;
  selectedVarietyId?: number | string | null;
  onOpenSteckbrief?: (varietyId: number | string) => void;
  onBuyVariety?: (variety: {
    id: number | string;
    name: string;
    zuechter?: string | null;
    siloreifezahl?: number | null;
    koernerreifezahl?: number | null;
  }) => void;
  nutzung?: "silo" | "koerner";
  emptyText?: string;
  className?: string;
}

export function VarietyRankingTable({
  varieties,
  onSelectVariety,
  selectedVarietyId,
  onOpenSteckbrief,
  onBuyVariety,
  nutzung,
  emptyText = "Keine Sorten im Ranking verfügbar.",
  className = "",
}: VarietyRankingTableProps) {
  const { saatgutKauf } = useDemo();
  if (varieties.length === 0) {
    return (
      <div className="rounded-xl bg-sand-50 p-6 text-center text-sm text-muted ring-1 ring-line">
        {emptyText}
      </div>
    );
  }

  // Determine presence of lodging resistance, dry matter content, or site counts in dataset
  const hasStandfestigkeit = varieties.some((v) => v.standfestigkeitNote != null);
  const hasTsGehalt = varieties.some((v) => v.tsGehaltProzent != null);
  const hasOrte = varieties.some((v) => v.totalOrte != null);

  const reifeHeader =
    nutzung === "silo"
      ? "Siloreife"
      : nutzung === "koerner"
        ? "Körnerreife"
        : "Reifezahl";

  const tsHeader = nutzung === "silo" ? "TS-Gehalt" : "Korn-TS";

  function getReifeDisplay(sorte: RankingVarietyItem): string {
    if (nutzung === "silo") {
      if (sorte.siloreifezahl != null) return `S ${sorte.siloreifezahl}`;
      if (sorte.reife_anzeige) return sorte.reife_anzeige;
      return "—";
    }
    if (nutzung === "koerner") {
      if (sorte.koernerreifezahl != null) return `K ${sorte.koernerreifezahl}`;
      if (sorte.reife_anzeige) return sorte.reife_anzeige;
      return "—";
    }
    if (sorte.reifeLabel) return sorte.reifeLabel;
    const parts = [
      sorte.siloreifezahl ? `S ${sorte.siloreifezahl}` : null,
      sorte.koernerreifezahl ? `K ${sorte.koernerreifezahl}` : null,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(" · ") : "—";
  }

  return (
    <div className={className}>
      {/* 1. Mobile card layout (< 640px) */}
      <div className="sm:hidden space-y-3">
        {varieties.map((sorte) => {
          const reifeLabel = getReifeDisplay(sorte);
          const isSelected =
            selectedVarietyId != null && String(selectedVarietyId) === String(sorte.id);

          return (
            <div
              key={sorte.id}
              onClick={() => onSelectVariety(sorte.id)}
              className={`rounded-xl border p-4 shadow-sm transition cursor-pointer ${
                isSelected
                  ? "border-leaf-600 bg-leaf-50/70 ring-2 ring-leaf-500 shadow-md"
                  : "border-line bg-white hover:border-leaf-300 hover:shadow"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-xs font-bold font-mono tabular-nums ${
                        isSelected
                          ? "bg-leaf-700 text-white"
                          : "bg-sand-200 text-leaf-900"
                      }`}
                    >
                      #{sorte.rang}
                    </span>
                    <span className="font-bold text-ink text-base truncate">
                      {sorte.name}
                    </span>
                    {sorte.badge && (
                      <Badge tone={sorte.badgeTone ?? (sorte.rang === 1 ? "leaf" : "sand")}>
                        {sorte.badge}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-muted flex items-center gap-1 truncate">
                    <Building2 className="size-3 shrink-0 text-muted/70" />
                    <span className="truncate">{sorte.zuechter || "Unbekannter Züchter"}</span>
                    {reifeLabel !== "—" && (
                      <span className="font-semibold text-leaf-900 font-mono tabular-nums">
                        · {reifeLabel}
                      </span>
                    )}
                  </div>
                </div>

                {/* Relative yield index badge */}
                <div className="shrink-0 text-right">
                  <span className="inline-block rounded-md bg-leaf-100 px-2.5 py-1 text-sm font-bold text-leaf-800 font-mono tabular-nums">
                    {sorte.relativertragProzent != null
                      ? `${num(sorte.relativertragProzent)} %`
                      : "—"}
                  </span>
                  {sorte.relativertragSubtext && (
                    <div className="text-[10px] text-muted mt-0.5 max-w-[110px] truncate">
                      {sorte.relativertragSubtext}
                    </div>
                  )}
                </div>
              </div>

              {/* Rank and agronomic metrics */}
              <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-muted border-t border-line/60 pt-2.5 gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-ink">
                    Platz {sorte.rang}
                  </span>

                  {sorte.tsGehaltProzent != null ? (
                    <span className="rounded bg-sand-100 px-1.5 py-0.5 text-[11px] font-medium text-ink ring-1 ring-sand-300 font-mono tabular-nums">
                      {num(sorte.tsGehaltProzent)} % TS
                    </span>
                  ) : null}

                  {sorte.standfestigkeitNote != null ? (
                    <span className="rounded bg-sand-100 px-1.5 py-0.5 text-[11px] font-medium text-ink ring-1 ring-sand-300">
                      BSA {sorte.standfestigkeitNote}/9
                    </span>
                  ) : null}

                  {sorte.totalOrte != null ? (
                    <span className="text-muted font-mono tabular-nums">
                      ({sorte.totalOrte} Orte{sorte.jahreAnzahl ? ` · ${sorte.jahreAnzahl} J.` : ""})
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenSteckbrief ? onOpenSteckbrief(sorte.id) : onSelectVariety(sorte.id)
                    }
                    className="rounded-full bg-sand-100 px-2.5 py-1 text-xs font-semibold text-leaf-800 ring-1 ring-line hover:bg-leaf-50 cursor-pointer transition"
                  >
                    Steckbrief
                  </button>
                  {onBuyVariety && saatgutKauf && (
                    <button
                      type="button"
                      onClick={() => onBuyVariety(sorte)}
                      className="inline-flex items-center gap-1 rounded-full bg-leaf-600 hover:bg-leaf-500 text-white px-2.5 py-1 text-xs font-bold shadow-sm cursor-pointer"
                    >
                      <ShoppingBag className="size-3" />
                      Kaufen
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Desktop tabular layout (>= 640px) */}
      <div className="hidden sm:block overflow-x-auto rounded-xl border border-line bg-white shadow-soft">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-sand-50/80 border-b border-line text-xs font-semibold text-muted select-none">
            <tr>
              <th className="py-3 pl-3 pr-2 w-14 text-center whitespace-nowrap">Rang</th>
              <th className="py-3 pl-3 pr-2 text-left whitespace-nowrap">Sorte & Züchter</th>
              <th className="py-3 px-2 w-24 text-center whitespace-nowrap">{reifeHeader}</th>
              <th className="py-3 px-2 w-28 text-right whitespace-nowrap">Relativ-Index</th>
              {hasTsGehalt && (
                <th className="py-3 px-2 w-24 text-right whitespace-nowrap">{tsHeader}</th>
              )}
              {hasStandfestigkeit && (
                <th className="py-3 px-2 w-24 text-center whitespace-nowrap">Standfestigkeit</th>
              )}
              {hasOrte && (
                <th className="py-3 px-2 w-24 text-right whitespace-nowrap">Versuchsbasis</th>
              )}
              <th className="py-3 pr-4 pl-2 w-32 text-right whitespace-nowrap">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {varieties.map((sorte) => {
              const reifeText = getReifeDisplay(sorte);
              const isSelected =
                selectedVarietyId != null && String(selectedVarietyId) === String(sorte.id);

              return (
                <tr
                  key={sorte.id}
                  className={`group transition cursor-pointer border-l-4 ${
                    isSelected
                      ? "bg-leaf-100/70 border-leaf-700 font-medium"
                      : "border-transparent hover:bg-leaf-50/50"
                  }`}
                  onClick={() => onSelectVariety(sorte.id)}
                >
                  {/* Rank */}
                  <td
                    className={`py-3.5 pl-3 pr-2 text-center font-bold font-mono tabular-nums whitespace-nowrap ${
                      isSelected ? "text-leaf-900" : "text-muted group-hover:text-leaf-800"
                    }`}
                  >
                    #{sorte.rang}
                  </td>

                  {/* Variety & breeder */}
                  <td className="py-3.5 pl-3 pr-2 whitespace-nowrap">
                    <div className="font-semibold text-ink group-hover:text-leaf-700 flex items-center gap-1.5">
                      <span>{sorte.name}</span>
                      {sorte.badge && (
                        <Badge tone={sorte.badgeTone ?? (sorte.rang === 1 ? "leaf" : "sand")}>
                          {sorte.badge}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted flex items-center gap-1 mt-0.5">
                      <Building2 className="size-3 text-muted/70 shrink-0" />
                      <span className="truncate max-w-[220px]">
                        {sorte.zuechter || "Unbekannter Züchter"}
                      </span>
                      {sorte.zulassungsjahr && (
                        <span>· Zulassung {sorte.zulassungsjahr}</span>
                      )}
                    </div>
                  </td>

                  {/* Maturity */}
                  <td className="py-3.5 px-2 text-center whitespace-nowrap">
                    <span className="inline-block rounded bg-sand-100 px-2 py-0.5 text-xs font-semibold text-ink ring-1 ring-line/80 font-mono tabular-nums">
                      {reifeText}
                    </span>
                  </td>

                  {/* Relative index */}
                  <td className="py-3.5 px-2 text-right whitespace-nowrap">
                    <span className="inline-block rounded-md bg-leaf-100/90 px-2.5 py-0.5 font-bold text-leaf-800 font-mono tabular-nums">
                      {sorte.relativertragProzent != null
                        ? `${num(sorte.relativertragProzent)} %`
                        : "—"}
                    </span>
                    {sorte.relativertragSubtext && (
                      <div className="text-[11px] text-muted mt-0.5 font-sans">
                        {sorte.relativertragSubtext}
                      </div>
                    )}
                  </td>

                  {/* Dry matter content */}
                  {hasTsGehalt && (
                    <td className="py-3.5 px-2 text-right whitespace-nowrap font-mono tabular-nums text-ink">
                      {sorte.tsGehaltProzent != null ? (
                        <>
                          <span className="font-medium">{num(sorte.tsGehaltProzent)}</span>{" "}
                          <span className="text-xs text-muted font-normal font-sans">%</span>
                        </>
                      ) : (
                        <span className="text-muted font-normal font-sans">—</span>
                      )}
                    </td>
                  )}

                  {/* Lodging resistance */}
                  {hasStandfestigkeit && (
                    <td className="py-3.5 px-2 text-center whitespace-nowrap text-xs">
                      {sorte.standfestigkeitNote != null ? (
                        <span className="inline-flex items-center rounded-full bg-sand-100 px-2.5 py-0.5 font-semibold text-ink ring-1 ring-sand-300">
                          BSA {sorte.standfestigkeitNote}/9
                        </span>
                      ) : (
                        <span className="text-muted font-normal font-sans">—</span>
                      )}
                    </td>
                  )}

                  {/* Trial dataset (locations & years) */}
                  {hasOrte && (
                    <td className="py-3.5 px-2 text-right whitespace-nowrap font-mono tabular-nums text-xs text-muted">
                      {sorte.totalOrte != null ? (
                        <>
                          <span className="font-semibold text-ink">{sorte.totalOrte}</span>{" "}
                          <span className="font-sans">Orte</span>
                          {sorte.jahreAnzahl && (
                            <div className="text-[11px] text-muted/80 font-sans">
                              {sorte.jahreAnzahl} Jahre
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-muted font-normal font-sans">—</span>
                      )}
                    </td>
                  )}

                  {/* Actions: profile modal & seed inquiry */}
                  <td
                    className="py-3.5 pr-4 pl-2 text-right whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          onOpenSteckbrief
                            ? onOpenSteckbrief(sorte.id)
                            : onSelectVariety(sorte.id)
                        }
                        className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-leaf-700 ring-1 ring-line hover:ring-leaf-300 hover:bg-leaf-50 whitespace-nowrap cursor-pointer transition shadow-sm"
                      >
                        Steckbrief <ChevronRight className="size-3.5" />
                      </button>
                      {onBuyVariety && saatgutKauf && (
                        <button
                          type="button"
                          onClick={() => onBuyVariety(sorte)}
                          className="inline-flex items-center gap-1 rounded-full bg-leaf-600 hover:bg-leaf-500 active:bg-leaf-700 text-white px-3 py-1 text-xs font-bold shadow-sm transition whitespace-nowrap cursor-pointer"
                        >
                          <ShoppingBag className="size-3.5" />
                          Kaufen
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
