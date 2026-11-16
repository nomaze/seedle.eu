"use client";

import { ArrowLeft, Building2, Info, Loader2, MapPin, ShoppingBag, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useSpross } from "@/components/spross/SprossContext";
import { TraitScale } from "@/components/charts/TraitScale";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import { KennzahlLeiste } from "@/components/ui/Kennzahl";
import { fetchVarietySteckbriefFromBackend } from "@/lib/backendClient";
import { int, num } from "@/lib/format";
import type {
  DmkBslRow,
  DmkTrialItem,
  DmkTrialRegionSummary,
  DmkVarietyDetail,
} from "@/server/services/dmk";
import { fakeVarietyDetail } from "@/server/services/fake-dmk-data";
import { SaatgutKaufenModal } from "./SaatgutKaufenModal";
import { NurMit } from "@/components/shell/DemoContext";

export interface VarietySteckbriefModalProps {
  varietyId: number | string | null;
  onClose: () => void;
  initialFlaecheHa?: number;
  schlagName?: string;
  fieldId?: string;
  fallbackVariety?: {
    name?: string;
    zuechter?: string | null;
    reifezahl?: number | null;
    zulassungsjahr?: number | null;
  };
}

/**
 * Safely unwraps either `{ detail: DmkVarietyDetail }`, a direct `DmkVarietyDetail` payload,
 * or a Python backend `VarietySteckbriefResponse` (`bsl_scores`, `regional_lsv` / `regional_lsv_results`),
 * guaranteeing `sorte`, `trials.byRegion`, `trials.totalCount`, and `bsl.latest` with fallback to `fakeVarietyDetail`.
 */
