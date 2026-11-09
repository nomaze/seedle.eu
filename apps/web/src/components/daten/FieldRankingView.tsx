"use client";

import type {
  ClimateScenario,
  RankedVariety,
  Recommendation,
  ScenarioId,
  Usage,
} from "@seedle/core";
import { ArrowRight, Check, ChevronRight, Sparkles, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { RangeBar } from "@/components/charts/RangeBar";
import { useSpross } from "@/components/spross/SprossContext";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { num } from "@/lib/format";
import { SaatgutKaufenModal } from "./SaatgutKaufenModal";
import { VarietyRankingTable, type RankingVarietyItem } from "./VarietyRankingTable";
import { VarietySteckbriefModal } from "./VarietySteckbriefModal";
import { NurMit, useDemo } from "@/components/shell/DemoContext";

export interface FieldRankingViewProps {
  field: {
    id: string;
    name: string;
    areaHa: number;
    hektar?: number;
    usage: string | null;
    previousVarietyId?: string | null;
    previousVarietyText?: string | null;
    env: { region: string };
  };
  rec: Recommendation;
  sortierung: ScenarioId | "gewichtet";
  standardVarietyId?: string;
}

function getVarietyYield(
  v: RankedVariety,
  usage: Usage,
  sortierung: ScenarioId | "gewichtet",
  scenarios: ClimateScenario[],
): number {
  if (sortierung === "gewichtet") {
    const val = scenarios.reduce((sum, s) => {
      const p = v.predictions.find((pred) => pred.scenarioId === s.id);
      const y = (usage === "koernermais" ? p?.kornertragDtHa : p?.trockenmasseDtHa) ?? 0;
      return sum + s.wahrscheinlichkeit * y;
    }, 0);
    return Math.round(val * 10) / 10;
  }
  const p = v.predictions.find((pred) => pred.scenarioId === sortierung);
  const y = (usage === "koernermais" ? p?.kornertragDtHa : p?.trockenmasseDtHa) ?? 0;
  return Math.round(y * 10) / 10;
}

function getVarietyYieldRange(v: RankedVariety, usage: Usage): [number, number] {
  const yields = v.predictions.map(
    (p) => (usage === "koernermais" ? p.kornertragDtHa : p.trockenmasseDtHa) ?? 0,
  );
  return [
    Math.round(Math.min(...yields) * 10) / 10,
    Math.round(Math.max(...yields) * 10) / 10,
  ];
}

export function FieldRankingView({
  field,
  rec,
  sortierung,
  standardVarietyId,
}: FieldRankingViewProps) {
  const router = useRouter();
  const { saatgutKauf } = useDemo();
  const { updatePageState, registerActionHandler, setActiveVariety } = useSpross();

  const usage = field.usage as Usage;
  const fieldHektar = field.hektar ?? field.areaHa;

  const [selectedVarietyId, setSelectedVarietyId] = useState<number | string | null>(null);
  const [buyingVariety, setBuyingVariety] = useState<{
    id?: number | string;
    name: string;
    zuechter?: string | null;
    siloreifezahl?: number | null;
    koernerreifezahl?: number | null;
  } | null>(null);

  // 1. Sort varieties primarily by yield (dt/ha), then lodging resistance, then alphabetical
  const sortedVarieties = useMemo(
    () =>
      [...rec.sorten].sort((a, b) => {
        const yA = getVarietyYield(a, usage, sortierung, rec.scenarios);
        const yB = getVarietyYield(b, usage, sortierung, rec.scenarios);
        if (yB !== yA) return yB - yA;
        if (b.variety.traits.standfestigkeit !== a.variety.traits.standfestigkeit) {
          return b.variety.traits.standfestigkeit - a.variety.traits.standfestigkeit;
        }
        return a.variety.name.localeCompare(b.variety.name, "de");
      }),
    [rec.sorten, rec.scenarios, usage, sortierung]
  );

  // Spross: report active live page view state
  useEffect(() => {
    const visibleNames = sortedVarieties.slice(0, 6).map((s) => s.variety.name);
    const hasPrev = Boolean(field.previousVarietyId || field.previousVarietyText);
    const topName = sortedVarieties[0]?.variety.name;
    updatePageState({
      route: `/feld/${field.id}/ranking`,
      stepLabel: "Schritt 3/3: Sorten-Ranking",
      activeScenario: String(sortierung),
      activeFilters: {
        usage: String(field.usage ?? "silomais"),
        sortierung: String(sortierung),
      },
      visibleVarieties: visibleNames,
      missingInfo: hasPrev ? [] : ["Bisherige Sorte fehlt noch für 5-Jahres-Vergleich"],
      nextBestAction: topName
        ? `${topName} im Klimaszenario prüfen oder als Sorte für ${field.name} wählen`
        : "Sorte für den Schlag auswählen",
    });
  }, [
    field.id,
    field.name,
    field.usage,
    field.previousVarietyId,
    field.previousVarietyText,
    sortierung,
    sortedVarieties,
    updatePageState,
  ]);

  // Spross: live action handler for scenario switching and variety profile modal
  useEffect(() => {
    return registerActionHandler((action) => {
      if (action.type === "select_scenario" || action.filterKey === "sortierung") {
        const raw = (action.target || action.filterValue || "trocken").toLowerCase();
        const matchScenario = rec.scenarios.find(
          (s) =>
            s.id.toLowerCase() === raw ||
            s.label.toLowerCase().includes(raw) ||
            (raw.includes("trocken") && s.id.toLowerCase().includes("trocken")) ||
            (raw.includes("kuehl") && s.id.toLowerCase().includes("kuehl")) ||
            (raw.includes("kühl") && s.id.toLowerCase().includes("kuehl"))
        );
        const nextSort =
          raw === "gewichtet"
            ? "gewichtet"
            : (matchScenario?.id ?? (raw as ScenarioId));
        const href =
          nextSort === "gewichtet"
            ? `/feld/${field.id}/ranking`
            : `/feld/${field.id}/ranking?sortierung=${nextSort}`;
        router.push(href);
        return true;
      }

      if (action.type === "open_variety_detail") {
        const q = (action.varietyId || action.label || "").toLowerCase();
        const matched =
          sortedVarieties.find(
            (s) =>
              s.variety.id.toLowerCase() === q ||
              s.variety.name.toLowerCase().includes(q) ||
              q.includes(s.variety.name.toLowerCase())
          ) ?? sortedVarieties[0];
        if (matched) {
          setSelectedVarietyId(matched.variety.id);
          setActiveVariety(matched.variety.name);
          return true;
        }
      }
      return false;
    });
  }, [field.id, rec.scenarios, registerActionHandler, router, setActiveVariety, sortedVarieties]);

  const [erste, ...rest] = sortedVarieties;
  if (!erste) return null;

  // 2. Reference yield of regional trial standard for relative yield index calculation (%)
  const stdVarietyInRec = standardVarietyId
    ? rec.sorten.find((s) => s.variety.id === standardVarietyId)
    : undefined;
  const standardYield = stdVarietyInRec
    ? getVarietyYield(stdVarietyInRec, usage, sortierung, rec.scenarios)
    : rec.sorten.reduce(
        (sum, s) => sum + getVarietyYield(s, usage, sortierung, rec.scenarios),
        0,
      ) / Math.max(rec.sorten.length, 1);

  // Spread across all varieties for RangeBars (relative index % to site reference)
  const toRel = (val: number) =>
    standardYield > 0 ? Math.round((val / standardYield) * 1000) / 10 : 100;
  const allYieldRanges = rec.sorten.map((s) => {
    const [lo, hi] = getVarietyYieldRange(s, usage);
    return [toRel(lo), toRel(hi)] as [number, number];
  });
  const skalaRel: [number, number] = [
    Math.min(...allYieldRanges.map((r) => r[0])),
    Math.max(...allYieldRanges.map((r) => r[1])),
  ];

  // Top-ranked variety key performance metrics (relative index & rank)
  const ersteYield = getVarietyYield(erste, usage, sortierung, rec.scenarios);
  const [ersteMinYield, ersteMaxYield] = getVarietyYieldRange(erste, usage);
  const ersteMinRel = toRel(ersteMinYield);
  const ersteMaxRel = toRel(ersteMaxYield);
  const ersteRel = standardYield > 0 ? Math.round((ersteYield / standardYield) * 100) : 100;
  const ersteRelDiff = ersteRel - 100;
  const ersteRelSubtext =
    ersteRelDiff > 0
      ? `+${ersteRelDiff} % über regionalem Versuchsstandard`
      : ersteRelDiff < 0
        ? `${ersteRelDiff} % zum regionalen Versuchsstandard`
        : `100 % (regionaler Versuchsstandard)`;

  const normalPred =
    erste.predictions.find((p) => p.scenarioId === "normal") ?? erste.predictions[0];
  const ersteFeuchte = normalPred?.kornfeuchteProzent ?? 26;
  const ersteTsGehalt =
    usage === "koernermais"
      ? Math.round((100 - ersteFeuchte) * 10) / 10
      : Math.round((34.5 + (240 - erste.variety.reifezahl) * 0.02) * 10) / 10;
  const ersteStaerke = Math.round((normalPred?.staerkeProzent ?? 33) * 10) / 10;

  const bisherigeId = field.previousVarietyId;
  const bisherige = rec.sorten.find((s) => s.variety.id === bisherigeId);
  const bisherigeYield = bisherige
    ? getVarietyYield(bisherige, usage, sortierung, rec.scenarios)
    : null;
  const bisherigeRel =
    bisherigeYield != null && standardYield > 0
      ? Math.round((bisherigeYield / standardYield) * 1000) / 10
      : null;

  // 3. Transform to tabular view items
  const tableVarieties: RankingVarietyItem[] = sortedVarieties.map((s, idx) => {
    const y = getVarietyYield(s, usage, sortierung, rec.scenarios);
    const rel = standardYield > 0 ? Math.round((y / standardYield) * 100) : 100;
    const diff = rel - 100;
    const relSub =
      diff > 0
        ? `+${diff} % über Standard`
        : diff < 0
          ? `${diff} % zum Standard`
          : `100 % (Standard)`;

    const nPred = s.predictions.find((p) => p.scenarioId === "normal") ?? s.predictions[0];
    const feuchte = nPred?.kornfeuchteProzent ?? 26;
    const ts =
      usage === "koernermais"
        ? Math.round((100 - feuchte) * 10) / 10
        : Math.round((34.5 + (240 - s.variety.reifezahl) * 0.02) * 10) / 10;
    const staerke = Math.round((nPred?.staerkeProzent ?? 33) * 10) / 10;

    const isWinner = idx === 0;
    const isBisher = s.variety.id === bisherigeId;

    return {
      id: s.variety.id,
      rang: idx + 1,
      name: s.variety.name,
      zuechter: s.breeder.name,
      siloreifezahl: s.variety.reifezahl,
      koernerreifezahl: s.variety.reifezahl,
      reifeLabel:
        s.variety.usages.includes("silomais") && s.variety.usages.includes("koernermais")
          ? `S ${s.variety.reifezahl} · K ${s.variety.reifezahl}`
          : `Reife ${s.variety.reifezahl}`,
      zulassungsjahr: s.variety.zulassungsjahr,
      ertragDtHa: null,
      relativertragProzent: rel,
      relativertragSubtext: relSub,
      standfestigkeitNote: s.variety.traits.standfestigkeit,
      tsGehaltProzent: ts,
      staerkeProzent: usage === "silomais" ? staerke : null,
      badge: isWinner ? "Empfehlung" : isBisher ? "Deine bisherige Sorte" : null,
      badgeTone: isWinner ? "leaf" : "sand",
      detailHref: `/feld/${field.id}/sorte/${s.variety.id}`,
    };
  });

  return (
    <>
      {/* Scenario selection */}
      <nav
        aria-label="Sortierung nach Klimaszenario"
        className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]"
      >
        {[
          { id: "gewichtet", label: "Alle Szenarien", sub: "gewichtet" },
          ...rec.scenarios.map((s) => ({
            id: s.id,
            label: s.label,
            sub: `${Math.round(s.wahrscheinlichkeit * 100)} %`,
          })),
        ].map((o) => {
          const aktiv = o.id === sortierung;
          return (
            <Link
              key={o.id}
              href={
                o.id === "gewichtet"
                  ? `/feld/${field.id}/ranking`
                  : `/feld/${field.id}/ranking?sortierung=${o.id}`
              }
              scroll={false}
              aria-current={aktiv ? "true" : undefined}
              className={`shrink-0 rounded-full px-4 py-2 text-sm ring-1 transition ${
                aktiv
                  ? "bg-ink text-white ring-ink"
                  : "bg-white/90 text-ink ring-line hover:ring-leaf-300"
              }`}
            >
              <span className="font-semibold">{o.label}</span>{" "}
              <span className={aktiv ? "text-white/70" : "text-muted"}>{o.sub}</span>
            </Link>
          );
        })}
      </nav>

      {/* Recommendation leader (Rank 1) by yield */}
      <Card data-spross-target="ranking-winner" className="relative overflow-hidden ring-leaf-300">
        <div
          className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-leaf-50"
          aria-hidden
        />
        <div className="relative">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-leaf-700">
            <Sparkles className="size-4" />{" "}
            {sortierung === "gewichtet"
              ? "Unsere Empfehlung für dein Feld"
              : `Vorne, wenn 2027 „${rec.scenarios.find((s) => s.id === sortierung)?.label.toLowerCase()}“ wird`}
          </div>

          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-3xl font-bold tracking-tight">{erste.variety.name}</div>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted">
                {erste.breeder.logo ? (
                  <Image
                    src={erste.breeder.logo}
                    alt=""
                    width={64}
                    height={20}
                    className="h-5 w-auto"
                  />
                ) : null}
                <span>
                  {erste.breeder.name} · Reifezahl {erste.variety.reifezahl}
                </span>
              </div>
            </div>

            {/* Primary metric: site rank & relative yield index (%) */}
            <div className="text-right">
              <div className="text-3xl font-bold tabular text-leaf-800">
                Platz 1 · {num(ersteRel)} %
              </div>
              <div className="text-xs text-muted">
                Standort-Ranking ({usage === "silomais" ? "Silomais" : "Körnermais"})
              </div>
            </div>
          </div>

          {/* Relative yield and agronomic traits */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="leaf">
              {num(ersteRel)} % ({ersteRelSubtext})
            </Badge>

            {bisherige && bisherige.variety.id !== erste.variety.id && bisherigeRel != null ? (
              <Badge tone="leaf">
                +{num(Math.max(0, Math.round((ersteRel - bisherigeRel) * 10) / 10), 1)} % Vorsprung vor {bisherige.variety.name}
              </Badge>
            ) : rest[0] ? (
              <Badge tone="leaf">
                Platz 1 vor {rest[0].variety.name}
              </Badge>
            ) : null}

            <Badge tone="sand">
              Standfestigkeit: BSA {erste.variety.traits.standfestigkeit} / 9
            </Badge>

            {erste.stabil ? <Badge tone="sand">Stabil über alle Szenarien</Badge> : null}
          </div>

          {/* Detailed agronomic metrics */}
          <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div className="rounded-xl bg-sand-50 px-3 py-2 ring-1 ring-line">
              <dt className="text-xs text-muted">Relativ-Index ({sortierung === "gewichtet" ? "Ø gewichtet" : "Szenario"})</dt>
              <dd className="font-semibold tabular">
                {num(ersteRel, 0)} % <span className="text-xs font-normal text-muted">(100 % = Standort-Mittel)</span>
              </dd>
            </div>

            <div className="rounded-xl bg-sand-50 px-3 py-2 ring-1 ring-line">
              <dt className="text-xs text-muted">Standfestigkeit (BSA)</dt>
              <dd className="font-semibold tabular">
                Note {erste.variety.traits.standfestigkeit} von 9{" "}
                <span className="text-xs font-normal text-muted">
                  ({erste.variety.traits.standfestigkeit >= 8 ? "sehr standfest" : "gute Standfestigkeit"})
                </span>
              </dd>
            </div>

            {usage === "koernermais" ? (
              <>
                <div className="rounded-xl bg-sand-50 px-3 py-2 ring-1 ring-line">
                  <dt className="text-xs text-muted">Kornfeuchte bei Ernte</dt>
                  <dd className="font-semibold tabular">{num(ersteFeuchte)} %</dd>
                </div>
                <div className="rounded-xl bg-sand-50 px-3 py-2 ring-1 ring-line">
                  <dt className="text-xs text-muted">TS-Gehalt im Korn</dt>
                  <dd className="font-semibold tabular">{num(ersteTsGehalt)} %</dd>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-xl bg-sand-50 px-3 py-2 ring-1 ring-line">
                  <dt className="text-xs text-muted">TS-Gehalt (Silo)</dt>
                  <dd className="font-semibold tabular">{num(ersteTsGehalt)} %</dd>
                </div>
                <div className="rounded-xl bg-sand-50 px-3 py-2 ring-1 ring-line">
                  <dt className="text-xs text-muted">Stärkegehalt</dt>
                  <dd className="font-semibold tabular">{num(ersteStaerke)} %</dd>
                </div>
              </>
            )}

            <div className="col-span-2 sm:col-span-4 rounded-xl bg-sand-50 px-3 py-2 ring-1 ring-line">
              <dt className="text-xs text-muted">Spanne über Klimaszenarien</dt>
              <dd className="font-semibold tabular">
                {num(ersteMinRel, 0)} % bis {num(ersteMaxRel, 0)} % (Relativ-Index)
              </dd>
            </div>
          </dl>

          {/* RangeBar in relative index (%) */}
          <div className="mt-5">
            <RangeBar
              lo={ersteMinRel}
              hi={ersteMaxRel}
              mitte={ersteRel}
              skala={skalaRel}
              label={`Relativ-Index von ${num(ersteMinRel, 0)} % bis ${num(ersteMaxRel, 0)} %`}
            />
          </div>

          {/* Action buttons for winning variety */}
          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <NurMit funktion="saatgutKauf">
              <button
                type="button"
                onClick={() =>
                  setBuyingVariety({
                    id: erste.variety.id,
                    name: erste.variety.name,
                    zuechter: erste.breeder.name,
                    siloreifezahl: erste.variety.reifezahl,
                    koernerreifezahl: erste.variety.reifezahl,
                  })
                }
                className="inline-flex items-center justify-center gap-2 rounded-full bg-leaf-600 hover:bg-leaf-500 active:bg-leaf-700 text-white px-5 py-3 text-sm font-bold shadow-lift transition cursor-pointer"
              >
                <ShoppingBag className="size-4" />
                <span>Saatgut für diesen Schlag kaufen</span>
              </button>

              <button
                type="button"
                onClick={() => router.push(`/feld/${field.id}`)}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-white px-4 py-3 text-sm font-semibold text-leaf-800 ring-1 ring-line hover:bg-leaf-50 shadow-sm transition cursor-pointer"
              >
                <Check className="size-4 text-leaf-600" />
                <span>Diese Sorte wählen</span>
              </button>
            </NurMit>

            <button
              type="button"
              onClick={() => setSelectedVarietyId(erste.variety.id)}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white px-4 py-3 text-sm font-semibold text-leaf-800 ring-1 ring-line hover:bg-leaf-50 shadow-sm transition cursor-pointer"
            >
              <span>Steckbrief ansehen</span>
              <ChevronRight className="size-4" />
            </button>

            <ButtonLink
              href={`/feld/${field.id}/sorte/${erste.variety.id}`}
              variant="quiet"
              className="text-xs text-muted hover:text-ink justify-center sm:ml-auto"
            >
              Agronomische Tiefenanalyse <ArrowRight className="size-4 ml-1" />
            </ButtonLink>
          </div>
        </div>
      </Card>

      {field.previousVarietyText && field.previousVarietyText !== "unbekannt" && !bisherige ? (
        <p className="mt-4 text-sm text-muted">
          „{field.previousVarietyText}“ nehmen wir mit der nächsten Datenrunde auf. Bis dahin
          vergleichen wir mit dem regionalen Standard.
        </p>
      ) : null}

      {/* All varieties compared - uses shared ranking table component */}
      <div className="mt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
          <h2 className="text-lg font-semibold text-ink">
            Alle Sorten im Standort-Ranking ({sortedVarieties.length})
          </h2>
          <span className="text-xs text-muted">
            Sortiert nach Standort-Passung, Relativ-Index (%) & BSA-Standfestigkeit
          </span>
        </div>

        <VarietyRankingTable
          varieties={tableVarieties}
          onSelectVariety={(id) => setSelectedVarietyId(id)}
          onBuyVariety={
            saatgutKauf
              ? (v) =>
                  setBuyingVariety({
                    id: v.id,
                    name: v.name,
                    zuechter: v.zuechter,
                    siloreifezahl: v.siloreifezahl,
                    koernerreifezahl: v.koernerreifezahl,
                  })
              : undefined
          }
          emptyText="Keine Sorten für dieses Anbaugebiet verfügbar."
        />
      </div>

      {/* Methodology, transparency, and neutrality disclaimer */}
      <details className="group mt-8 rounded-card bg-white/80 p-5 ring-1 ring-line">
        <summary className="cursor-pointer list-none font-semibold text-ink">
          So rechnen wir <span className="text-sm font-normal text-muted group-open:hidden">(aufklappen)</span>
        </summary>
        <div className="mt-4 space-y-4 text-sm text-muted">
          <p>
            <strong className="text-ink">Standort-Ranking & Relativ-Index (%):</strong>{" "}
            Wir ordnen alle Sorten nach ihrer relativen Leistung auf deinem Boden und unter deinen
            Klimaszenarien (Platz 1, Platz 2, …) ein, statt spekulative absolute Ertragsversprechen
            zu machen.
          </p>

          <p>
            <strong className="text-ink">Relativ-Index (100 % = Standort-Referenz):</strong> Gibt
            an, wie stark eine Sorte im Verhältnis zum regionalen Versuchsstandard bzw.
            Standort-Mittel (100 %) abschneidet.
          </p>

          <div>
            <strong className="text-ink">Klimaszenarien für 2027 an deinem Standort</strong>
            <ul className="mt-1 space-y-1">
              {rec.scenarios.map((s) => (
                <li key={s.id}>
                  {s.label} ({Math.round(s.wahrscheinlichkeit * 100)} %): {s.beschreibung}
                </li>
              ))}
            </ul>
          </div>

          <p>
            <strong className="text-ink">Agronomische Begleitmerkmale:</strong> Standfestigkeit
            basiert auf der offiziellen BSA-Einstufung (Note 1 bis 9, 9 = sehr standfest).
            TS- und Stärkegehalte stammen aus den amtlichen Landessortenversuchen (LSV).
          </p>

          <p>
            <strong className="text-ink">Neutralität:</strong> Das Ranking ergibt sich
            ausschließlich aus den agronomischen Ertragsdaten und der Standortpassung. Züchter,
            Partnerschaften oder Provisionen haben keinen Einfluss. Sorten von Züchtern ohne
            Partnerschaft stehen absolut gleichberechtigt in der Liste.
          </p>
        </div>
      </details>

      {/* 1. Variety profile modal */}
      <VarietySteckbriefModal
        varietyId={selectedVarietyId}
        onClose={() => setSelectedVarietyId(null)}
        initialFlaecheHa={fieldHektar}
        schlagName={field.name}
        fieldId={field.id}
      />

      {/* 2. Seed checkout inquiry modal */}
      {buyingVariety && (
        <SaatgutKaufenModal
          offen={true}
          onClose={() => setBuyingVariety(null)}
          variety={buyingVariety}
          initialFlaecheHa={fieldHektar}
          schlagName={field.name}
          fieldId={field.id}
        />
      )}
    </>
  );
}
