"use client";

import { Building2, MapPin, Phone, ShoppingBag, UserCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { buttonClass } from "@/components/ui/Button";
import { StatusMarker } from "@/components/ui/StatusMarker";
import {
  fetchVarietySuppliersFromBackend,
  type VarietySuppliersResponse,
} from "@/lib/backendClient";
import { TEAM } from "@/lib/team";

export interface WhereToBuyPartner {
  name: string;
  role: string;
  regionLabel: string;
  contactPerson: string;
  phone: string;
  availabilityHint: string;
}

export interface BreederAdvisor {
  breederName: string;
  regionLabel: string;
  advisorName: string;
  phone: string;
  specialty: string;
}

export function getRegionalDealers(region?: string): WhereToBuyPartner[] {
  const reg = region || "Süddeutschland / Bayern";
  return [
    {
      name: "RWA / Raiffeisen Waren-Agrar",
      role: "Regionaler Genossenschafts- & Saatgutpartner",
      regionLabel: reg,
      contactPerson: "Agrar-Außendienst Saatgut & Mais",
      phone: "089 / 2154-8810",
      availabilityHint: "Originalsaatgut & Beizvarianten ab Lager verfügbar",
    },
    {
      name: "BayWa Agrar / Raiffeisen Ware",
      role: "Agrarhandel & Lagerhaus vor Ort",
      regionLabel: reg,
      contactPerson: "Standort-Leitung Pflanzenbau",
      phone: "089 / 9222-0",
      availabilityHint: "Frühbezug & Schlaglieferung buchbar",
    },
    {
      name: "AGRAVIS Raiffeisen / Hauptgenossenschaft Nord (HaGe)",
      role: "Überregionaler Genossenschaftshandel West / Nord / Ost",
      regionLabel: "Region Nord / West / Ost",
      contactPerson: "Fachberatung Mais & Feldsaaten",
      phone: "0251 / 682-0",
      availabilityHint: "Direktabholung oder Hofzustellung",
    },
  ];
}

export function getBreederAdvisors(zuechter?: string | null, region?: string): BreederAdvisor[] {
  const reg = region || "Deine Region (PLZ)";
  const primaryBreeder = zuechter || "KWS / Limagrain / DSV";
  return [
    {
      breederName: `${primaryBreeder} – Werksvertretung`,
      regionLabel: reg,
      advisorName: "Regionaler Züchter-Fachberater",
      phone: TEAM.telefonAnzeige,
      specialty: "Standortpassung, Aussaatstärke & Bestandesführung",
    },
    {
      breederName: "KWS Saat Fachberatung (Süd / Nord / Ost / West)",
      regionLabel: reg,
      advisorName: "KWS Mais-Spezialberatung",
      phone: "05561 / 311-0",
      specialty: "Silo- & Körnermais, Trockenstress-Linien",
    },
    {
      breederName: "Limagrain / LG Seeds Regionalberater",
      regionLabel: reg,
      advisorName: "LG Außendienst & Hydraneo-Beratung",
      phone: "05173 / 240-0",
      specialty: "Verdaulichkeit, Energiedichte & Zahnmais-Hybriden",
    },
    {
      breederName: "DSV / Saaten-Union Fachberatung",
      regionLabel: reg,
      advisorName: "Regionaler Anbauberater",
      phone: "02941 / 296-0",
      specialty: "Fruchtfolge, Zwischenfrüchte & Sortenwahl",
    },
  ];
}

export function WhereToBuyContent({
  varietyId,
  varietyName,
  zuechter,
  reifezahl,
  region,
  schlagName,
}: {
  varietyId?: string | number;
  varietyName: string;
  zuechter?: string | null;
  reifezahl?: number | null;
  region?: string;
  schlagName?: string;
}) {
  const [requestedTarget, setRequestedTarget] = useState<string | null>(null);
  const [backendSuppliers, setBackendSuppliers] =
    useState<VarietySuppliersResponse | null>(null);

  useEffect(() => {
    let active = true;
    const ctrl = new AbortController();
    void fetchVarietySuppliersFromBackend(
      region,
      varietyId ?? varietyName,
      ctrl.signal,
    ).then((res) => {
      if (active && !ctrl.signal.aborted && res) {
        setBackendSuppliers(res);
      }
    });
    return () => {
      active = false;
      ctrl.abort();
    };
  }, [region, varietyId, varietyName]);

  const rawBackendDealers = backendSuppliers?.dealers ?? backendSuppliers?.suppliers;
  const dealers: WhereToBuyPartner[] =
    Array.isArray(rawBackendDealers) && rawBackendDealers.length > 0
      ? rawBackendDealers.map((d) => ({
          name: d.name,
          role: d.role || "Regionaler Genossenschafts- & Saatgutpartner",
          regionLabel: d.regionLabel || d.region_label || d.region || region || "Deine Region",
          contactPerson:
            d.contactPerson || d.contact_person || "Agrar-Außendienst Saatgut & Mais",
          phone: d.phone || TEAM.telefonAnzeige,
          availabilityHint:
            d.availabilityHint ||
            d.availability_hint ||
            "Originalsaatgut & Beizvarianten ab Lager verfügbar",
        }))
      : getRegionalDealers(region);

  const rawAdvisors = backendSuppliers?.advisors ?? backendSuppliers?.breeder_advisors;
  const advisors: BreederAdvisor[] =
    Array.isArray(rawAdvisors) && rawAdvisors.length > 0
      ? rawAdvisors.map((a) => ({
          breederName: a.breederName || a.breeder_name || `${zuechter || "Züchter"} – Fachberatung`,
          regionLabel: a.regionLabel || a.region_label || region || "Deine Region (PLZ)",
          advisorName:
            a.advisorName ||
            a.advisor_name ||
            a.contactPerson ||
            a.contact_person ||
            "Regionaler Züchter-Fachberater",
          phone: a.phone || TEAM.telefonAnzeige,
          specialty: a.specialty || "Standortpassung, Aussaatstärke & Bestandesführung",
        }))
      : getBreederAdvisors(zuechter, region);

  return (
    <div className="space-y-8">
      {requestedTarget ? (
        <div role="status" className="space-y-1 border-b border-divider pb-5">
          <StatusMarker
            status="status-ok"
            label={`Anfrage für ${varietyName} bei „${requestedTarget}“ vorgemerkt!`}
          />
          <p className="max-w-measure text-small text-fg-muted">
            Unser NoMaze-Feldteam ({TEAM.telefonAnzeige}) stimmt die Verfügbarkeit für deinen
            Schlag {schlagName ? `„${schlagName}“ ` : ""}direkt ab.
          </p>
        </div>
      ) : null}

      {/* 1. Regional agricultural trade / cooperative */}
      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="text-subheading text-fg">
            1. Regionaler Agrarhandel / Genossenschaft vor Ort
          </h3>
          <Badge tone="neutral">Handel & Genossenschaft</Badge>
        </div>
        <p className="mt-1 max-w-measure text-small text-fg-muted">
          Direkter Bezug über dein gewohntes Lagerhaus oder deine Genossenschaft in{" "}
          {region || "deiner Region"}.
        </p>

        <ul className="mt-4 divide-y divide-divider border-y border-divider">
          {dealers.map((dealer) => (
            <li
              key={dealer.name}
              className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 shrink-0 text-fg-muted" aria-hidden />
                  <span className="font-bold text-fg">{dealer.name}</span>
                </div>
                <div className="text-small text-fg-muted">
                  {dealer.regionLabel} · {dealer.role} · Ansprechpartner: <strong className="font-semibold text-fg">{dealer.contactPerson}</strong>
                </div>
                <div className="text-small text-fg">{dealer.availabilityHint}</div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <a
                  href={`tel:${dealer.phone.replace(/\D/g, "")}`}
                  className={buttonClass("quiet", "sm", "tabular-nums")}
                >
                  <Phone className="size-4" aria-hidden />
                  <span>{dealer.phone}</span>
                </a>
                <button
                  type="button"
                  onClick={() => setRequestedTarget(dealer.name)}
                  className={buttonClass("secondary", "sm", "cursor-pointer")}
                >
                  <ShoppingBag className="size-4" aria-hidden />
                  <span>Verfügbarkeit anfragen</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* 2. Direct breeder field advisor for your postal code / region */}
      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="text-subheading text-fg">
            2. Direkter Züchter-Fachberater für deine Region (PLZ)
          </h3>
          <Badge tone="neutral">Züchter-Beratung</Badge>
        </div>
        <p className="mt-1 max-w-measure text-small text-fg-muted">
          Fachliche Rückfragen zu Aussaatstärke, Beizung oder Sortenverhalten von{" "}
          <strong className="font-semibold text-fg">{varietyName}</strong>
          {reifezahl ? ` (S/K ${reifezahl})` : ""}.
        </p>

        <ul className="mt-4 grid border-b border-divider sm:grid-cols-2 sm:gap-x-8">
          {advisors.map((adv) => (
            <li
              key={adv.breederName}
              className="flex flex-col justify-between gap-3 border-t border-divider py-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-bold text-fg">
                  <UserCheck className="size-4 shrink-0 text-fg-muted" aria-hidden />
                  <span>{adv.breederName}</span>
                </div>
                <div className="text-small text-fg-muted">
                  {adv.advisorName} · {adv.regionLabel}
                </div>
                <div className="text-small text-fg">{adv.specialty}</div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-small tabular-nums text-fg-muted">{adv.phone}</span>
                <button
                  type="button"
                  onClick={() => setRequestedTarget(adv.breederName)}
                  className={buttonClass("secondary", "sm", "cursor-pointer")}
                >
                  <Phone className="size-4" aria-hidden />
                  <span>Rückruf-Anfrage</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function WhereToBuyModal({
  open,
  onClose,
  variety,
  region,
  schlagName,
}: {
  open: boolean;
  onClose: () => void;
  variety: {
    id?: string | number;
    name: string;
    zuechter?: string | null;
    reifezahl?: number | null;
  } | null;
  region?: string;
  schlagName?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open || !variety) return null;

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
        aria-labelledby="where-to-buy-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-panel bg-surface shadow-lift motion-safe:animate-rise motion-safe:[animation-duration:180ms]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-divider py-4 pl-5 pr-3 sm:py-5 sm:pl-6">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5 text-small text-fg-muted">
              <MapPin className="size-4 shrink-0" aria-hidden />
              <span>Bezugsquellen & Fachberater vor Ort</span>
              {region ? <span>· {region}</span> : null}
            </div>
            <h2 id="where-to-buy-title" className="text-heading text-fg">
              Wo kann ich „{variety.name}“ kaufen?
            </h2>
            <p className="max-w-measure text-small text-fg-muted">
              Unabhängige Übersicht regionaler Agrarhändler, Genossenschaften und Züchter-Fachberater
              für deinen Standort.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-touch shrink-0 items-center justify-center rounded-control text-link transition-colors hover:bg-action-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            aria-label="Fenster schließen"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          <WhereToBuyContent
            varietyId={variety.id}
            varietyName={variety.name}
            zuechter={variety.zuechter}
            reifezahl={variety.reifezahl}
            region={region}
            schlagName={schlagName}
          />
        </div>
      </div>
    </div>
  );
}