export function unwrapVarietyDetailPayload(
  data: unknown,
  fallbackIdOrName?: string | number,
): DmkVarietyDetail | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const topObj = data as Record<string, unknown>;
  const detailCandidate =
    topObj.detail && typeof topObj.detail === "object" && !Array.isArray(topObj.detail)
      ? (topObj.detail as Record<string, unknown>)
      : null;
  const resolved = detailCandidate ?? topObj;

  const hasSorteObj =
    Boolean(resolved.sorte) && typeof resolved.sorte === "object" && !Array.isArray(resolved.sorte);
  const hasSorteStr = typeof resolved.sorte === "string" && resolved.sorte.trim().length > 0;
  const hasBackendSteckbriefKeys =
    (typeof topObj.name === "string" && topObj.name.trim().length > 0) ||
    (typeof topObj.variety_name === "string" && topObj.variety_name.trim().length > 0) ||
    (topObj.bsl_scores && typeof topObj.bsl_scores === "object") ||
    Array.isArray(topObj.regional_lsv) ||
    Array.isArray(topObj.regional_lsv_results);

  if (!hasSorteObj && !hasSorteStr && !hasBackendSteckbriefKeys) {
    return null;
  }

  const rawSorteObj = hasSorteObj
    ? (resolved.sorte as Record<string, unknown>)
    : null;
  const lookupKey =
    fallbackIdOrName ??
    rawSorteObj?.sorte ??
    rawSorteObj?.sorte_id ??
    (hasSorteStr ? String(resolved.sorte) : undefined) ??
    topObj.name ??
    topObj.variety_name ??
    topObj.id ??
    topObj.variety_id ??
    "aw-talkrone";

  const localFallback =
    fakeVarietyDetail(String(lookupKey)) ?? fakeVarietyDetail("aw-talkrone")!;

  const faoS =
    typeof rawSorteObj?.siloreifezahl === "number"
      ? rawSorteObj.siloreifezahl
      : typeof topObj.fao_s === "number"
        ? topObj.fao_s
        : typeof topObj.fao === "number"
          ? topObj.fao
          : typeof topObj.reifezahl === "number"
            ? topObj.reifezahl
            : localFallback.sorte.siloreifezahl;
  const faoK =
    typeof rawSorteObj?.koernerreifezahl === "number"
      ? rawSorteObj.koernerreifezahl
      : typeof topObj.fao_k === "number"
        ? topObj.fao_k
        : typeof topObj.fao === "number"
          ? topObj.fao
          : typeof topObj.reifezahl === "number"
            ? topObj.reifezahl
            : localFallback.sorte.koernerreifezahl;

  const sorte: DmkVarietyDetail["sorte"] = {
    sorte_id:
      typeof rawSorteObj?.sorte_id === "number"
        ? rawSorteObj.sorte_id
        : typeof topObj.sorte_id === "number"
          ? topObj.sorte_id
          : localFallback.sorte.sorte_id,
    sorte:
      typeof rawSorteObj?.sorte === "string" && rawSorteObj.sorte.trim()
        ? rawSorteObj.sorte.trim()
        : hasSorteStr
          ? String(resolved.sorte).trim()
          : typeof topObj.name === "string" && topObj.name.trim()
            ? topObj.name.trim()
            : typeof topObj.variety_name === "string" && topObj.variety_name.trim()
              ? topObj.variety_name.trim()
              : localFallback.sorte.sorte,
    zuechter:
      typeof rawSorteObj?.zuechter === "string" && rawSorteObj.zuechter.trim()
        ? rawSorteObj.zuechter.trim()
        : typeof topObj.breeder === "string" && topObj.breeder.trim()
          ? topObj.breeder.trim()
          : typeof topObj.zuechter === "string" && topObj.zuechter.trim()
            ? topObj.zuechter.trim()
            : localFallback.sorte.zuechter,
    zulassung:
      typeof rawSorteObj?.zulassung === "string"
        ? rawSorteObj.zulassung
        : localFallback.sorte.zulassung,
    zulassungsjahr:
      typeof rawSorteObj?.zulassungsjahr === "number"
        ? rawSorteObj.zulassungsjahr
        : typeof topObj.release_year === "number"
          ? topObj.release_year
          : typeof topObj.zulassungsjahr === "number"
            ? topObj.zulassungsjahr
            : localFallback.sorte.zulassungsjahr,
    zulassungsland:
      typeof rawSorteObj?.zulassungsland === "string"
        ? rawSorteObj.zulassungsland
        : localFallback.sorte.zulassungsland,
    siloreifezahl: faoS,
    koernerreifezahl: faoK,
    nutzung_silo:
      typeof rawSorteObj?.nutzung_silo === "number"
        ? rawSorteObj.nutzung_silo
        : localFallback.sorte.nutzung_silo,
    nutzung_koerner:
      typeof rawSorteObj?.nutzung_koerner === "number"
        ? rawSorteObj.nutzung_koerner
        : localFallback.sorte.nutzung_koerner,
    nutzung_biogas:
      typeof rawSorteObj?.nutzung_biogas === "number"
        ? rawSorteObj.nutzung_biogas
        : localFallback.sorte.nutzung_biogas,
    hybridtyp:
      typeof rawSorteObj?.hybridtyp === "string"
        ? rawSorteObj.hybridtyp
        : typeof topObj.hybrid_type === "string"
          ? topObj.hybrid_type
          : localFallback.sorte.hybridtyp,
    korntyp:
      typeof rawSorteObj?.korntyp === "string"
        ? rawSorteObj.korntyp
        : typeof topObj.grain_type === "string"
          ? topObj.grain_type
          : localFallback.sorte.korntyp,
    in_aktueller_bsl:
      typeof rawSorteObj?.in_aktueller_bsl === "number"
        ? rawSorteObj.in_aktueller_bsl
        : localFallback.sorte.in_aktueller_bsl,
    notiz:
      typeof rawSorteObj?.notiz === "string"
        ? rawSorteObj.notiz
        : typeof topObj.agronomic_summary === "string"
          ? topObj.agronomic_summary
          : localFallback.sorte.notiz,
  };

  // Map BSL ratings (from `resolved.bsl` or backend `bsl_scores`)
  const rawBsl =
    resolved.bsl && typeof resolved.bsl === "object" && !Array.isArray(resolved.bsl)
      ? (resolved.bsl as Record<string, unknown>)
      : null;
  const rawBslScores =
    (topObj.bsl_scores && typeof topObj.bsl_scores === "object" && !Array.isArray(topObj.bsl_scores)
      ? (topObj.bsl_scores as Record<string, unknown>)
      : resolved.bsl_scores &&
          typeof resolved.bsl_scores === "object" &&
          !Array.isArray(resolved.bsl_scores)
        ? (resolved.bsl_scores as Record<string, unknown>)
        : null);

  let latestBsl: DmkBslRow | null = localFallback.bsl.latest;
  if (rawBsl && "latest" in rawBsl) {
    if (rawBsl.latest && typeof rawBsl.latest === "object") {
      latestBsl = {
        ...(localFallback.bsl.latest ?? ({} as DmkBslRow)),
        ...(rawBsl.latest as Partial<DmkBslRow>),
        sorte_id: sorte.sorte_id,
        sorte: sorte.sorte,
      };
    } else if (rawBsl.latest === null && !rawBslScores) {
      latestBsl = null;
    }
  } else if (rawBslScores) {
    const fbLatest = localFallback.bsl.latest!;
    const numScore = (a: unknown, b: unknown, def: number | null): number | null => {
      if (typeof a === "number" && Number.isFinite(a)) return a;
      if (typeof b === "number" && Number.isFinite(b)) return b;
      return def;
    };
    latestBsl = {
      ...fbLatest,
      sorte_id: sorte.sorte_id,
      sorte: sorte.sorte,
      bsl_jahr:
        numScore(rawBslScores.bsl_jahr, rawBslScores.jahr ?? rawBslScores.year, fbLatest.bsl_jahr) ??
        2025,
      kaelte: numScore(
        rawBslScores.kaelte,
        rawBslScores.cold_tolerance ?? rawBslScores.jugendentwicklung,
        fbLatest.kaelte,
      ),
      lagerneigung: numScore(
        rawBslScores.lagerneigung,
        rawBslScores.lodging ??
          (typeof rawBslScores.standfestigkeit === "number"
            ? Math.max(1, 10 - rawBslScores.standfestigkeit)
            : undefined),
        fbLatest.lagerneigung,
      ),
      stengelfaeule: numScore(
        rawBslScores.stengelfaeule,
        rawBslScores.stalk_rot ?? rawBslScores.staengelfaeule,
        fbLatest.stengelfaeule,
      ),
      gesamttrockenmasse: numScore(
        rawBslScores.gesamttrockenmasse,
        rawBslScores.dry_matter_yield ?? rawBslScores.gtm,
        fbLatest.gesamttrockenmasse,
      ),
      kornertrag: numScore(
        rawBslScores.kornertrag,
        rawBslScores.grain_yield,
        fbLatest.kornertrag,
      ),
      staerkegehalt: numScore(
        rawBslScores.staerkegehalt,
        rawBslScores.starch_content,
        fbLatest.staerkegehalt,
      ),
      biogasertrag: numScore(
        rawBslScores.biogasertrag,
        rawBslScores.biogas_yield,
        fbLatest.biogasertrag,
      ),
      abreifegrad_der_blaetter: numScore(
        rawBslScores.abreifegrad_der_blaetter,
        rawBslScores.stay_green,
        fbLatest.abreifegrad_der_blaetter,
      ),
    };
  }

  const bslHistory: DmkBslRow[] =
    rawBsl && Array.isArray(rawBsl.history)
      ? (rawBsl.history as DmkBslRow[])
      : localFallback.bsl.history;

  // Map Regional Trials (`resolved.trials` or backend `regional_lsv` / `regional_lsv_results`)
  const rawTrials =
    resolved.trials && typeof resolved.trials === "object" && !Array.isArray(resolved.trials)
      ? (resolved.trials as Record<string, unknown>)
      : null;
  const rawRegionalLsv = Array.isArray(topObj.regional_lsv)
    ? topObj.regional_lsv
    : Array.isArray(topObj.regional_lsv_results)
      ? topObj.regional_lsv_results
      : Array.isArray(resolved.regional_lsv)
        ? resolved.regional_lsv
        : Array.isArray(resolved.regional_lsv_results)
          ? resolved.regional_lsv_results
          : null;

  let byRegion: DmkTrialRegionSummary[] = localFallback.trials.byRegion;
  if (rawTrials && Array.isArray(rawTrials.byRegion)) {
    byRegion = (rawTrials.byRegion as Record<string, unknown>[]).map((r, idx) => {
      const fbR = localFallback.trials.byRegion[idx] ?? localFallback.trials.byRegion[0]!;
      return {
        region: String(r.region ?? r.region_code ?? fbR.region),
        region_name: String(r.region_name ?? r.name ?? r.region ?? fbR.region_name),
        anzahl_jahre: Number(r.anzahl_jahre ?? r.years ?? r.trial_years ?? fbR.anzahl_jahre),
        total_orte: Number(r.total_orte ?? r.locations ?? r.sites ?? fbR.total_orte),
        avg_rel_ertrag:
          r.avg_rel_ertrag !== undefined && r.avg_rel_ertrag !== null
            ? Number(r.avg_rel_ertrag)
            : r.rel_yield_pct !== undefined
              ? Number(r.rel_yield_pct)
              : fbR.avg_rel_ertrag,
        avg_gtm_dt: r.avg_gtm_dt != null ? Number(r.avg_gtm_dt) : fbR.avg_gtm_dt,
        avg_ke_dt: r.avg_ke_dt != null ? Number(r.avg_ke_dt) : fbR.avg_ke_dt,
        letztes_jahr: Number(r.letztes_jahr ?? r.last_year ?? fbR.letztes_jahr),
      };
    });
  } else if (rawRegionalLsv && rawRegionalLsv.length > 0) {
    byRegion = (rawRegionalLsv as Record<string, unknown>[]).map((r, idx) => {
      const fbR = localFallback.trials.byRegion[idx] ?? localFallback.trials.byRegion[0]!;
      return {
        region: String(r.region ?? r.region_code ?? fbR.region),
        region_name: String(r.region_name ?? r.name ?? r.region ?? fbR.region_name),
        anzahl_jahre: Number(r.anzahl_jahre ?? r.years ?? r.trial_years ?? fbR.anzahl_jahre),
        total_orte: Number(r.total_orte ?? r.locations ?? r.sites ?? fbR.total_orte),
        avg_rel_ertrag:
          r.avg_rel_ertrag !== undefined && r.avg_rel_ertrag !== null
            ? Number(r.avg_rel_ertrag)
            : r.rel_yield_pct !== undefined
              ? Number(r.rel_yield_pct)
              : fbR.avg_rel_ertrag,
        avg_gtm_dt: r.avg_gtm_dt != null ? Number(r.avg_gtm_dt) : fbR.avg_gtm_dt,
        avg_ke_dt: r.avg_ke_dt != null ? Number(r.avg_ke_dt) : fbR.avg_ke_dt,
        letztes_jahr: Number(r.letztes_jahr ?? r.last_year ?? fbR.letztes_jahr),
      };
    });
  }

  const recentTrials: DmkTrialItem[] =
    rawTrials && Array.isArray(rawTrials.recentTrials)
      ? (rawTrials.recentTrials as DmkTrialItem[])
      : localFallback.trials.recentTrials;

  const totalCount =
    rawTrials &&
    typeof rawTrials.totalCount === "number" &&
    Number.isFinite(rawTrials.totalCount)
      ? rawTrials.totalCount
      : byRegion.length > 0
        ? byRegion.reduce((acc, r) => acc + (Number.isFinite(r.total_orte) ? r.total_orte : 0), 0)
        : localFallback.trials.totalCount;

  return {
    sorte,
    bsl: {
      latest: latestBsl,
      history: bslHistory,
    },
    trials: {
      totalCount,
      byRegion,
      recentTrials,
    },
  };
}

