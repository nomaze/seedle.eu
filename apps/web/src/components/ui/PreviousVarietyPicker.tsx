"use client";

import { Check, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  DEMO_VARIETIES_BY_CROP,
  getKnownVarietyCountForCrop,
  type PreviousCropKey,
} from "@/components/daten/FieldRankingView";
import { Badge } from "./Badge";
import { buttonClass } from "./Button";

interface Option {
  id: string;
  name: string;
  zuechter: string;
  reifezahl?: number;
  crop?: PreviousCropKey;
}

export function PreviousVarietyPicker({
  fieldId,
  optionen,
  initialCrop = "silomais",
  onChangeCrop,
}: {
  fieldId: string;
  optionen: Option[];
  initialCrop?: PreviousCropKey;
  onChangeCrop?: (nextCrop: PreviousCropKey) => void;
  action?: unknown;
}) {
  const router = useRouter();
  const [selectedCrop, setSelectedCrop] = useState<PreviousCropKey>(initialCrop);
  const [q, setQ] = useState("");

  const activeCatalogMeta = DEMO_VARIETIES_BY_CROP[selectedCrop] ?? DEMO_VARIETIES_BY_CROP.silomais;

  const cropFilteredOptions = useMemo<Option[]>(() => {
    const isMaizeCrop = selectedCrop === "silomais" || selectedCrop === "koernermais";
    if (isMaizeCrop && optionen.length > 0) {
      const allowedIds = new Set(activeCatalogMeta.varieties.map((v) => v.id));
      const matched = optionen.filter((o) => allowedIds.has(o.id) || o.crop === selectedCrop);
      if (matched.length > 0) return matched;
    }
    return activeCatalogMeta.varieties.map((v) => ({
      id: v.id,
      name: v.name,
      zuechter: v.zuechter,
      reifezahl: v.reifezahl,
      crop: v.crop,
    }));
  }, [selectedCrop, optionen, activeCatalogMeta]);

  const treffer = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [];
    return cropFilteredOptions
      .filter((o) => o.name.toLowerCase().includes(s) || o.zuechter.toLowerCase().includes(s))
      .slice(0, 6);
  }, [q, cropFilteredOptions]);

  const bestsellers = useMemo(
    () => activeCatalogMeta.varieties.filter((v) => v.bestseller).slice(0, 4),
    [activeCatalogMeta],
  );

  const select = (varietyId?: string, text?: string) => {
    const params = new URLSearchParams();
    if (varietyId) params.set("bisher", varietyId);
    if (text) params.set("bisherText", text);
    params.set("vorfruchtKultur", selectedCrop);
    const qs = params.toString();
    router.push(`/feld/${fieldId}/ranking${qs ? `?${qs}` : ""}`);
  };

  function handleCropChange(nextCrop: PreviousCropKey) {
    setSelectedCrop(nextCrop);
    setQ("");
    onChangeCrop?.(nextCrop);
  }

  return (
    <div className="max-w-measure space-y-5" data-testid="previous-variety-picker">
      {/* Step 1: Select crop first + show number of known varieties per crop */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-small font-bold text-fg">
            1. Zuerst Kultur wählen (Anzahl bekannter Sorten je Kultur)
          </span>
          <Badge tone="leaf">
            Gefiltert auf {activeCatalogMeta.label} ({cropFilteredOptions.length} bekannte Sorten)
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Bisher angebaute Kultur">
          {(Object.keys(DEMO_VARIETIES_BY_CROP) as PreviousCropKey[]).map((cropKey) => {
            const meta = DEMO_VARIETIES_BY_CROP[cropKey];
            const count = getKnownVarietyCountForCrop(cropKey);
            const active = selectedCrop === cropKey;
            return (
              <button
                key={cropKey}
                type="button"
                data-testid={`picker-crop-btn-${cropKey}`}
                aria-pressed={active}
                onClick={() => handleCropChange(cropKey)}
                className={`inline-flex min-h-10 items-center gap-1.5 rounded-control px-3 py-2 text-small font-semibold ring-1 ring-inset transition-colors cursor-pointer tabular-nums ${
                  active
                    ? "bg-selected text-on-selected ring-selected"
                    : "bg-surface text-fg ring-control hover:bg-highlight"
                }`}
              >
                <span>
                  {meta.label} ({count} Sorten)
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Bestseller chips + strictly crop-filtered variety search */}
      <div className="space-y-3 border-t border-divider pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-small">
          <span className="font-bold text-fg">
            2. Sorte in {activeCatalogMeta.label} auswählen ({cropFilteredOptions.length} Sorten)
          </span>
          <span className="text-caption text-fg-muted tabular-nums">
            Gefiltert auf {activeCatalogMeta.label} ({cropFilteredOptions.length} bekannte Sorten)
          </span>
        </div>

        {bestsellers.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-caption text-fg-muted">Häufig angebaut:</span>
            {bestsellers.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => select(b.id, b.name)}
                className="inline-flex h-8 items-center gap-1 rounded-control bg-surface px-2.5 text-caption font-semibold text-fg ring-1 ring-inset ring-control transition-colors hover:bg-highlight cursor-pointer tabular-nums"
              >
                <span>{b.name}</span>
                {b.reifezahl ? <span className="text-fg-muted">· {b.reifezahl}</span> : null}
              </button>
            ))}
          </div>
        ) : null}

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-fg-muted"
            aria-hidden
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`${activeCatalogMeta.label}-Sorte suchen, ${activeCatalogMeta.placeholderExample}`}
            aria-label="Sorte suchen"
            className="h-control w-full rounded-control border border-control bg-surface pl-11 pr-3 text-lead text-fg"
          />
        </div>
      </div>

      {treffer.length > 0 ? (
        <ul className="border-t border-rule">
          {treffer.map((o) => (
            <li key={o.id} className="border-b border-divider">
              <button
                type="button"
                onClick={() => select(o.id, o.name)}
                className="flex min-h-touch w-full items-center justify-between gap-3 px-1 py-3.5 text-left transition-colors hover:bg-highlight"
              >
                <span>
                  <span className="font-semibold text-fg">{o.name}</span>
                  <span className="block text-small text-fg-muted">
                    {o.zuechter} · {activeCatalogMeta.label}
                    {o.reifezahl ? ` · Reifezahl ${o.reifezahl}` : ""}
                  </span>
                </span>
                <Check className="size-5 shrink-0 text-link" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {q.trim().length >= 2 && treffer.length === 0 ? (
        <button
          type="button"
          onClick={() => select(undefined, q.trim())}
          className={buttonClass("secondary", "md", "w-full")}
        >
          „{q.trim()}“ ({activeCatalogMeta.label}) übernehmen
        </button>
      ) : null}

      <div className="pt-2">
        <button
          type="button"
          onClick={() => select()}
          className="inline-flex min-h-touch items-center text-body font-semibold text-link underline underline-offset-4 hover:decoration-2"
        >
          Ich weiß es nicht / Keine Angabe
        </button>
      </div>
    </div>
  );
}
