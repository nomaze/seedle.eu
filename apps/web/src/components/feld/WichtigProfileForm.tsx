"use client";

import { Scale, ShieldCheck, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  DEMO_VARIETIES_BY_CROP,
  getKnownVarietyCountForCrop,
  type PreviousCropKey,
} from "@/components/daten/FieldRankingView";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, SectionTitle } from "@/components/ui/Card";
import { CheckboxMark, RadioMark, optionClass, segmentClass } from "@/components/ui/Choice";
import {
  type AgronomyUsageOption,
  createDefaultAgronomyProfile,
  type FieldAgronomyProfile,
  type HarvestWindowOption,
  loadFieldAgronomyProfile,
  type MaturityGroupOption,
  normalizeAgronomyUsage,
  PLANT_PRIORITY_LABELS,
  type PlantPriorityOption,
  STRATEGY_LABELS,
  type StrategyOption,
  type SowingWindowOption,
  saveFieldAgronomyProfile,
} from "@/lib/fieldAgronomyProfile";

const STRATEGY_CARDS: {
  id: StrategyOption;
  badge: string;
  icon: "shield" | "rocket" | "scale";
}[] = [
  {
    id: "stabilitaet",
    badge: "Sichere Bank",
    icon: "shield",
  },
  {
    id: "high_performer",
    badge: "Spitzenertrag",
    icon: "rocket",
  },
  {
    id: "ausgewogen",
    badge: "Empfohlen",
    icon: "scale",
  },
];

const MATURITY_OPTIONS: { id: MaturityGroupOption; label: string }[] = [
  {
    id: "frueh",
    label: "Früh (S 190–220 / kurze Wachstumszeit, frühe Ernte für Weizen-Nachbau)",
  },
  {
    id: "mittelfrueh",
    label: "Mittelfrüh (S 230–250 / der bewährte Allrounder)",
  },
  {
    id: "spaet",
    label: "Mittelspät bis Spät (S 260–290+ / volle Vegetationszeit für Maximalertrag nutzen)",
  },
  {
    id: "automatisch",
    label: "Offen lassen (Beste Reifezahl automatisch aus meinem Standort berechnen)",
  },
];

const SOWING_OPTIONS: { id: SowingWindowOption; label: string }[] = [
  { id: "frueh", label: "Früh (Anfang/Mitte April)" },
  { id: "normal", label: "Normal (Ende April)" },
  { id: "spaet", label: "Spät (Mai, z. B. nach Grünroggen-Schnitt)" },
  { id: "frei", label: "Frei lassen" },
];

const HARVEST_OPTIONS: { id: HarvestWindowOption; label: string }[] = [
  { id: "frueh", label: "Früh (Anfang September)" },
  { id: "normal", label: "Normal (Ende Sept. / Okt.)" },
  { id: "frei", label: "Frei lassen" },
];

const KNOWN_VARIETIES = [
  "AW Talkrone",
  "AW Lichtkorn",
  "AW Morgenstern",
  "AW Sonnenkraft",
  "FG Kontinent",
  "FG Nordlicht",
  "Auenhof Bernstein",
  "Auenhof Saphir",
  "RZ Mainau",
  "RZ Sonnwend",
  "BS Tauern",
  "BS Gipfel",
  "KWS Curacao",
  "LG 31.218",
  "DKC 3361",
] as const;

