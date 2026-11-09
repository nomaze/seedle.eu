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
import { ButtonLink } from "@/components/ui/Button";
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
        className={`rounded-2xl border border-line bg-white/95 p-5 shadow-soft backdrop-blur-sm ${className}`}
      >
        <div className="flex items-center gap-2 text-muted">
          <HelpCircle className="size-4 text-leaf-600" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Standort-Performance
          </span>
        </div>
        <p className="mt-3 text-sm text-muted">
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
      className={`rounded-2xl border border-line bg-white/95 p-5 shadow-soft backdrop-blur-sm space-y-4 ${className}`}
    >
      {/* 1. Header with rank, variety, and breeder */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center rounded-md bg-leaf-100 px-2 py-0.5 text-xs font-bold text-leaf-800 font-mono tabular-nums">
              #{rang ?? 1}
            </span>
            <Badge tone={rang === 1 ? "leaf" : "sand"}>
              {rang === 1 ? "Regionssieger" : `Top in ${regionName}`}
            </Badge>
            <span className="text-xs text-muted font-medium">{nutzungLabel}</span>
          </div>

          {isMobileDrawer && onCloseDrawer && (
            <button
              type="button"
              onClick={onCloseDrawer}
              aria-label="Panel schließen"
              className="rounded-full p-1 text-muted hover:bg-sand-100 hover:text-ink cursor-pointer transition"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <h3 className="mt-2 text-xl font-bold leading-tight text-ink">
          {variety.sorte}
        </h3>
        <div className="mt-0.5 text-xs text-muted flex items-center gap-1.5 flex-wrap">
          <span>{variety.zuechter || "Unbekannter Züchter"}</span>
          <span>·</span>
          <span className="rounded bg-sand-100 px-1.5 py-0.2 font-semibold text-leaf-900 font-mono tabular-nums">
            {reifeText}
          </span>
          {variety.zulassungsjahr && <span>· Zulassung {variety.zulassungsjahr}</span>}
        </div>
      </div>

      {/* 2. Regional trial mean performance */}
      <div className="rounded-xl bg-leaf-50/70 p-3.5 ring-1 ring-leaf-200/90 space-y-2">
        <div className="flex items-baseline justify-between text-xs">
          <span className="font-semibold text-leaf-800 uppercase tracking-wider">
            Relativertrag (LSV)
          </span>
          {advantagePercent != null && (
            <span
              className={`font-semibold font-mono tabular-nums ${
                advantagePercent >= 0 ? "text-leaf-700" : "text-amber-700"
              }`}
            >
              {advantagePercent >= 0
                ? `+${advantagePercent.toFixed(1)} % über Schnitt`
                : `${advantagePercent.toFixed(1)} % unter Schnitt`}
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-leaf-800 font-mono tabular-nums">
            {variety.avg_rel_ertrag != null ? `${num(variety.avg_rel_ertrag)} %` : "—"}
          </span>
          <span className="text-xs text-muted">zur amtlichen Bezugsbasis</span>
        </div>

        {/* Key metrics grid */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-leaf-200/60 text-xs">
          <div>
            <span className="text-muted block text-[11px]">
              Regional-Rang ({nutzungLabel})
            </span>
            <span className="font-bold text-ink font-mono tabular-nums">
              Platz #{rang ?? 1}
            </span>
          </div>

          <div>
            <span className="text-muted block text-[11px]">
              {nutzung === "silo" ? "Ø TS-Gehalt Silo" : "Ø Korn-TS"}
            </span>
            <span className="font-bold text-ink font-mono tabular-nums">
              {variety.avg_tsg != null ? `${num(variety.avg_tsg)} %` : "—"}
            </span>
          </div>

          <div>
            <span className="text-muted block text-[11px]">Versuchsstandorte</span>
            <span className="font-medium text-ink font-mono tabular-nums">
              {variety.total_orte} Orte ({variety.jahre_anzahl} J.)
            </span>
          </div>

          <div>
            <span className="text-muted block text-[11px]">Letztes Versuchsjahr</span>
            <span className="font-medium text-ink font-mono tabular-nums">
              {variety.letztes_jahr || "—"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Site performance on target parcel */}
      <div className="rounded-xl bg-sand-100/80 p-4 ring-1 ring-line space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-leaf-800">
          <Sparkles className="size-3.5 text-leaf-600" />
          <span>Auf deinem konkreten Schlag</span>
        </div>

        <p className="text-xs text-ink/90 leading-relaxed">
          Versuchsdaten zeigen das regionale Mittel für {regionName}. NoMaze rechnet die
          konkrete Eignung für deinen Boden, deine Niederschläge und Höhenlage.
        </p>

        {locationLabel && (
          <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-leaf-800 bg-white/90 px-2 py-0.5 rounded-md ring-1 ring-line">
            <MapPin className="size-3 text-leaf-600" />
            <span>Gewählter Standort: {locationLabel}</span>
          </div>
        )}

        <div className="pt-1">
          <ButtonLink
            href={`/feld?sorte=${variety.sorte_id}`}
            variant="primary"
            size="md"
            className="w-full justify-center shadow-md font-bold text-xs sm:text-sm"
          >
            <MapPin className="size-4" />
            Auf eigenem Schlag prüfen →
          </ButtonLink>
          <span className="text-[10px] text-muted text-center block mt-1.5">
            Ein Tipp auf die Karte genügt — Boden & Wetter laden sofort.
          </span>
        </div>
      </div>

      {/* 4. Actions: variety profile & optional seed checkout */}
      <div className="space-y-2 pt-1">
        <button
          type="button"
          onClick={() => onOpenSteckbrief(variety.sorte_id)}
          className="w-full inline-flex items-center justify-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-semibold text-leaf-700 ring-1 ring-line hover:bg-leaf-50 transition shadow-sm cursor-pointer"
        >
          <span>Vollständigen Steckbrief öffnen</span>
          <ChevronRight className="size-3.5 text-leaf-600" />
        </button>

        {onBuyVariety && saatgutKauf && (
          <button
            type="button"
            onClick={() => onBuyVariety(variety)}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-leaf-600 px-3 py-2 text-xs font-bold text-white hover:bg-leaf-500 transition shadow-sm cursor-pointer"
          >
            <ShoppingBag className="size-3.5" />
            <span>Saatgut anfragen</span>
          </button>
        )}
      </div>
    </aside>
  );
}
