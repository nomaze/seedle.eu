"use client";

import {
  ChevronRight,
  HelpCircle,
  MapPin,
  ShoppingBag,
  Sparkles,
  X,
} from "lucide-react";
import { useDemo } from "@/components/shell/DemoContext";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import { num } from "@/lib/format";
import type { RegionalTopVariety } from "@/server/services/dmk";

export interface StandortPerformancePanelProps {
  variety: RegionalTopVariety | null;
  rang?: number | null;
  regionName: string;
  nutzung: "silo" | "koerner";
  locationLabel?: string | null;
  onOpenSteckbrief: (varietyId: number) => void;
  onBuyVariety?: (variety: RegionalTopVariety) => void;
  className?: string;
  isMobileDrawer?: boolean;
  onCloseDrawer?: () => void;
}

export function StandortPerformancePanel({
  variety,
  rang = 1,
  regionName,
  nutzung,
  locationLabel,
  onOpenSteckbrief,
  onBuyVariety,
  className = "",
  isMobileDrawer = false,
  onCloseDrawer,
}: StandortPerformancePanelProps) {
  const { saatgutKauf } = useDemo();

  if (!variety) {
    return (
      <aside
        aria-label="Standort-Performance"
        className={`border-t border-rule pt-5 ${className}`}
      >
        <div className="flex items-center gap-2 text-subheading text-fg">
          <HelpCircle className="size-4 text-fg-muted" aria-hidden />
          <span>Standort-Performance</span>
        </div>
        <p className="mt-2 text-small text-fg-muted">
          Wähle eine Sorte aus der Tabelle aus, um ihren Standort-Vergleich und die Eignung für
          deinen konkreten Schlag zu sehen.
        </p>
      </aside>
    );
  }

  const reifeText =
    nutzung === "silo"
      ? variety.siloreifezahl != null
        ? `S ${variety.siloreifezahl}`
        : variety.reife_anzeige || "Siloreife"
      : variety.koernerreifezahl != null
        ? `K ${variety.koernerreifezahl}`
        : variety.reife_anzeige || "Körnerreife";

  const nutzungLabel = nutzung === "silo" ? "Silomais" : "Körnermais";

  const advantagePercent =
    variety.avg_rel_ertrag != null ? variety.avg_rel_ertrag - 100 : null;

  return (
    <aside
      aria-label={`Standort-Performance für ${variety.sorte}`}
      className={`space-y-5 border-t border-rule pt-5 ${className}`}
    >
      {/* 1. Header with rank, variety, and breeder */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-figure-s tabular-nums text-fg-muted">
              #{rang ?? 1}
            </span>
            <Badge tone={rang === 1 ? "leaf" : "sand"}>
              {rang === 1 ? "Regionssieger" : `Top in ${regionName}`}
            </Badge>
            <span className="text-caption text-fg-muted">{nutzungLabel}</span>
          </div>

          {isMobileDrawer && onCloseDrawer && (
            <button
              type="button"
              onClick={onCloseDrawer}
              aria-label="Panel schließen"
              className="flex size-9 cursor-pointer items-center justify-center rounded-control text-fg-muted transition-colors hover:bg-highlight hover:text-fg"
            >
              <X className="size-4" aria-hidden />
            </button>
          )}
        </div>

        <h3 className="mt-1 text-heading text-fg">
          {variety.sorte}
        </h3>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-small text-fg-muted">
          <span>{variety.zuechter || "Unbekannter Züchter"}</span>
          <span>·</span>
          <span className="font-semibold tabular-nums text-fg">
            {reifeText}
          </span>
          {variety.zulassungsjahr && <span>· Zulassung {variety.zulassungsjahr}</span>}
        </div>
      </div>

      {/* 2. Regional trial mean performance */}
      <div className="space-y-2 border-t border-divider pt-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-small">
          <span className="text-fg-muted">
            Relativertrag (LSV)
          </span>
          {advantagePercent != null && (
            <span
              className={`font-semibold tabular-nums ${
                advantagePercent >= 0 ? "text-link" : "text-status-problem-text"
              }`}
            >
              {advantagePercent >= 0
                ? `+${advantagePercent.toFixed(1)} % über Schnitt`
                : `${advantagePercent.toFixed(1)} % unter Schnitt`}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-figure-l tabular-nums text-fg">
            {variety.avg_rel_ertrag != null ? `${num(variety.avg_rel_ertrag)} %` : "—"}
          </span>
          <span className="text-small text-fg-muted">zur amtlichen Bezugsbasis</span>
        </div>

        {/* Key metrics grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-divider pt-3">
          <div>
            <span className="block text-caption text-fg-muted">
              Regional-Rang ({nutzungLabel})
            </span>
            <span className="text-figure-s tabular-nums text-fg">
              Platz #{rang ?? 1}
            </span>
          </div>

          <div>
            <span className="block text-caption text-fg-muted">
              {nutzung === "silo" ? "Ø TS-Gehalt Silo" : "Ø Korn-TS"}
            </span>
            <span className="text-figure-s tabular-nums text-fg">
              {variety.avg_tsg != null ? `${num(variety.avg_tsg)} %` : "—"}
            </span>
          </div>

          <div>
            <span className="block text-caption text-fg-muted">Versuchsstandorte</span>
            <span className="text-figure-s tabular-nums text-fg">
              {variety.total_orte} Orte ({variety.jahre_anzahl} J.)
            </span>
          </div>

          <div>
            <span className="block text-caption text-fg-muted">Letztes Versuchsjahr</span>
            <span className="text-figure-s tabular-nums text-fg">
              {variety.letztes_jahr || "—"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Site performance on target parcel */}
      <div className="space-y-3 border-t border-divider pt-4">
        <div className="flex items-center gap-1.5 text-subheading text-fg">
          <Sparkles className="size-4 text-link" aria-hidden />
          <span>Auf deinem konkreten Schlag</span>
        </div>

        <p className="text-small text-fg-muted">
          Versuchsdaten zeigen das regionale Mittel für {regionName}. NoMaze rechnet die
          konkrete Eignung für deinen Boden, deine Niederschläge und Höhenlage.
        </p>

        {locationLabel && (
          <div className="inline-flex items-center gap-1 text-small font-semibold tabular-nums text-fg">
            <MapPin className="size-4 text-link" aria-hidden />
            <span>Gewählter Standort: {locationLabel}</span>
          </div>
        )}

        <div className="pt-1">
          <ButtonLink
            href={`/feld?sorte=${variety.sorte_id}`}
            variant="primary"
            size="md"
            className="w-full"
          >
            <MapPin className="size-4" aria-hidden />
            Auf eigenem Schlag prüfen →
          </ButtonLink>
          <span className="mt-2 block text-caption text-fg-muted">
            Ein Tipp auf die Karte genügt — Boden & Wetter laden sofort.
          </span>
        </div>
      </div>

      {/* 4. Actions: variety profile & optional seed checkout */}
      <div className="space-y-2 border-t border-divider pt-4">
        <button
          type="button"
          onClick={() => onOpenSteckbrief(variety.sorte_id)}
          className={buttonClass("secondary", "md", "w-full cursor-pointer")}
        >
          <span>Vollständigen Steckbrief öffnen</span>
          <ChevronRight className="size-4" aria-hidden />
        </button>

        {onBuyVariety && saatgutKauf && (
          <button
            type="button"
            onClick={() => onBuyVariety(variety)}
            className={buttonClass("quiet", "md", "w-full cursor-pointer")}
          >
            <ShoppingBag className="size-4" aria-hidden />
            <span>Saatgut anfragen</span>
          </button>
        )}
      </div>
    </aside>
  );
}
