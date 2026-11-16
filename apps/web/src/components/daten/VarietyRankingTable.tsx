"use client";

import { Building2, Check, ChevronRight, ShoppingBag } from "lucide-react";
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
  trockentoleranzNote?: number | null; // BSA-Note 1-9
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
  onWhereToBuyVariety?: (variety: RankingVarietyItem) => void;
  comparedIds?: (string | number)[];
  onToggleCompare?: (varietyId: string | number) => void;
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
  onWhereToBuyVariety,
  comparedIds,
  onToggleCompare,
  nutzung,
  emptyText = "Keine Sorten im Ranking verfügbar.",
  className = "",
}: VarietyRankingTableProps) {
  const { saatgutKauf } = useDemo();
  if (varieties.length === 0) {
    return (
      <div className="border-y border-divider py-6 text-small text-fg-muted">
        {emptyText}
      </div>
    );
  }

  const hasStandfestigkeit = varieties.some((v) => v.standfestigkeitNote != null);
  const hasTsGehalt = varieties.some((v) => v.tsGehaltProzent != null);
  const hasOrte = varieties.some((v) => v.totalOrte != null);
  const hasCompare = Boolean(onToggleCompare);

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
      <div className="sm:hidden border-t border-rule">
        {varieties.map((sorte) => {
          const reifeLabel = getReifeDisplay(sorte);
          const isSelected =
            selectedVarietyId != null && String(selectedVarietyId) === String(sorte.id);
          const isCompared =
            comparedIds != null &&
            comparedIds.some((cid) => String(cid) === String(sorte.id));

          return (
            <div
              key={sorte.id}
              onClick={() => onSelectVariety(sorte.id)}
              className={`border-b border-divider py-4 transition-colors cursor-pointer ${
                isSelected
                  ? "-mx-4 bg-highlight px-4"
                  : "hover:bg-highlight"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-figure-s tabular-nums ${
                        isSelected
                          ? "text-fg"
                          : "text-fg-muted"
                      }`}
                    >
                      #{sorte.rang}
                    </span>
                    <span className="font-bold text-fg text-body truncate">
                      {sorte.name}
                    </span>
                    {sorte.badge && (
                      <Badge tone={sorte.badgeTone ?? (sorte.rang === 1 ? "leaf" : "sand")}>
                        {sorte.badge}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-0.5 text-caption text-fg-muted flex items-center gap-1 truncate">
                    <Building2 className="size-3 shrink-0 text-fg-muted" />
                    <span className="truncate">{sorte.zuechter || "Unbekannter Züchter"}</span>
                    {reifeLabel !== "—" && (
                      <span className="font-semibold text-fg tabular-nums">
                        · {reifeLabel}
                      </span>
                    )}
                  </div>
                </div>

                {/* Relative yield index badge */}
                <div className="shrink-0 text-right">
                  <span className="text-figure-m tabular-nums text-fg">
                    {sorte.relativertragProzent != null
                      ? `${num(sorte.relativertragProzent)} %`
                      : "—"}
                  </span>
                  {sorte.relativertragSubtext && (
                    <div className="text-[10px] text-fg-muted mt-0.5 max-w-[110px] truncate">
                      {sorte.relativertragSubtext}
                    </div>
                  )}
                </div>
              </div>

              {/* Rank and agronomic metrics */}
              <div className="mt-3 flex flex-wrap items-center justify-between text-caption text-fg-muted border-t border-divider pt-2.5 gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {hasCompare && onToggleCompare && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleCompare(sorte.id);
                      }}
                      aria-pressed={isCompared}
                      className={`inline-flex min-h-9 items-center gap-1 rounded-control px-2 text-[13px] font-semibold ring-1 ring-inset cursor-pointer ${
                        isCompared
                          ? "bg-selected text-fg-inverse ring-selected"
                          : "bg-transparent text-fg ring-control"
                      }`}
                    >
                      <span className="flex size-3.5 items-center justify-center rounded-xs border border-current">
                        {isCompared ? <Check className="size-2.5" /> : null}
                      </span>
                      <span>Vergleichen</span>
                    </button>
                  )}

                  {sorte.standfestigkeitNote != null ? (
                    <span className="text-[13px] text-fg-muted">
                      BSA {sorte.standfestigkeitNote}/9
                    </span>
                  ) : null}

                  {sorte.tsGehaltProzent != null ? (
                    <span className="text-[13px] text-fg-muted tabular-nums">
                      {num(sorte.tsGehaltProzent)} % TS
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenSteckbrief ? onOpenSteckbrief(sorte.id) : onSelectVariety(sorte.id)
                    }
                    className="min-h-9 rounded-control px-2.5 text-[13px] font-semibold text-link hover:bg-action-subtle cursor-pointer transition-colors"
                  >
                    Steckbrief
                  </button>
                  {onWhereToBuyVariety ? (
                    <button
                      type="button"
                      onClick={() => onWhereToBuyVariety(sorte)}
                      className="inline-flex min-h-9 items-center gap-1 rounded-control bg-action px-2.5 text-[13px] font-semibold text-fg-inverse hover:bg-action-hover cursor-pointer"
                    >
                      <ShoppingBag className="size-3" />
                      Wo kann ich die Sorte kaufen?
                    </button>
                  ) : onBuyVariety && saatgutKauf ? (
                    <button
                      type="button"
                      onClick={() => onBuyVariety(sorte)}
                      className="inline-flex min-h-9 items-center gap-1 rounded-control bg-action px-2.5 text-[13px] font-semibold text-fg-inverse hover:bg-action-hover cursor-pointer"
                    >
                      <ShoppingBag className="size-3" />
                      Kaufen
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Desktop tabular layout (>= 640px) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-small border-collapse">
          <thead className="text-caption font-semibold text-fg-muted border-b border-rule select-none">
            <tr>
              {hasCompare && (
                <th className="py-3 pl-3 pr-2 w-24 text-center whitespace-nowrap">Vergleichen</th>
              )}
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
              <th className="py-3 pr-4 pl-2 w-44 text-right whitespace-nowrap">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {varieties.map((sorte) => {
              const reifeText = getReifeDisplay(sorte);
              const isSelected =
                selectedVarietyId != null && String(selectedVarietyId) === String(sorte.id);
              const isCompared =
                comparedIds != null &&
                comparedIds.some((cid) => String(cid) === String(sorte.id));

              return (
                <tr
                  key={sorte.id}
                  className={`group transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-highlight"
                      : "hover:bg-highlight"
                  }`}
                  onClick={() => onSelectVariety(sorte.id)}
                >
                  {hasCompare && onToggleCompare && (
                    <td
                      className="py-3.5 pl-3 pr-2 text-center whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <label className="inline-flex items-center gap-1.5 cursor-pointer text-caption font-medium text-fg">
                        <input
                          type="checkbox"
                          checked={isCompared}
                          onChange={() => onToggleCompare(sorte.id)}
                          aria-label={`${sorte.name} vergleichen`}
                          className="size-4 rounded border-divider accent-leaf-700 cursor-pointer"
                        />
                        <span className="text-[11px] text-fg-muted">Vergleichen</span>
                      </label>
                    </td>
                  )}

                  {/* Rank */}
                  <td
                    className={`py-3.5 pl-3 pr-2 text-center text-figure-s tabular-nums whitespace-nowrap ${
                      isSelected ? "text-fg" : "text-fg-muted"
                    }`}
                  >
                    #{sorte.rang}
                  </td>

                  {/* Variety & breeder */}
                  <td className="py-3.5 pl-3 pr-2 whitespace-nowrap">
                    <div className="font-bold text-fg group-hover:text-link flex items-center gap-1.5">
                      <span>{sorte.name}</span>
                      {sorte.badge && (
                        <Badge tone={sorte.badgeTone ?? (sorte.rang === 1 ? "leaf" : "sand")}>
                          {sorte.badge}
                        </Badge>
                      )}
                    </div>
                    <div className="text-caption text-fg-muted flex items-center gap-1 mt-0.5">
                      <Building2 className="size-3 text-fg-muted shrink-0" />
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
                    <span className="text-figure-s tabular-nums text-fg">
                      {reifeText}
                    </span>
                  </td>

                  {/* Relative index */}
                  <td className="py-3.5 px-2 text-right whitespace-nowrap">
                    <span className="text-figure-s tabular-nums text-[1.125rem] font-bold text-fg">
                      {sorte.relativertragProzent != null
                        ? `${num(sorte.relativertragProzent)} %`
                        : "—"}
                    </span>
                    {sorte.relativertragSubtext && (
                      <div className="text-[11px] text-fg-muted mt-0.5 font-sans">
                        {sorte.relativertragSubtext}
                      </div>
                    )}
                  </td>

                  {/* Dry matter content */}
                  {hasTsGehalt && (
                    <td className="py-3.5 px-2 text-right whitespace-nowrap text-figure-s tabular-nums text-fg">
                      {sorte.tsGehaltProzent != null ? (
                        <>
                          <span className="font-medium">{num(sorte.tsGehaltProzent)}</span>{" "}
                          <span className="text-caption text-fg-muted font-normal font-sans">%</span>
                        </>
                      ) : (
                        <span className="text-fg-muted font-normal font-sans">—</span>
                      )}
                    </td>
                  )}

                  {/* Lodging resistance */}
                  {hasStandfestigkeit && (
                    <td className="py-3.5 px-2 text-center whitespace-nowrap text-caption">
                      {sorte.standfestigkeitNote != null ? (
                        <span className="text-figure-s tabular-nums text-fg">
                          BSA {sorte.standfestigkeitNote}/9
                        </span>
                      ) : (
                        <span className="text-fg-muted font-normal font-sans">—</span>
                      )}
                    </td>
                  )}

                  {/* Trial dataset (locations & years) */}
                  {hasOrte && (
                    <td className="py-3.5 px-2 text-right whitespace-nowrap tabular-nums text-caption text-fg-muted">
                      {sorte.totalOrte != null ? (
                        <>
                          <span className="font-semibold text-fg">{sorte.totalOrte}</span>{" "}
                          <span className="font-sans">Orte</span>
                          {sorte.jahreAnzahl && (
                            <div className="text-caption text-fg-muted font-sans">
                              {sorte.jahreAnzahl} Jahre
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-fg-muted font-normal font-sans">—</span>
                      )}
                    </td>
                  )}

                  {/* Actions: profile modal & where to buy */}
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
                        className="inline-flex h-9 items-center gap-1 rounded-control px-2.5 text-[13px] font-semibold text-link hover:bg-action-subtle whitespace-nowrap cursor-pointer transition-colors"
                      >
                        Steckbrief <ChevronRight className="size-3.5" />
                      </button>

                      {onWhereToBuyVariety ? (
                        <button
                          type="button"
                          onClick={() => onWhereToBuyVariety(sorte)}
                          className="inline-flex h-9 items-center gap-1 rounded-control bg-action px-3 text-[13px] font-semibold text-fg-inverse hover:bg-action-hover transition-colors whitespace-nowrap cursor-pointer"
                        >
                          <ShoppingBag className="size-3.5" aria-hidden />
                          <span>Wo kaufen</span>
                        </button>
                      ) : onBuyVariety && saatgutKauf ? (
                        <button
                          type="button"
                          onClick={() => onBuyVariety(sorte)}
                          className="inline-flex h-9 items-center gap-1 rounded-control bg-action px-3 text-[13px] font-semibold text-fg-inverse hover:bg-action-hover transition-colors whitespace-nowrap cursor-pointer"
                        >
                          <ShoppingBag className="size-3.5" />
                          Kaufen
                        </button>
                      ) : null}
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
