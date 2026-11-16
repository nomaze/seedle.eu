"use client";

import { Building2, Check, Plus, Scale, ShoppingBag, X } from "lucide-react";
import { useEffect } from "react";
import { Badge } from "@/components/ui/Badge";
import { buttonClass } from "@/components/ui/Button";
import { segmentClass } from "@/components/ui/Choice";
import { num } from "@/lib/format";

export interface ComparableVarietyItem {
  id: string;
  rang: number;
  name: string;
  zuechter: string;
  reifezahl: number;
  relErtragNormal: number;
  relErtragTrocken: number;
  relErtragKuehl: number;
  standfestigkeit: number;
  trockentoleranz: number;
  jugendentwicklung: number;
  krankheitsresistenz: number;
  soilSuitabilityLabel: string;
  isReference?: boolean;
}

export interface VarietyCompareModalProps {
  open: boolean;
  onClose: () => void;
  allVarieties: ComparableVarietyItem[];
  comparedIds: string[];
  onToggleCompareId: (id: string) => void;
  onWhereToBuy?: (variety: ComparableVarietyItem) => void;
  fieldName?: string;
}

export function VarietyCompareModal({
  open,
  onClose,
  allVarieties,
  comparedIds,
  onToggleCompareId,
  onWhereToBuy,
  fieldName,
}: VarietyCompareModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const selectedVarieties = allVarieties.filter((v) => comparedIds.includes(v.id));
  const displayedVarieties =
    selectedVarieties.length > 0 ? selectedVarieties : allVarieties.slice(0, 2);
  // Platz 1 gets the highlight surface across its whole column.
  const col = (v: ComparableVarietyItem) =>
    `px-3 py-3 text-right ${v.rang === 1 ? "bg-highlight" : ""}`;
  const rowHead = "py-3 pr-4 text-left font-normal text-fg-muted";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <div
        className="fixed inset-0 bg-scrim"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="compare-modal-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-panel bg-surface shadow-lift motion-safe:animate-rise motion-safe:[animation-duration:180ms]"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-divider py-4 pl-5 pr-3 sm:py-5 sm:pl-6">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5 text-small text-fg-muted">
              <Scale className="size-4 shrink-0" aria-hidden />
              <span>Direkter 1:1 Sorten-Vergleich</span>
              {fieldName ? <span>· Schlag: {fieldName}</span> : null}
            </div>
            <h2 id="compare-modal-title" className="text-heading text-fg">
              Sorten direkt nebeneinander vergleichen
            </h2>
            <p className="max-w-measure text-small text-fg-muted">
              Vergleiche Reifezahl, Relativertrag in Normal- & Trockenjahren, Standfestigkeit,
              Jugendentwicklung, Krankheitsresistenz und Eignung für deinen Boden.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-touch shrink-0 items-center justify-center rounded-control text-link transition-colors hover:bg-action-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            aria-label="Vergleich schließen"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        {/* Toggle bar to add/remove varieties inside the modal */}
        <div className="border-b border-divider px-5 py-3 sm:px-6">
          <div className="mb-2 text-small text-fg-muted">
            Sorten im Vergleich an- oder abwählen (klicken zum Dazuschalten):
          </div>
          <div className="flex flex-wrap gap-2">
            {allVarieties.map((v) => {
              const active = comparedIds.includes(v.id);
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onToggleCompareId(v.id)}
                  aria-pressed={active}
                  className={segmentClass(
                    active,
                    "cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                  )}
                >
                  {active ? <Check className="size-4" aria-hidden /> : <Plus className="size-4 text-link" aria-hidden />}
                  <span className="tabular-nums">
                    #{v.rang} {v.name}
                  </span>
                  {v.isReference ? (
                    <span className="font-normal">
                      · Altsorte
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Side-by-side comparison matrix */}
        <div className="flex-1 overflow-auto p-5 sm:p-6">
          {displayedVarieties.length === 0 ? (
            <div className="border-y border-divider py-6 text-small text-fg-muted">
              Keine Sorten für den direkten Vergleich verfügbar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse text-small tabular-nums">
              <thead>
                <tr className="border-b border-rule">
                  <th className="w-48 py-3 pr-4 text-left align-bottom text-caption font-semibold text-fg-muted">
                    Merkmal
                  </th>
                  {displayedVarieties.map((v) => (
                    <th key={v.id} className={`${col(v)} align-bottom font-normal`}>
                      <div className="flex flex-wrap items-baseline justify-end gap-x-2 text-caption text-fg-muted">
                        <span className={v.rang === 1 ? "font-semibold text-fg" : ""}>Platz #{v.rang}</span>
                        {v.isReference ? <Badge tone="bee">Deine Referenz</Badge> : null}
                      </div>
                      <div className="mt-1 text-subheading text-fg">{v.name}</div>
                      <div className="mt-0.5 flex items-center justify-end gap-1 text-caption text-fg-muted">
                        <Building2 className="size-3 shrink-0" aria-hidden />
                        <span>{v.zuechter}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                <tr>
                  <th scope="row" className={rowHead}>Reifezahl (S / K)</th>
                  {displayedVarieties.map((v) => (
                    <td key={v.id} className={`${col(v)} font-semibold text-fg`}>
                      S {v.reifezahl} / K {v.reifezahl}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row" className={rowHead}>
                    Relativertrag Normaljahr (vs. Regionsschnitt)
                  </th>
                  {displayedVarieties.map((v) => (
                    <td key={v.id} className={`${col(v)} text-figure-s text-fg`}>
                      {num(v.relErtragNormal, 0)} %
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row" className={rowHead}>
                    Ertrag im Trockenjahr / Hitzestress
                  </th>
                  {displayedVarieties.map((v) => (
                    <td key={v.id} className={`${col(v)} font-semibold text-fg`}>
                      {num(v.relErtragTrocken, 0)} % rel.
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row" className={rowHead}>
                    Ertrag im kühlen / nassen Jahr
                  </th>
                  {displayedVarieties.map((v) => (
                    <td key={v.id} className={`${col(v)} font-semibold text-fg`}>
                      {num(v.relErtragKuehl, 0)} % rel.
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row" className={rowHead}>Standfestigkeit (BSA-Note)</th>
                  {displayedVarieties.map((v) => (
                    <td key={v.id} className={`${col(v)} text-fg`}>
                      BSA {v.standfestigkeit} / 9
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row" className={rowHead}>Trockenstresstoleranz (BSA)</th>
                  {displayedVarieties.map((v) => (
                    <td key={v.id} className={`${col(v)} text-fg`}>
                      BSA {v.trockentoleranz} / 9
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row" className={rowHead}>
                    Jugendentwicklung & Kältetoleranz
                  </th>
                  {displayedVarieties.map((v) => (
                    <td key={v.id} className={`${col(v)} text-fg`}>
                      BSA {v.jugendentwicklung} / 9
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row" className={rowHead}>
                    Krankheitsresistenz (Stängel / Blatt)
                  </th>
                  {displayedVarieties.map((v) => (
                    <td key={v.id} className={`${col(v)} text-fg`}>
                      BSA {v.krankheitsresistenz} / 9
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row" className={rowHead}>Eignung für deinen Boden</th>
                  {displayedVarieties.map((v) => (
                    <td key={v.id} className={`${col(v)} text-fg`}>
                      {v.soilSuitabilityLabel}
                    </td>
                  ))}
                </tr>
                {onWhereToBuy ? (
                  <tr>
                    <th scope="row" className={rowHead}>Bezugsquellen vor Ort</th>
                    {displayedVarieties.map((v) => (
                      <td key={v.id} className={col(v)}>
                        <button
                          type="button"
                          onClick={() => onWhereToBuy(v)}
                          className={buttonClass("primary", "sm", "cursor-pointer")}
                        >
                          <ShoppingBag className="size-4" aria-hidden />
                          <span>Wo kann ich die Sorte kaufen?</span>
                        </button>
                      </td>
                    ))}
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
