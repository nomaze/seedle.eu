"use client";

import { Building2, Loader2, MapPin, ShoppingBag, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useSpross } from "@/components/spross/SprossContext";
import { TraitScale } from "@/components/charts/TraitScale";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { num } from "@/lib/format";
import type { DmkVarietyDetail } from "@/server/services/dmk";
import { SaatgutKaufenModal } from "./SaatgutKaufenModal";
import { NurMit } from "@/components/shell/DemoContext";

export interface VarietySteckbriefModalProps {
  varietyId: number | string | null;
  onClose: () => void;
  initialFlaecheHa?: number;
  schlagName?: string;
  fieldId?: string;
}

export function VarietySteckbriefModal({
  varietyId,
  onClose,
  initialFlaecheHa,
  schlagName,
  fieldId,
}: VarietySteckbriefModalProps) {
  const [detail, setDetail] = useState<DmkVarietyDetail | null>(null);
  const [loading, setLoading] = useState(Boolean(varietyId));
  const [error, setError] = useState<string | null>(null);
  const [kaufModalOpen, setKaufModalOpen] = useState(false);

  const [prevVarietyId, setPrevVarietyId] = useState(varietyId);
  if (prevVarietyId !== varietyId) {
    setPrevVarietyId(varietyId);
    setKaufModalOpen(false);
    setLoading(Boolean(varietyId));
    setError(null);
  }

  const { setActiveVariety } = useSpross();
  const varietyName = detail?.sorte?.sorte;

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);

    // Asynchronous data fetch
    fetch(`/api/v1/daten?view=variety&id=${encodeURIComponent(String(varietyId))}`)
      .then((res) => {
        if (!res.ok) throw new Error("Sorte konnte nicht geladen werden");
        return res.json();
      })
      .then((data: DmkVarietyDetail) => {
        if (active) {
          setDetail(data);
          setLoading(false);
          setError(null);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || "Fehler beim Laden");
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [varietyId]);

  // Close on Escape key (unless checkout purchase dialog is open)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !kaufModalOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, kaufModalOpen]);

  if (!varietyId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="steckbrief-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-lift ring-1 ring-line animate-rise"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-line bg-gradient-to-r from-sand-100/70 to-leaf-50/40 p-5 sm:p-6">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Offizieller Sortensteckbrief
              </span>
              {detail?.sorte.in_aktueller_bsl ? (
                <Badge tone="leaf">In aktueller BSA-Sortenliste</Badge>
              ) : null}
            </div>
            <h2 id="steckbrief-title" className="text-2xl font-bold text-ink sm:text-3xl">
              {detail?.sorte.sorte || (loading ? "Lade Sortendaten..." : "Sortendetail")}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
              <Building2 className="size-3.5 text-muted" />
              <span>{detail?.sorte.zuechter || "Züchter unbekannt"}</span>
              {detail?.sorte.zulassungsjahr && (
                <span>· Zulassung {detail.sorte.zulassungsjahr} ({detail.sorte.zulassungsland || "DE"})</span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted transition hover:bg-white hover:text-ink hover:shadow-sm"
            aria-label="Steckbrief schließen"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content / scroll container */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 sm:p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted">
              <Loader2 className="size-8 animate-spin text-leaf-600 mb-3" />
              <p className="text-sm font-medium">Lade BSA-Noten und Versuchsreihen...</p>
            </div>
          ) : error || !detail ? (
            <div className="rounded-2xl bg-poppy-soft/50 p-6 text-center text-sm text-poppy">
              {error || "Sortendaten konnten nicht geladen werden."}
            </div>
          ) : (
            <>
              {/* 1. Key metrics overview */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl bg-leaf-50/70 p-3 ring-1 ring-leaf-200">
                  <div className="text-[11px] font-semibold uppercase text-leaf-800">Siloreife</div>
                  <div className="mt-1 text-xl font-bold text-ink">
                    {detail.sorte.siloreifezahl ? `S ${detail.sorte.siloreifezahl}` : "—"}
                  </div>
                  <div className="text-[11px] text-muted">
                    {detail.sorte.nutzung_silo ? "Für Silomais empfohlen" : "Nicht als Silomais"}
                  </div>
                </div>

                <div className="rounded-xl bg-sand-100/70 p-3 ring-1 ring-sand-300">
                  <div className="text-[11px] font-semibold uppercase text-muted">Körnerreife</div>
                  <div className="mt-1 text-xl font-bold text-ink">
                    {detail.sorte.koernerreifezahl ? `K ${detail.sorte.koernerreifezahl}` : "—"}
                  </div>
                  <div className="text-[11px] text-muted">
                    {detail.sorte.nutzung_koerner ? "Für Körnermais empfohlen" : "Nicht als Körnermais"}
                  </div>
                </div>

                <div className="rounded-xl bg-white p-3 ring-1 ring-line">
                  <div className="text-[11px] font-semibold uppercase text-muted">Versuche</div>
                  <div className="mt-1 text-xl font-bold text-ink">
                    {detail.trials.totalCount.toLocaleString("de-DE")}
                  </div>
                  <div className="text-[11px] text-muted">
                    In {detail.trials.byRegion.length} Regionen
                  </div>
                </div>

                <div className="rounded-xl bg-white p-3 ring-1 ring-line">
                  <div className="text-[11px] font-semibold uppercase text-muted">Typ & Korn</div>
                  <div className="mt-1 text-sm font-bold text-ink truncate" title={detail.sorte.hybridtyp || "Hybride"}>
                    {detail.sorte.hybridtyp || "Hybride"}
                  </div>
                  <div className="text-[11px] text-muted truncate" title={detail.sorte.korntyp || "Standard"}>
                    {detail.sorte.korntyp || "Standard"}
                  </div>
                </div>
              </div>

              {/* 2. Official BSA ratings */}
              <div className="rounded-2xl bg-white p-5 ring-1 ring-line">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-ink text-base">
                    Offizielle Einstufung Bundessortenamt (BSA)
                  </h3>
                  {detail.bsl.latest?.bsl_jahr && (
                    <span className="text-xs text-muted">
                      Stand: BSL {detail.bsl.latest.bsl_jahr}
                    </span>
                  )}
                </div>

                {detail.bsl.latest ? (
                  <div className="divide-y divide-line pt-1 text-sm">
                    {/* Lodging resistance */}
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

                    {/* Cold tolerance / early vigor */}
                    {detail.bsl.latest.kaelte != null && (
                      <TraitScale
                        label="Kältetoleranz & Jugendentwicklung"
                        wert={detail.bsl.latest.kaelte}
                        hinweis={`BSA-Note ${detail.bsl.latest.kaelte} von 9 (mehr = frohwüchsiger im kühlen Frühjahr)`}
                      />
                    )}

                    {/* Stalk rot resistance */}
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

                    {/* Stay-green / leaf senescence */}
                    {detail.bsl.latest.abreifegrad_der_blaetter != null && (
                      <TraitScale
                        label="Stay-Green / Blattabreife"
                        wert={detail.bsl.latest.abreifegrad_der_blaetter}
                        hinweis={`BSA-Note ${detail.bsl.latest.abreifegrad_der_blaetter} (höhere Note = längere Assimilation und Grünfärbung)`}
                      />
                    )}

                    {/* Total dry matter (silage yield) */}
                    {detail.bsl.latest.gesamttrockenmasse != null && (
                      <TraitScale
                        label="Gesamttrockenmasse-Ertrag (GTM)"
                        wert={detail.bsl.latest.gesamttrockenmasse}
                        hinweis={`BSA-Ertragsnote ${detail.bsl.latest.gesamttrockenmasse} von 9`}
                      />
                    )}

                    {/* Grain yield */}
                    {detail.bsl.latest.kornertrag != null && (
                      <TraitScale
                        label="Kornertrag"
                        wert={detail.bsl.latest.kornertrag}
                        hinweis={`BSA-Ertragsnote ${detail.bsl.latest.kornertrag} von 9`}
                      />
                    )}

                    {/* Starch content */}
                    {detail.bsl.latest.staerkegehalt != null && (
                      <TraitScale
                        label="Stärkegehalt"
                        wert={detail.bsl.latest.staerkegehalt}
                        hinweis={`BSA-Note ${detail.bsl.latest.staerkegehalt} von 9`}
                      />
                    )}

                    {/* Biogas yield if present */}
                    {detail.bsl.latest.biogasertrag != null && (
                      <TraitScale
                        label="Biogasertrag"
                        wert={detail.bsl.latest.biogasertrag}
                        hinweis={`BSA-Note ${detail.bsl.latest.biogasertrag} von 9`}
                      />
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted py-2">
                    Für diese Sorte liegen derzeit keine BSL-Noten vor (häufig bei reinen EU-Zulassungen
                    oder noch im Sortenversuch befindlichen Neuzulassungen). Unten findest du die amtlichen
                    Prüfergebnisse aus den Landessortenversuchen.
                  </p>
                )}
              </div>

              {/* 3. Regional trial results (LSV / EUP) */}
              <div className="rounded-2xl bg-white p-5 ring-1 ring-line">
                <h3 className="font-bold text-ink text-base mb-1">
                  Regionale Versuchsergebnisse (LSV / EUP)
                </h3>
                <p className="text-xs text-muted mb-4">
                  Aggregiert über alle amtlichen Versuchsstandorte der Bundesländer und Naturräume.
                </p>

                {detail.trials.byRegion.length === 0 ? (
                  <p className="text-xs text-muted">Keine regionalen Versuchsdaten dokumentiert.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs tabular">
                      <thead>
                        <tr className="border-b border-line text-left font-semibold text-muted">
                          <th className="pb-2">Region</th>
                          <th className="pb-2 text-right">Jahre</th>
                          <th className="pb-2 text-right">Standorte</th>
                          <th className="pb-2 text-right">Ø Relativ-Index</th>
                          <th className="pb-2 text-right">Letztes Jahr</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {detail.trials.byRegion.map((r) => {
                          return (
                            <tr key={r.region} className="hover:bg-leaf-50/40">
                              <td className="py-2 font-medium text-ink">
                                <span className="font-bold">{r.region}</span> · {r.region_name}
                              </td>
                              <td className="py-2 text-right text-muted">{r.anzahl_jahre}</td>
                              <td className="py-2 text-right text-ink font-medium">{r.total_orte}</td>
                              <td className="py-2 text-right">
                                <span className="rounded bg-leaf-100/70 px-1.5 py-0.5 font-bold text-leaf-800">
                                  {r.avg_rel_ertrag != null ? `${num(r.avg_rel_ertrag)} %` : "—"}
                                </span>
                              </td>
                              <td className="py-2 text-right text-muted">{r.letztes_jahr}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 4. Latest trial data detail extract */}
              {detail.trials.recentTrials.length > 0 && (
                <div className="rounded-2xl bg-sand-50/50 p-4 ring-1 ring-line text-xs">
                  <div className="font-semibold text-ink mb-2">
                    Auszug der letzten Versuchsreihen ({detail.trials.recentTrials.length} Messungen)
                  </div>
                  <div className="max-h-48 overflow-y-auto divide-y divide-line/60">
                    {detail.trials.recentTrials.slice(0, 15).map((t, idx) => (
                      <div key={idx} className="py-1.5 flex items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-ink">{t.jahr}</span> · {t.region_name} ({t.versuchsart} {t.nutzung})
                          <span className="ml-1 text-muted">({t.merkmal_name || t.merkmal})</span>
                        </div>
                        <div className="tabular text-right">
                          <span className="font-semibold text-leaf-800">
                            {t.wert_relativ != null ? `${num(t.wert_relativ)} % rel.` : "Geprüft"}
                          </span>
                          <span className="ml-1.5 text-muted/70">[{t.anzahl_orte} Orte]</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer: Prominent decision and seed inquiry section */}
        <div className="border-t border-line bg-leaf-900 p-4 text-white sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0 pr-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-leaf-200">
                Aussaat & Entscheidung
              </div>
              <div className="text-sm font-bold sm:text-base leading-snug">
                Auf eigenem Feld prüfen oder direkt Saatgut sichern
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
              <ButtonLink
                href="/feld"
                variant="secondary"
                size="md"
                className="w-full sm:w-auto font-medium text-ink shadow-sm justify-center whitespace-nowrap"
              >
                <MapPin className="size-4 text-leaf-700 shrink-0" />
                <span>Auf eigenem Feld prüfen</span>
              </ButtonLink>

              <NurMit funktion="saatgutKauf">
                <button
                  type="button"
                  disabled={!detail}
                  onClick={() => setKaufModalOpen(true)}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-full bg-leaf-500 hover:bg-leaf-400 active:bg-leaf-600 px-6 h-12 text-base font-bold text-white shadow-lift transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap cursor-pointer"
                >
                  <ShoppingBag className="size-5 shrink-0" />
                  <span>Saatgut kaufen</span>
                </button>
              </NurMit>
            </div>
          </div>
        </div>
      </div>

      {/* Seed checkout inquiry dialog */}
      {detail && (
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
