"use client";

import {
  Building2,
  CheckCircle2,
  Loader2,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  ShieldCheck,
  ShoppingBag,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import { useDemo } from "@/components/shell/DemoContext";
import { useSpross } from "@/components/spross/SprossContext";
import { SprossAvatar } from "@/components/spross/SprossAvatar";
import { Badge } from "@/components/ui/Badge";
import { buttonClass } from "@/components/ui/Button";
import { optionClass, RadioMark, segmentClass } from "@/components/ui/Choice";
import { StatusShape } from "@/components/ui/StatusMarker";
import { num } from "@/lib/format";
import { TEAM } from "@/lib/team";

export interface SaatgutKaufenModalProps {
  offen: boolean;
  onClose: () => void;
  onCloseAll?: () => void;
  variety: {
    id?: number | string;
    name: string;
    zuechter?: string | null;
    siloreifezahl?: number | null;
    koernerreifezahl?: number | null;
    korntyp?: string | null;
    hybridtyp?: string | null;
  };
  initialFlaecheHa?: number;
  schlagName?: string;
  fieldId?: string;
}

const ZEITFENSTER = [
  "Heute Vormittag",
  "Heute Nachmittag",
  "Morgen früh",
  "Wann es passt",
] as const;

const FIELD_CLASS =
  "w-full rounded-control border border-control bg-surface px-4 text-body text-fg outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";
/** Full-width form action; long labels may wrap on phones, so the control height is a minimum. */
function wideButtonClass(variant: "primary" | "secondary") {
  return buttonClass(variant, "md", "w-full cursor-pointer").replace("h-control", "min-h-control py-2 text-center");
}
const STEP_CLASS =
  "flex shrink-0 items-center justify-center rounded-control text-link ring-1 ring-inset ring-control transition-colors hover:bg-action-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

const FLAECHEN_PRESETS = [5, 10, 20, 35, 50, 75];

const BEIZUNGEN = [
  {
    id: "vogelschutz",
    name: "Vogelschutz-Beizung (Standard)",
    tag: "Empfohlen",
    beschreibung:
      "Fungizider Auflaufschutz + amtlich zugelassener Vogelfraßschutz (Schutz vor Krähen, Fasanen & Tauben).",
  },
  {
    id: "standard",
    name: "Standard (Fungizid)",
    tag: "Basis-Schutz",
    beschreibung:
      "Geprüfter Keimlings- und Auflaufschutz gegen Pythium- und Fusarium-Bodenpilze.",
  },
  {
    id: "drahtwurm",
    name: "Vogelschutz + Drahtwurmschutz",
    tag: "Intensiv",
    beschreibung:
      "Kombinierter Schutz gegen Vogelfraß und Bodenschädlinge auf Risikoflächen oder nach Grünlandumbruch.",
  },
] as const;

export function SaatgutKaufenModal({
  offen,
  onClose,
  onCloseAll,
  variety,
  initialFlaecheHa,
  schlagName,
  fieldId,
}: SaatgutKaufenModalProps) {
  const router = useRouter();
  const { saatgutKauf } = useDemo();
  const { setMood, askSpross } = useSpross();

  const [flaecheHa, setFlaecheHa] = useState<number>(() => {
    if (initialFlaecheHa != null && initialFlaecheHa > 0) {
      return Math.round(initialFlaecheHa * 10) / 10;
    }
    return 20;
  });
  const [einheitenManual, setEinheitenManual] = useState<number | null>(null);
  const [beizung, setBeizung] = useState<string>("vogelschutz");
  const [telefon, setTelefon] = useState<string>("");
  const [zeitfenster, setZeitfenster] = useState<string>(ZEITFENSTER[0]);
  const [notiz, setNotiz] = useState<string>("");

  useEffect(() => {
    try {
      const savedPhone = localStorage.getItem("nomaze_telefon");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (savedPhone) setTelefon(savedPhone);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const [status, setStatus] = useState<"offen" | "sendet" | "fertig">("offen");
  const [anfrageTyp, setAnfrageTyp] = useState<"verbindlich" | "beratung">("verbindlich");
  const [fehler, setFehler] = useState<string | null>(null);

  const [prevInitialFlaecheHa, setPrevInitialFlaecheHa] = useState(initialFlaecheHa);
  if (prevInitialFlaecheHa !== initialFlaecheHa) {
    setPrevInitialFlaecheHa(initialFlaecheHa);
    if (initialFlaecheHa != null && initialFlaecheHa > 0) {
      setFlaecheHa(Math.round(initialFlaecheHa * 10) / 10);
      setEinheitenManual(null);
    }
  }

  // Close on Escape key
  useEffect(() => {
    if (!offen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [offen, onClose]);

  if (!offen || !saatgutKauf) return null;

  // Standard corn seed density calculation: approx. 85,000 kernels/ha, 1 unit = 50,000 kernels
  const berechneteEinheiten = Math.max(1, Math.round((flaecheHa * 85000) / 50000));
  const einheiten = einheitenManual ?? berechneteEinheiten;
  const gesamtKoerner = einheiten * 50000;

  const reifeParts: string[] = [];
  if (variety.siloreifezahl) reifeParts.push(`S ${variety.siloreifezahl}`);
  if (variety.koernerreifezahl) reifeParts.push(`K ${variety.koernerreifezahl}`);
  const reifeText = reifeParts.length > 0 ? reifeParts.join(" / ") : "Reife k. A.";

  const gewaehlteBeizung =
    BEIZUNGEN.find((b) => b.id === beizung) ?? BEIZUNGEN[0];

  function handleFlaecheChange(ha: number) {
    const safeHa = Math.max(0.5, Math.min(500, Math.round(ha * 10) / 10));
    setFlaecheHa(safeHa);
    setEinheitenManual(null); // Re-enable automatic unit calculation
  }

  function handleEinheitenChange(delta: number) {
    const neu = Math.max(1, einheiten + delta);
    setEinheitenManual(neu);
  }

  async function handleAbsenden(typ: "verbindlich" | "beratung") {
    setFehler(null);

    const cleanPhone = telefon.replace(/[^\d+ ]/g, "").trim();
    if (cleanPhone.replace(/\D/g, "").length < 6) {
      setFehler("Bitte gib eine Telefonnummer mit mindestens 6 Ziffern für Rückfragen an.");
      return;
    }

    setStatus("sendet");
    setAnfrageTyp(typ);

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("nomaze_telefon", cleanPhone);
      } catch {
        // Ignore errors in private browsing modes
      }
    }

    const typLabel =
      typ === "verbindlich"
        ? "Verbindliche Saatgutanfrage & Reservierung"
        : "Telefonische Beratung / Saatgut-Gespräch";

    const anliegenParts: (string | null | undefined)[] = [
      `Saatgutanfrage (${typLabel})`,
    ];
    if (schlagName) {
      anliegenParts.push(`Saatgut für Schlag: ${schlagName} (${num(flaecheHa)} ha)`);
    }
    anliegenParts.push(
      `Sorte: ${variety.name} (${variety.zuechter || "Züchter k. A."}, Reife: ${reifeText})`,
      `Menge: ${einheiten} Einheiten à 50.000 Korn (${gesamtKoerner.toLocaleString("de-DE")} Körner)`,
      `Fläche: ${flaecheHa} ha`,
      `Beizung: ${gewaehlteBeizung.name}`,
      notiz.trim() ? `Hinweis / Schlag: ${notiz.trim()}` : null,
    );

    const anliegenText = anliegenParts.filter(Boolean).join(" · ");

    try {
      // 1. Callback-API ansteuern
      const cbRes = await fetch("/api/v1/callbacks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          telefon: cleanPhone,
          zeitfenster,
          anliegen: anliegenText,
          seite: typeof window !== "undefined" ? window.location.pathname : "/daten",
        }),
      });

      if (!cbRes.ok) {
        const errData = await cbRes.json().catch(() => ({}));
        throw new Error(errData.fehler || "Fehler beim Absenden der Anfrage");
      }

      // 2. Update farm knowledge repository for Spross
      const schlagText = schlagName ? ` für Schlag „${schlagName}“` : "";
      await fetch("/api/v1/knowledge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          topic: "sorte",
          jahr: 2027,
          text: `Saatgutanfrage für ${variety.name} (${variety.zuechter || "Züchter k. A."}, ${reifeText}): ${einheiten} Einheiten für ${flaecheHa} ha${schlagText} (${gewaehlteBeizung.name}).`,
        }),
      }).catch(() => {
        // Non-blocking for primary checkout workflow
      });

      // 3. Mark or select variety for the field
      if (fieldId && variety.id) {
        await fetch(`/api/v1/fields/${fieldId}/selection`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ varietyId: String(variety.id) }),
        }).catch(() => {});
      }

      // Spross companion celebration mood
      setMood("freut");
      setStatus("fertig");
    } catch (err: unknown) {
      setStatus("offen");
      setFehler(
        err instanceof Error
          ? err.message
          : "Das hat leider nicht geklappt. Bitte probiere es erneut oder rufe uns an."
      );
    }
  }

  function handleMitSprossSprechen() {
    askSpross(
      `Ich plane die Aussaat von ${variety.name} (${einheiten} Einheiten auf ${flaecheHa} ha, Beizung: ${gewaehlteBeizung.name}). Welche Erfahrungen, Bodenvoraussetzungen und Aussaattipps hast du für diesen Mais?`
    );
    if (onCloseAll) {
      onCloseAll();
    } else {
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6">
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
        aria-labelledby="kauf-modal-title"
        className="relative z-10 flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-panel bg-surface shadow-lift motion-safe:animate-rise motion-safe:[animation-duration:180ms]"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-divider py-4 pl-5 pr-3 sm:py-5 sm:pl-6">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-x-1.5 text-small text-fg-muted">
              <ShoppingBag className="size-4 shrink-0" aria-hidden />
              <span>NoMaze Saatgutservice · Händler-Vermittlung</span>
              <span aria-hidden>·</span>
              <span>Original Züchtersaatgut</span>
              {schlagName && <span>· Schlag: {schlagName}</span>}
            </div>
            <h2 id="kauf-modal-title" className="text-heading text-fg">
              {variety.name} bestellen
            </h2>
            <div className="flex flex-wrap items-center gap-x-1.5 text-small text-fg-muted">
              <Building2 className="size-4 shrink-0" aria-hidden />
              <span className="font-semibold text-fg">{variety.zuechter || "Züchter unbekannt"}</span>
              <span>·</span>
              <span className="font-semibold tabular-nums text-fg">
                {reifeText}
              </span>
              {variety.korntyp && <span>· {variety.korntyp}</span>}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-touch shrink-0 items-center justify-center rounded-control text-link transition-colors hover:bg-action-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            aria-label="Dialog schließen"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        {/* Modal content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {status === "fertig" ? (
            /* Success view with Spross integration */
            <div className="space-y-6">
              <div className="space-y-2" role="status">
                <h3 className="flex items-start gap-2 text-heading text-fg">
                  <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-status-ok" aria-hidden />
                  {anfrageTyp === "verbindlich"
                    ? "Saatgutanfrage & Händler-Vermittlung aufgenommen!"
                    : "Beratungswunsch erfolgreich übermittelt!"}
                </h3>
                <p className="max-w-measure text-small text-fg-muted">
                  Unser NoMaze-Saatgutteam prüft sofort die Züchterverfügbarkeit für{" "}
                  <strong className="text-fg">{variety.name}</strong> und leitet die Vermittlung
                  an deinen regionalen Saatguthändler ein. Wir melden uns{" "}
                  <span className="font-semibold text-fg">{zeitfenster.toLowerCase()}</span> unter{" "}
                  <span className="font-semibold text-fg">{telefon}</span>.
                </p>
              </div>

              {/* Order summary list */}
              <dl className="divide-y divide-divider border-y border-divider text-small">
                {schlagName && (
                  <div className="flex items-baseline justify-between gap-4 py-2.5">
                    <dt className="text-fg-muted">Schlag</dt>
                    <dd className="text-right font-semibold text-fg">{schlagName}</dd>
                  </div>
                )}
                <div className="flex items-baseline justify-between gap-4 py-2.5">
                  <dt className="text-fg-muted">Gewählte Sorte</dt>
                  <dd className="text-right font-semibold text-fg tabular-nums">{variety.name} ({reifeText})</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 py-2.5">
                  <dt className="text-fg-muted">Menge & Fläche</dt>
                  <dd className="text-right font-semibold text-fg tabular-nums">
                    {einheiten} Einheiten ({num(flaecheHa)} ha)
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 py-2.5">
                  <dt className="text-fg-muted">Beizausstattung</dt>
                  <dd className="text-right font-semibold text-fg">{gewaehlteBeizung.name}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 py-2.5 text-caption text-fg-muted">
                  <dt>Gebindeform:</dt>
                  <dd className="text-right tabular-nums">50.000 Korn / Einheit ({gesamtKoerner.toLocaleString("de-DE")} Körner gesamt)</dd>
                </div>
              </dl>

              {/* Farm memory and Spross confirmation */}
              <div className="flex items-start gap-3">
                <SprossAvatar size={42} mood="freut" className="mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <div className="text-small font-semibold text-fg">
                    Im Hof-Gedächtnis gespeichert
                  </div>
                  <p className="text-small text-fg-muted">
                    Spross weiß jetzt, dass du <strong className="text-fg">{variety.name}</strong> für die kommende
                    Saison einplanst. Deine schlagbezogenen Ertragsprognosen und Tipps werden
                    automatisch darauf abgestimmt.
                  </p>
                </div>
              </div>

              {/* Completion actions */}
              <div className="flex flex-col gap-3 border-t border-divider pt-5 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    if (onCloseAll) onCloseAll();
                    else onClose();
                    router.push("/hof");
                  }}
                  className={buttonClass("primary", "md", "flex-1 cursor-pointer")}
                >
                  <Building2 className="size-4" aria-hidden />
                  Weiter zu Mein Hof
                </button>
                <button
                  type="button"
                  onClick={handleMitSprossSprechen}
                  className={buttonClass("secondary", "md", "cursor-pointer")}
                >
                  <MessageCircle className="size-4" aria-hidden />
                  Mit Spross sprechen
                </button>
              </div>
            </div>
          ) : (
            /* Seed purchase inquiry form */
            <div className="space-y-6">
              {fehler && (
                <p role="alert" className="flex items-start gap-2 text-small font-semibold text-status-urgent-text">
                  <span className="mt-1"><StatusShape status="status-urgent" /></span>
                  <span>{fehler}</span>
                </p>
              )}

              {/* 1. Parcel area and volume calculator */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <label htmlFor="flaeche-input" className="text-subheading text-fg">
                    1. Geplante Anbaufläche
                  </label>
                  <span className="text-small text-fg-muted tabular-nums">
                    Basis: ca. 85.000 Korn/ha
                  </span>
                </div>

                {/* Input with stepper */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      id="flaeche-input"
                      type="number"
                      step="any"
                      min={0.5}
                      max={500}
                      value={flaecheHa}
                      onChange={(e) => handleFlaecheChange(Number(e.target.value))}
                      className={`h-control pr-12 text-lead font-semibold tabular-nums ${FIELD_CLASS}`}
                    />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-small font-semibold text-fg-muted">
                      ha
                    </span>
                  </div>

                  {/* Stepper buttons */}
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => handleFlaecheChange(flaecheHa - 5)}
                      className={`size-control ${STEP_CLASS}`}
                      title="5 ha weniger"
                      aria-label="5 ha abziehen"
                    >
                      <Minus className="size-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFlaecheChange(flaecheHa + 5)}
                      className={`size-control ${STEP_CLASS}`}
                      title="5 ha mehr"
                      aria-label="5 ha hinzufügen"
                    >
                      <Plus className="size-4" aria-hidden />
                    </button>
                  </div>
                </div>

                {/* Range slider */}
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={Math.min(100, flaecheHa)}
                  onChange={(e) => handleFlaecheChange(Number(e.target.value))}
                  className="w-full cursor-pointer accent-action"
                  aria-label="Fläche per Schieberegler anpassen"
                />

                {/* Quick selection as text links */}
                <div className="flex flex-wrap items-center gap-x-1 text-small text-fg-muted">
                  {(initialFlaecheHa && !FLAECHEN_PRESETS.includes(Math.round(initialFlaecheHa))
                    ? [Math.round(initialFlaecheHa * 10) / 10, ...FLAECHEN_PRESETS]
                    : FLAECHEN_PRESETS
                  ).map((p, i) => (
                    <Fragment key={p}>
                      {i > 0 ? <span aria-hidden>·</span> : null}
                      <button
                        type="button"
                        onClick={() => handleFlaecheChange(p)}
                        aria-pressed={flaecheHa === p}
                        className={`inline-flex min-h-touch items-center rounded-control px-1 tabular-nums underline-offset-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
                          flaecheHa === p
                            ? "font-semibold text-fg"
                            : "text-link underline hover:decoration-2"
                        }`}
                      >
                        {num(p)} ha{initialFlaecheHa && p === Math.round(initialFlaecheHa * 10) / 10 ? " (Schlag)" : ""}
                      </button>
                    </Fragment>
                  ))}
                </div>

                {/* Automatically calculated seed requirements */}
                <div className="flex items-center justify-between gap-4 border-y border-divider py-4">
                  <div>
                    <div className="text-small text-fg-muted">
                      Erforderliches Saatgut
                    </div>
                    <div className="text-figure-m tabular-nums text-fg">
                      {einheiten} Einheiten{" "}
                      <span className="text-small font-normal tracking-normal text-fg-muted">à 50.000 Korn</span>
                    </div>
                    <div className="text-small text-fg-muted tabular-nums">
                      ≈ {gesamtKoerner.toLocaleString("de-DE")} Körner gesamt
                    </div>
                  </div>

                  {/* Manual fine-tuning of seed units */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleEinheitenChange(-1)}
                      className={`size-touch text-body font-semibold ${STEP_CLASS}`}
                      title="1 Einheit abziehen"
                      aria-label="Eine Einheit abziehen"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-figure-s tabular-nums text-fg">
                      {einheiten}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleEinheitenChange(1)}
                      className={`size-touch text-body font-semibold ${STEP_CLASS}`}
                      title="1 Einheit hinzufügen"
                      aria-label="Eine Einheit hinzufügen"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Seed dressing options */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <span className="text-subheading text-fg">2. Beizausstattung wählen</span>
                  <span className="flex items-center gap-1 text-small text-fg-muted">
                    <ShieldCheck className="size-4" aria-hidden />
                    Zulassungskonform
                  </span>
                </div>

                <div className="space-y-2">
                  {BEIZUNGEN.map((b) => {
                    const isSelected = beizung === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setBeizung(b.id)}
                        aria-pressed={isSelected}
                        className={optionClass(
                          isSelected,
                          "flex w-full items-start gap-3 p-3.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                        )}
                      >
                        <span className="mt-0.5">
                          <RadioMark checked={isSelected} />
                        </span>

                        <div className="flex-1 space-y-0.5">
                          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                            <span className="text-body font-semibold text-fg">{b.name}</span>
                            <Badge tone={isSelected ? "leaf" : "neutral"}>{b.tag}</Badge>
                          </div>
                          <p className="text-small text-fg-muted">
                            {b.beschreibung}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Contact details and callback options */}
              <div className="space-y-4 border-t border-divider pt-6">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <label htmlFor="kauf-tel-input" className="text-subheading text-fg">
                    3. Deine Telefonnummer für Rückfragen
                  </label>
                  <span className="text-small text-fg-muted">Kostenfrei & unverbindlich</span>
                </div>

                <input
                  id="kauf-tel-input"
                  type="tel"
                  required
                  maxLength={35}
                  value={telefon}
                  onChange={(e) => setTelefon(e.target.value)}
                  placeholder="z. B. 0171 1234567 oder 0521 987654"
                  className={`h-control ${FIELD_CLASS}`}
                />

                <div>
                  <span className="mb-1.5 block text-small font-semibold text-fg">
                    Wann passt dir ein kurzes Abstimmungsgespräch?
                  </span>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {ZEITFENSTER.map((z) => (
                      <button
                        key={z}
                        type="button"
                        onClick={() => setZeitfenster(z)}
                        aria-pressed={zeitfenster === z}
                        className={segmentClass(
                          zeitfenster === z,
                          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                        )}
                      >
                        {z}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  rows={2}
                  maxLength={400}
                  value={notiz}
                  onChange={(e) => setNotiz(e.target.value)}
                  placeholder="Optional: Wunsch-Lieferzeitpunkt, Schlagname oder Notiz"
                  className={`resize-none py-3 ${FIELD_CLASS}`}
                />
              </div>

              {/* 4. Submission action buttons */}
              <div className="space-y-3 border-t border-divider pt-6">
                <button
                  type="button"
                  disabled={status === "sendet"}
                  onClick={() => handleAbsenden("verbindlich")}
                  className={wideButtonClass("primary")}
                >
                  {status === "sendet" && anfrageTyp === "verbindlich" ? (
                    <>
                      <Loader2 className="size-5 motion-safe:animate-spin" aria-hidden />
                      <span>Übermittle Saatgutanfrage...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-5" aria-hidden />
                      <span>Saatgut verbindlich anfragen / bestellen</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-3 text-small text-fg-muted">
                  <span className="h-px flex-1 bg-divider" />
                  <span>oder direkt beraten lassen</span>
                  <span className="h-px flex-1 bg-divider" />
                </div>

                <button
                  type="button"
                  disabled={status === "sendet"}
                  onClick={() => handleAbsenden("beratung")}
                  className={wideButtonClass("secondary")}
                >
                  {status === "sendet" && anfrageTyp === "beratung" ? (
                    <>
                      <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden />
                      <span>Fordere Rückruf an...</span>
                    </>
                  ) : (
                    <>
                      <Phone className="size-4" aria-hidden />
                      <span className="tabular-nums">Jetzt mit NoMaze-Saatgutteam sprechen ({TEAM.telefonAnzeige})</span>
                    </>
                  )}
                </button>

                <p className="text-caption text-fg-muted">
                  🌱 Verbindliche Kontingent-Reservierung vorbehaltlich Züchter-Verfügbarkeit.
                  Dein Anbauwunsch wird automatisch in Spross hinterlegt.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
