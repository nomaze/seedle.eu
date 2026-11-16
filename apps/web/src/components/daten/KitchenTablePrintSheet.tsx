"use client";

import type React from "react";
import { FileDown, Phone, ShieldCheck } from "lucide-react";
import { num } from "@/lib/format";
import { TEAM } from "@/lib/team";
import { getBreederAdvisors, getRegionalDealers } from "./WhereToBuyModal";

export interface PrintPortfolioVarietyItem {
  sharePercent: number;
  shareHa: number;
  seedUnits?: number;
  maturityStaggerBadge?: string | null;
  usageBiologyFocus?: string;
  roleLabel: string;
  name: string;
  breederName: string;
  reifezahl: number;
  relErtragProzent: number;
  advisorRationale: string;
}

export interface KitchenTablePrintSheetProps {
  fieldName: string;
  fieldAreaHa: number;
  region: string;
  usageLabel: string;
  soilSummary: string;
  portfolioTitle: string;
  portfolioItems: PrintPortfolioVarietyItem[];
  dateLabel?: string;
}

/**
 * Prominent button triggering the browser PDF/Print dialog (`window.print()`).
 */
export function PrintPdfButton({
  label = "PDF Export",
  className = "",
}: {
  label?: string;
  className?: string;
}): React.JSX.Element {
  return (
    <button
      type="button"
      data-testid="print-pdf-button"
      onClick={() => {
        if (typeof window !== "undefined" && typeof window.print === "function") {
          window.print();
        }
      }}
      className={`print:hidden inline-flex h-10 items-center justify-center gap-2 rounded-control px-3 text-[0.9375rem] font-semibold text-link ring-1 ring-inset ring-action transition-colors hover:bg-action-subtle cursor-pointer ${className}`}
    >
      <FileDown className="size-4 shrink-0" aria-hidden />
      <span>{label}</span>
    </button>
  );
}

/**
 * Clean 1-page printable farm summary sheet (`KitchenTablePrintSheet`)
 * designed for farmers to review at the kitchen table or take to their local dealer.
 */
export function KitchenTablePrintSheet({
  fieldName,
  fieldAreaHa,
  region,
  usageLabel,
  soilSummary,
  portfolioTitle,
  portfolioItems,
  dateLabel = "Anbauplanung 2027",
}: KitchenTablePrintSheetProps): React.JSX.Element {
  const dealers = getRegionalDealers(region).slice(0, 2);
  const primaryBreeder = portfolioItems[0]?.breederName ?? "KWS";
  const advisors = getBreederAdvisors(primaryBreeder, region).slice(0, 2);

  return (
    <section
      data-testid="kitchen-table-print-sheet"
      aria-label="Seedle PDF Export Druckansicht"
      className="hidden print:block space-y-5 text-fg"
    >
      {/* 1. Header */}
      <div className="flex items-start justify-between gap-6 border-b border-rule pb-4">
        <div>
          <div className="text-small text-fg-muted tabular-nums">
            Seedle Hof-Empfehlung 2027 · Schlag {fieldName} ({num(fieldAreaHa)} ha) · {dateLabel}
          </div>
          <h2 className="mt-1 text-heading text-fg">
            Sortenempfehlung 2027: Deine Sortenwahl für „{fieldName}“
          </h2>
          <p className="mt-1 text-caption text-fg-muted">
            100 % neutrale Standort-Auswertung (Mehrjährige LSV-, BSA- &amp; DWD-Wetterdaten · 90 % Standort- &amp; Wetter-Konfidenz)
          </p>
        </div>
        <div className="shrink-0 text-right text-small font-semibold text-fg">
          <div>Region: {region}</div>
          <div>Nutzung: {usageLabel}</div>
        </div>
      </div>

      {/* 2. What we know about your field */}
      <div className="space-y-1">
        <h3 className="text-subheading text-fg">
          1. Unser Wissen über dein Feld (Boden, Wasser &amp; Nutzungsrichtung)
        </h3>
        <div className="text-small font-semibold text-fg tabular-nums">
          Schlag {fieldName} ({num(fieldAreaHa)} ha) · Nutzungsrichtung: {usageLabel}
        </div>
        <div className="text-small text-fg">{soilSummary}</div>
      </div>

      {/* 3. Selected variety mix / portfolio */}
      <div className="space-y-2 border-t border-divider pt-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="text-subheading text-fg">
            2. Dein gewählter Sorten-Mix: {portfolioTitle}
          </h3>
          <span className="inline-flex items-center gap-1 text-small font-semibold text-fg">
            <ShieldCheck className="size-4" aria-hidden />
            90 % Standort- &amp; Wetter-Konfidenz
          </span>
        </div>

        <ul className="divide-y divide-divider border-y border-divider">
          {portfolioItems.map((item) => (
            <li
              key={`${item.name}-${item.sharePercent}`}
              className="space-y-1 py-3 break-inside-avoid"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="text-figure-s tabular-nums">
                    {item.sharePercent} % ({num(item.shareHa, 1)} ha
                    {typeof item.seedUnits === "number"
                      ? ` · Saatgutbedarf: ca. ${item.seedUnits} Einheiten (Säcke zu 50.000 Körnern)`
                      : ""}
                    )
                  </span>
                  <span className="text-subheading text-fg">{item.name}</span>
                  <span className="text-small text-fg-muted tabular-nums">
                    S {item.reifezahl} · K {item.reifezahl}
                  </span>
                </div>
                <div className="text-small text-fg tabular-nums">
                  {item.roleLabel} · {num(item.relErtragProzent, 0)} % Relativertrag ({item.breederName})
                </div>
              </div>
              {item.maturityStaggerBadge ? (
                <div className="text-caption font-semibold text-fg">
                  {item.maturityStaggerBadge}
                </div>
              ) : null}
              <p className="max-w-measure text-small text-fg">
                <strong>Berater-Begründung:</strong> {item.advisorRationale}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {/* 4. Direct contacts for ordering */}
      <div className="space-y-2 border-t border-divider pt-4">
        <h3 className="text-subheading text-fg">
          3. Direkter Ansprechpartner &amp; Händler zum Bestellen
        </h3>
        <ul className="grid gap-x-8 text-small sm:grid-cols-2">
          {dealers.map((d) => (
            <li key={d.name} className="border-t border-divider py-2 break-inside-avoid">
              <div className="font-semibold text-fg">{d.name}</div>
              <div className="text-fg-muted">{d.contactPerson}</div>
              <div className="mt-0.5 inline-flex items-center gap-1 font-semibold text-fg tabular-nums">
                <Phone className="size-3.5" aria-hidden />
                <span>Tel.: {d.phone}</span>
              </div>
            </li>
          ))}
          {advisors.map((a) => (
            <li key={a.breederName} className="border-t border-divider py-2 break-inside-avoid">
              <div className="font-semibold text-fg">{a.breederName}</div>
              <div className="text-fg-muted">
                {a.advisorName} ({a.specialty})
              </div>
              <div className="mt-0.5 inline-flex items-center gap-1 font-semibold text-fg tabular-nums">
                <Phone className="size-3.5" aria-hidden />
                <span>Tel.: {a.phone}</span>
              </div>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between gap-4 border-t border-rule pt-2 text-caption text-fg-muted">
          <span>
            Rückfragen an das unabhängige {TEAM.name}: <strong className="text-fg">{TEAM.telefonAnzeige}</strong> ({TEAM.erreichbar})
          </span>
          <span>seedle.de · Kostenlos &amp; 100 % neutral für Landwirte</span>
        </div>
      </div>
    </section>
  );
}