export function WichtigProfileForm({
  fieldId,
  initialUsage,
}: {
  fieldId: string;
  initialUsage?: AgronomyUsageOption;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryUsage = searchParams.get("usage");
  const usage: AgronomyUsageOption = queryUsage
    ? normalizeAgronomyUsage(queryUsage)
    : normalizeAgronomyUsage(initialUsage);

  // Initialize with SSR-identical default so server HTML and first client render match 1:1,
  // then hydrate localStorage profile after mount.
  const hasHydratedProfileRef = useRef(false);
  const [profile, setProfile] = useState<FieldAgronomyProfile>(() =>
    createDefaultAgronomyProfile(fieldId, usage),
  );
  const [selectedPrevCrop, setSelectedPrevCrop] = useState<PreviousCropKey>(() =>
    usage === "koernermais" ? "koernermais" : "silomais",
  );
  const activeCropCatalog = DEMO_VARIETIES_BY_CROP[selectedPrevCrop] ?? DEMO_VARIETIES_BY_CROP.silomais;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile(loadFieldAgronomyProfile(fieldId, usage));
    hasHydratedProfileRef.current = true;
  }, [fieldId, usage]);

  function update<K extends keyof FieldAgronomyProfile>(
    key: K,
    value: FieldAgronomyProfile[K],
  ) {
    setProfile((prev) => {
      const next = { ...prev, [key]: value, usage };
      saveFieldAgronomyProfile(next);
      return next;
    });
  }

  function togglePriority(prio: PlantPriorityOption) {
    const exists = profile.priorities.includes(prio);
    const nextList = exists
      ? profile.priorities.filter((p) => p !== prio)
      : [...profile.priorities, prio];
    update("priorities", nextList);
  }

  function handleSubmit() {
    saveFieldAgronomyProfile({ ...profile, usage });
    router.push(`/feld/${fieldId}/ranking?usage=${usage}`);
  }

  return (
    <div className="space-y-section">
      {/* 1. Core Strategy (Stability vs. Plasticity) */}
      <Card aria-labelledby="wichtig-strategie-heading">
        <SectionTitle hint={<Badge tone="leaf">Wichtigster Hebel</Badge>}>
          <span id="wichtig-strategie-heading">1. Grundstrategie (Stabilität vs. Plastizität / High-Performer)</span>
        </SectionTitle>
        <p className="max-w-measure text-body text-fg-muted">
          Wie sollen wir deine Sorten zwischen Umweltstabilität in Stressjahren und hoher Plastizität für Spitzenerträge auf guten Standorten gewichten?
        </p>

        <div className="mt-6 grid max-w-measure gap-2">
          {STRATEGY_CARDS.map((card) => {
            const meta = STRATEGY_LABELS[card.id];
            const active = profile.strategy === card.id;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => update("strategy", card.id)}
                aria-pressed={active}
                className={optionClass(active, "flex cursor-pointer items-start gap-3.5 p-4")}
              >
                <span className="mt-0.5 shrink-0 text-link">
                  {card.icon === "shield" ? (
                    <ShieldCheck className="size-5" aria-hidden />
                  ) : card.icon === "rocket" ? (
                    <Sparkles className="size-5" aria-hidden />
                  ) : (
                    <Scale className="size-5" aria-hidden />
                  )}
                </span>
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <span className="text-body font-semibold text-fg">{meta.title}</span>
                    <Badge tone={active ? "leaf" : "sand"}>{card.badge}</Badge>
                  </span>
                  <span className="block text-small text-fg-muted">{meta.desc}</span>
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* 2. Maturity group (FAO / S- & K-Zahl) */}
      <Card aria-labelledby="wichtig-reife-heading">
        <SectionTitle>
          <span id="wichtig-reife-heading">2. Maximale Wachstumsdauer / Reifegruppe (FAO / S- & K-Zahl)</span>
        </SectionTitle>
        <p className="max-w-measure text-body text-fg-muted">
          Bestimmt Abreifezeitpunkt, Kornfeuchte bzw. TS-Gehalt und Zeitfenster für die Folgekultur.
        </p>

        <div className="mt-6 grid max-w-measure gap-2">
          {MATURITY_OPTIONS.map((opt) => {
            const active = profile.maturityGroup === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => update("maturityGroup", opt.id)}
                aria-pressed={active}
                className={optionClass(active, "flex min-h-touch cursor-pointer items-start gap-3 p-3.5")}
              >
                <RadioMark checked={active} />
                <span className="text-body text-fg">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* 3. Planned sowing & harvest window */}
      <Card aria-labelledby="wichtig-zeitraum-heading">
        <SectionTitle>
          <span id="wichtig-zeitraum-heading">3. Geplanter Aussaat- & Erntezeitraum</span>
        </SectionTitle>

        <div className="max-w-measure space-y-8">
          <fieldset>
            <legend className="mb-3 text-body font-semibold text-fg">Aussaatzeitraum</legend>
            <div className="flex flex-wrap gap-2">
              {SOWING_OPTIONS.map((opt) => {
                const active = profile.sowingWindow === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => update("sowingWindow", opt.id)}
                    aria-pressed={active}
                    className={segmentClass(active, "cursor-pointer")}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-3 text-body font-semibold text-fg">Erntezeitraum</legend>
            <div className="flex flex-wrap gap-2">
              {HARVEST_OPTIONS.map((opt) => {
                const active = profile.harvestWindow === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => update("harvestWindow", opt.id)}
                    aria-pressed={active}
                    className={segmentClass(active, "cursor-pointer")}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>
      </Card>

      {/* 4. Multi-select plant trait priorities */}
      <Card aria-labelledby="wichtig-prioritaeten-heading">
        <SectionTitle>
          <span id="wichtig-prioritaeten-heading">4. Was ist dir bei der Pflanze am wichtigsten? (Mehrfachauswahl)</span>
        </SectionTitle>
        <p className="max-w-measure text-body text-fg-muted">
          Wähle deine Top-Prioritäten – wir heben passende Sorten im Ranking besonders hervor.
        </p>

        <div className="mt-6 grid max-w-measure gap-2">
          {(Object.keys(PLANT_PRIORITY_LABELS) as PlantPriorityOption[]).map((prioKey) => {
            const active = profile.priorities.includes(prioKey);
            return (
              <button
                key={prioKey}
                type="button"
                onClick={() => togglePriority(prioKey)}
                aria-pressed={active}
                className={optionClass(active, "flex min-h-touch cursor-pointer items-center gap-3 px-3.5 py-2.5")}
              >
                <CheckboxMark checked={active} />
                <span className="text-body text-fg">{PLANT_PRIORITY_LABELS[prioKey]}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* 5. Previous reference variety & breeder experience */}
      <Card aria-labelledby="wichtig-erfahrung-heading">
        <SectionTitle>
          <span id="wichtig-erfahrung-heading">5. Deine bisherigen Erfahrungen (Referenz-Sorte & Züchter)</span>
        </SectionTitle>
        <p className="max-w-measure text-body text-fg-muted">
          Für den direkten 1:1-Vergleich (Deine Altsorte vs. Top-Empfehlung #1) auf der nächsten
          Seite.
        </p>

        <div className="mt-6 max-w-measure space-y-8">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-small font-bold text-fg">
                Schritt 1: Welche Kultur hast du bisher angebaut?
              </span>
              <Badge tone="leaf">
                Gefiltert auf {activeCropCatalog.label} ({activeCropCatalog.varieties.length} bekannte Sorten)
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(DEMO_VARIETIES_BY_CROP) as PreviousCropKey[]).map((cropKey) => {
                const meta = DEMO_VARIETIES_BY_CROP[cropKey];
                const count = getKnownVarietyCountForCrop(cropKey);
                const active = selectedPrevCrop === cropKey;
                return (
                  <button
                    key={cropKey}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setSelectedPrevCrop(cropKey);
                      const firstVar = meta.varieties[0]?.name;
                      if (firstVar) {
                        update("referenceVariety", firstVar);
                      }
                    }}
                    className={segmentClass(active, "cursor-pointer tabular-nums")}
                  >
                    {meta.label} ({count} Sorten)
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="ref-variety-select" className="block text-body font-semibold text-fg">
              Welche {activeCropCatalog.label}-Sorte hast du zuletzt angebaut? ({activeCropCatalog.varieties.length} Sorten)
            </label>
            <select
              id="ref-variety-select"
              value={
                activeCropCatalog.varieties.some((v) => v.name === profile.referenceVariety) ||
                KNOWN_VARIETIES.includes(profile.referenceVariety as (typeof KNOWN_VARIETIES)[number])
                  ? profile.referenceVariety
                  : "custom"
              }
              onChange={(e) => {
                if (e.target.value !== "custom") {
                  update("referenceVariety", e.target.value);
                }
              }}
              className="mt-2 h-control w-full rounded-control border border-control bg-surface px-3 text-body text-fg"
            >
              {activeCropCatalog.varieties.map((v) => (
                <option key={v.id} value={v.name}>
                  {v.name} ({v.zuechter}{v.reifezahl ? ` · Reife ${v.reifezahl}` : ""})
                </option>
              ))}
              <option value="custom">Andere Sorte (Freitext eingeben)</option>
            </select>
            <input
              type="text"
              maxLength={80}
              value={profile.referenceVariety}
              onChange={(e) => update("referenceVariety", e.target.value)}
              placeholder={`Oder ${activeCropCatalog.label}-Sortenname direkt eingeben (${activeCropCatalog.placeholderExample}) …`}
              className="mt-2 h-control w-full rounded-control border border-control bg-surface px-3 text-body text-fg"
            />
          </div>

          <div>
            <label htmlFor="exp-notes-input" className="block text-body font-semibold text-fg">
              Gute oder schlechte Erfahrungen mit bestimmten Sorten/Anbietern? (Optional)
            </label>
            <textarea
              id="exp-notes-input"
              rows={4}
              maxLength={240}
              value={profile.experienceNotes}
              onChange={(e) => update("experienceNotes", e.target.value)}
              placeholder="z. B. Letztes Jahr starker Beulenbrand bei Sorte X; sehr zufrieden mit KWS-Jugendentwicklung …"
              className="mt-2 w-full resize-none rounded-control border border-control bg-surface px-3 py-2.5 text-body text-fg"
            />
          </div>

          <div className="border-t border-divider pt-6">
            <Button onClick={handleSubmit} className="w-full sm:w-auto">
              <span>Meine Sorten für 2027 berechnen →</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