export function VarietySteckbriefModal({
  varietyId,
  onClose,
  initialFlaecheHa,
  schlagName,
  fieldId,
  fallbackVariety,
}: VarietySteckbriefModalProps) {
  const [detail, setDetail] = useState<DmkVarietyDetail | null>(() =>
    varietyId ? fakeVarietyDetail(fallbackVariety?.name || varietyId) : null,
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [notFoundState, setNotFoundState] = useState(false);
  const [kaufModalOpen, setKaufModalOpen] = useState(false);

  const [prevVarietyId, setPrevVarietyId] = useState(varietyId);
  if (prevVarietyId !== varietyId) {
    setPrevVarietyId(varietyId);
    setKaufModalOpen(false);
    const instantFallback = varietyId
      ? fakeVarietyDetail(fallbackVariety?.name || varietyId)
      : null;
    setDetail(instantFallback);
    setLoading(Boolean(varietyId) && !instantFallback);
    setNotFoundState(false);
  }

  const { setActiveVariety } = useSpross();
  const varietyName = detail?.sorte?.sorte ?? fallbackVariety?.name;

  useEffect(() => {
    if (varietyName) {
      setActiveVariety(varietyName);
    } else if (!varietyId) {
      setActiveVariety(null);
    }
    return () => {
      setActiveVariety(null);
    };
  }, [varietyName, varietyId, setActiveVariety]);

  useEffect(() => {
    if (!varietyId) return;

    let active = true;
    const ctrl = new AbortController();
    const localFallback =
      fakeVarietyDetail(varietyId) ??
      (fallbackVariety?.name ? fakeVarietyDetail(fallbackVariety.name) : null);
    if (localFallback) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDetail(localFallback);
      setNotFoundState(false);
      setLoading(false);
    } else {
      setLoading(true);
      setNotFoundState(false);
    }

    void (async () => {
      // 1. Primary path: Try Seedle Python Backend (`GET /api/v1/mvp/varieties/{id}/steckbrief`)
      const backendSteckbrief = await fetchVarietySteckbriefFromBackend(
        varietyId,
        fallbackVariety?.name,
        ctrl.signal,
      );
      if (!active || ctrl.signal.aborted) return;

      const resolvedBackend = unwrapVarietyDetailPayload(
        backendSteckbrief,
        fallbackVariety?.name || varietyId,
      );
      if (resolvedBackend && resolvedBackend.sorte) {
        setDetail(resolvedBackend);
        setNotFoundState(false);
        setLoading(false);
        return;
      }

      // 2. Fallback path (`if (!backendSteckbrief)`): Query local `/api/v1/daten?view=variety` or `fakeVarietyDetail`
      try {
        const res = await fetch(
          `/api/v1/daten?view=variety&id=${encodeURIComponent(String(varietyId))}`,
          { signal: ctrl.signal },
        );
        const data: unknown = res.ok ? await res.json().catch(() => null) : null;
        if (!active || ctrl.signal.aborted) return;
        const resolved =
          unwrapVarietyDetailPayload(data, fallbackVariety?.name || varietyId) ??
          localFallback;
        if (resolved && resolved.sorte) {
          setDetail(resolved);
          setNotFoundState(false);
          setLoading(false);
        } else {
          setDetail(null);
          setNotFoundState(true);
          setLoading(false);
        }
      } catch {
        if (active && !ctrl.signal.aborted) {
          if (localFallback) {
            setDetail(localFallback);
            setNotFoundState(false);
          } else {
            setDetail(null);
            setNotFoundState(true);
          }
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
      ctrl.abort();
    };
  }, [varietyId, fallbackVariety?.name]);

  // Close on Escape key (unless checkout purchase dialog is open)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !kaufModalOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, kaufModalOpen]);

  if (!varietyId) return null;

  const displayTitle =
    detail?.sorte?.sorte ||
    fallbackVariety?.name ||
    (typeof varietyId === "string" ? varietyId.toUpperCase() : `Sorte #${varietyId}`);
  const displayBreeder = detail?.sorte?.zuechter || fallbackVariety?.zuechter || "Züchterangabe folgt";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-scrim"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="steckbrief-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-panel bg-surface shadow-lift motion-safe:animate-rise motion-safe:[animation-duration:180ms]"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-divider py-4 pl-5 pr-3 sm:py-5 sm:pl-6">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-x-1.5 text-small text-fg-muted">
              <span>Offizieller Sortensteckbrief</span>
              {detail?.sorte?.in_aktueller_bsl ? (
                <span>· In aktueller BSA-Sortenliste</span>
              ) : null}
            </div>
            <h2 id="steckbrief-title" className="text-heading text-fg">
              {loading ? "Lade Sortendaten..." : displayTitle}
            </h2>
            <div className="flex flex-wrap items-center gap-x-1.5 text-small text-fg-muted">
              <Building2 className="size-4 shrink-0" aria-hidden />
              <span>{displayBreeder}</span>
              {(detail?.sorte?.zulassungsjahr || fallbackVariety?.zulassungsjahr) && (
                <span className="tabular-nums">
                  · Zulassung {detail?.sorte?.zulassungsjahr ?? fallbackVariety?.zulassungsjahr} (
                  {detail?.sorte?.zulassungsland || "DE"})
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-touch shrink-0 items-center justify-center rounded-control text-link transition-colors hover:bg-action-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            aria-label="Steckbrief schließen"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        {/* Content / scroll container */}
        <div className="flex-1 space-y-8 overflow-y-auto p-5 sm:p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-fg-muted">
              <Loader2 className="mb-3 size-8 text-link motion-safe:animate-spin" aria-hidden />
              <p className="text-small">Lade BSA-Noten und Versuchsreihen...</p>
            </div>
          ) : notFoundState || !detail || !detail.sorte ? (
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 size-5 shrink-0 text-link" aria-hidden />
                <div className="space-y-1">
                  <h3 className="text-subheading text-fg">
                    Steckbrief für diese Sorte aktuell noch nicht hinterlegt
                  </h3>
                  <p className="max-w-measure text-small text-fg-muted">
                    Für <strong className="text-fg">{displayTitle}</strong> ist der erweiterte DMK-/BSA-Detailsteckbrief
                    aktuell noch in Vorbereitung. Die bekannten Basisdaten der Sorte sind bereits in
                    deiner Standortberechnung berücksichtigt:
                  </p>
                </div>
              </div>

              <dl className="divide-y divide-divider border-y border-divider text-small">
                <div className="flex items-baseline justify-between gap-4 py-2.5">
                  <dt className="text-fg-muted">Sorte</dt>
                  <dd className="text-right font-semibold text-fg">{displayTitle}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 py-2.5">
                  <dt className="text-fg-muted">Züchter</dt>
                  <dd className="text-right font-semibold text-fg">{displayBreeder}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 py-2.5">
                  <dt className="text-fg-muted">Reifezahl</dt>
                  <dd className="text-right font-semibold text-fg tabular-nums">
                    {fallbackVariety?.reifezahl ? `S/K ${fallbackVariety.reifezahl}` : "Standortgeprüft"}
                  </dd>
                </div>
              </dl>

              <div>
                <button
                  type="button"
                  onClick={onClose}
                  className={buttonClass("primary", "md", "cursor-pointer")}
                >
                  <ArrowLeft className="size-4" aria-hidden />
                  <span>Zurück zur Übersicht</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 1. Key metrics overview */}
              <KennzahlLeiste>
                <div>
                  <div className="text-small text-fg-muted">Siloreife</div>
                  <div className="mt-1 text-figure-m tabular-nums text-fg">
                    {detail.sorte.siloreifezahl ? `S ${detail.sorte.siloreifezahl}` : "—"}
                  </div>
                  <div className="mt-1 text-caption text-fg-muted">
                    {detail.sorte.nutzung_silo ? "Für Silomais empfohlen" : "Nicht als Silomais"}
                  </div>
                </div>

                <div>
                  <div className="text-small text-fg-muted">Körnerreife</div>
                  <div className="mt-1 text-figure-m tabular-nums text-fg">
                    {detail.sorte.koernerreifezahl ? `K ${detail.sorte.koernerreifezahl}` : "—"}
                  </div>
                  <div className="mt-1 text-caption text-fg-muted">
                    {detail.sorte.nutzung_koerner ? "Für Körnermais empfohlen" : "Nicht als Körnermais"}
                  </div>
                </div>

                <div>
                  <div className="text-small text-fg-muted">Versuche</div>
                  <div className="mt-1 text-figure-m tabular-nums text-fg">
                    {int(detail.trials?.totalCount)}
                  </div>
                  <div className="mt-1 text-caption text-fg-muted tabular-nums">
                    In {(detail.trials?.byRegion ?? []).length} Regionen
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="text-small text-fg-muted">Typ & Korn</div>
                  <div className="mt-1 truncate text-body font-semibold text-fg" title={detail.sorte.hybridtyp || "Hybride"}>
                    {detail.sorte.hybridtyp || "Hybride"}
                  </div>
                  <div className="mt-1 truncate text-caption text-fg-muted" title={detail.sorte.korntyp || "Standard"}>
                    {detail.sorte.korntyp || "Standard"}
                  </div>
                </div>
              </KennzahlLeiste>

              {/* 2. Official BSA ratings */}
              <section>
                <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="text-subheading text-fg">
                    Offizielle Einstufung Bundessortenamt (BSA)
                  </h3>
                  {detail.bsl.latest?.bsl_jahr && (
                    <span className="text-small text-fg-muted tabular-nums">
                      Stand: BSL {detail.bsl.latest.bsl_jahr}
                    </span>
                  )}
                </div>

                {detail.bsl.latest ? (
                  <div className="divide-y divide-divider border-y border-divider text-small">
                    {detail.bsl.latest.lagerneigung != null && (
                      <TraitScale
                        label="Standfestigkeit"
                        wert={Math.max(1, 10 - detail.bsl.latest.lagerneigung)}
                        hinweis={`BSA-Lagerneigung: Note ${detail.bsl.latest.lagerneigung} (${
                          detail.bsl.latest.lagerneigung <= 3
                            ? "sehr standfest"
                            : detail.bsl.latest.lagerneigung <= 5
                              ? "mittlere Standfestigkeit"
                              : "erhöhtes Lagerrisiko"
                        })`}
                      />
                    )}

                    {detail.bsl.latest.kaelte != null && (
                      <TraitScale
                        label="Kältetoleranz & Jugendentwicklung"
                        wert={detail.bsl.latest.kaelte}
                        hinweis={`BSA-Note ${detail.bsl.latest.kaelte} von 9 (mehr = frohwüchsiger im kühlen Frühjahr)`}
                      />
                    )}

                    {detail.bsl.latest.stengelfaeule != null && (
                      <TraitScale
                        label="Widerstand gegen Stängelfäule"
                        wert={Math.max(1, 10 - detail.bsl.latest.stengelfaeule)}
                        hinweis={`BSA-Note ${detail.bsl.latest.stengelfaeule} (${
                          detail.bsl.latest.stengelfaeule <= 3
                            ? "geringe Anfälligkeit"
                            : "mittlere bis hohe Anfälligkeit"
                        })`}
                      />
                    )}

                    {detail.bsl.latest.abreifegrad_der_blaetter != null && (
                      <TraitScale
                        label="Stay-Green / Blattabreife"
                        wert={detail.bsl.latest.abreifegrad_der_blaetter}
                        hinweis={`BSA-Note ${detail.bsl.latest.abreifegrad_der_blaetter} (höhere Note = längere Assimilation und Grünfärbung)`}
                      />
                    )}

                    {detail.bsl.latest.gesamttrockenmasse != null && (
                      <TraitScale
                        label="Gesamttrockenmasse-Ertrag (GTM)"
                        wert={detail.bsl.latest.gesamttrockenmasse}
                        hinweis={`BSA-Ertragsnote ${detail.bsl.latest.gesamttrockenmasse} von 9`}
                      />
                    )}

                    {detail.bsl.latest.kornertrag != null && (
                      <TraitScale
                        label="Kornertrag"
                        wert={detail.bsl.latest.kornertrag}
                        hinweis={`BSA-Ertragsnote ${detail.bsl.latest.kornertrag} von 9`}
                      />
                    )}

                    {detail.bsl.latest.staerkegehalt != null && (
                      <TraitScale
                        label="Stärkegehalt"
                        wert={detail.bsl.latest.staerkegehalt}
                        hinweis={`BSA-Note ${detail.bsl.latest.staerkegehalt} von 9`}
                      />
                    )}

                    {detail.bsl.latest.biogasertrag != null && (
                      <TraitScale
                        label="Biogasertrag"
                        wert={detail.bsl.latest.biogasertrag}
                        hinweis={`BSA-Note ${detail.bsl.latest.biogasertrag} von 9`}
                      />
                    )}
                  </div>
                ) : (
                  <p className="max-w-measure py-2 text-small text-fg-muted">
                    Für diese Sorte liegen derzeit keine BSL-Noten vor (häufig bei reinen EU-Zulassungen
                    oder noch im Sortenversuch befindlichen Neuzulassungen). Unten findest du die amtlichen
                    Prüfergebnisse aus den Landessortenversuchen.
                  </p>
                )}
              </section>

              {/* 3. Regional trial results (LSV / EUP) */}
              <section className="border-t border-divider pt-6">
                <h3 className="text-subheading text-fg">
                  Regionale Versuchsergebnisse (LSV / EUP)
                </h3>
                <p className="mb-4 mt-1 max-w-measure text-small text-fg-muted">
                  Aggregiert über alle amtlichen Versuchsstandorte der Bundesländer und Naturräume.
                </p>

                {detail.trials.byRegion.length === 0 ? (
                  <p className="text-small text-fg-muted">Keine regionalen Versuchsdaten dokumentiert.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-small tabular-nums">
                      <thead>
                        <tr className="border-b border-rule text-left text-caption font-semibold text-fg-muted">
                          <th className="py-2 pr-3 font-semibold">Region</th>
                          <th className="px-3 py-2 text-right font-semibold">Jahre</th>
                          <th className="px-3 py-2 text-right font-semibold">Standorte</th>
                          <th className="px-3 py-2 text-right font-semibold">Ø Relativ-Index</th>
                          <th className="py-2 pl-3 text-right font-semibold">Letztes Jahr</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-divider">
                        {detail.trials.byRegion.map((r) => {
                          return (
                            <tr key={r.region} className="hover:bg-highlight">
                              <td className="py-2.5 pr-3 text-fg">
                                <span className="font-semibold">{r.region}</span> · {r.region_name}
                              </td>
                              <td className="px-3 py-2.5 text-right text-fg-muted">{r.anzahl_jahre}</td>
                              <td className="px-3 py-2.5 text-right text-fg">{r.total_orte}</td>
                              <td className="px-3 py-2.5 text-right font-semibold text-fg">
                                {r.avg_rel_ertrag != null ? `${num(r.avg_rel_ertrag)} %` : "—"}
                              </td>
                              <td className="py-2.5 pl-3 text-right text-fg-muted">{r.letztes_jahr}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* 4. Latest trial data detail extract */}
              {detail.trials.recentTrials.length > 0 && (
                <section className="border-t border-divider pt-6 text-small">
                  <h3 className="mb-2 text-subheading text-fg">
                    Auszug der letzten Versuchsreihen ({detail.trials.recentTrials.length} Messungen)
                  </h3>
                  <div className="max-h-48 divide-y divide-divider overflow-y-auto border-y border-divider">
                    {detail.trials.recentTrials.slice(0, 15).map((t, idx) => (
                      <div key={idx} className="flex items-baseline justify-between gap-3 py-2">
                        <div className="text-fg">
                          <span className="font-semibold tabular-nums">{t.jahr}</span> · {t.region_name} ({t.versuchsart} {t.nutzung})
                          <span className="ml-1 text-fg-muted">({t.merkmal_name || t.merkmal})</span>
                        </div>
                        <div className="shrink-0 text-right tabular-nums">
                          <span className="font-semibold text-fg">
                            {t.wert_relativ != null ? `${num(t.wert_relativ)} % rel.` : "Geprüft"}
                          </span>
                          <span className="ml-1.5 text-fg-muted">[{t.anzahl_orte} Orte]</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        {/* Footer: decision and seed inquiry section */}
        <div className="border-t border-divider px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="text-small text-fg-muted">
                Aussaat & Entscheidung
              </div>
              <div className="text-subheading text-fg">
                Auf eigenem Feld prüfen oder direkt Saatgut sichern
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={onClose}
                className={buttonClass("quiet", "md", "w-full cursor-pointer sm:w-auto")}
              >
                <ArrowLeft className="size-4 shrink-0" aria-hidden />
                <span>Zurück zur Übersicht</span>
              </button>

              <ButtonLink
                href="/feld"
                variant="secondary"
                size="md"
                className="w-full whitespace-nowrap sm:w-auto"
              >
                <MapPin className="size-4 shrink-0" aria-hidden />
                <span>Auf eigenem Feld prüfen</span>
              </ButtonLink>

              <NurMit funktion="saatgutKauf">
                <button
                  type="button"
                  disabled={!detail?.sorte}
                  onClick={() => setKaufModalOpen(true)}
                  className={buttonClass("primary", "md", "w-full cursor-pointer whitespace-nowrap sm:w-auto")}
                >
                  <ShoppingBag className="size-5 shrink-0" aria-hidden />
                  <span>Saatgut kaufen</span>
                </button>
              </NurMit>
            </div>
          </div>
        </div>
      </div>

      {/* Seed checkout inquiry dialog */}
      {detail?.sorte && (
        <SaatgutKaufenModal
          offen={kaufModalOpen}
          onClose={() => setKaufModalOpen(false)}
          onCloseAll={() => {
            setKaufModalOpen(false);
            onClose();
          }}
          variety={{
            id: detail.sorte.sorte_id,
            name: detail.sorte.sorte,
            zuechter: detail.sorte.zuechter,
            siloreifezahl: detail.sorte.siloreifezahl,
            koernerreifezahl: detail.sorte.koernerreifezahl,
            korntyp: detail.sorte.korntyp,
            hybridtyp: detail.sorte.hybridtyp,
          }}
          initialFlaecheHa={initialFlaecheHa}
          schlagName={schlagName}
          fieldId={fieldId}
        />
      )}
    </div>
  );
}
