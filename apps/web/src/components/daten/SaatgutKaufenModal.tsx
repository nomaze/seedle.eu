"use client";

import {
  Building2,
  Check,
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
import { useEffect, useState } from "react";
import { useDemo } from "@/components/shell/DemoContext";
import { useSpross } from "@/components/spross/SprossContext";
import { SprossAvatar } from "@/components/spross/SprossAvatar";
import { Badge } from "@/components/ui/Badge";
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
  const [telefon, setTelefon] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("nomaze_telefon") || "";
      } catch {
        return "";
      }
    }
    return "";
  });
  const [zeitfenster, setZeitfenster] = useState<string>(ZEITFENSTER[0]);
  const [notiz, setNotiz] = useState<string>("");

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="kauf-modal-title"
        className="relative z-10 flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-lift ring-1 ring-line animate-rise"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-line bg-gradient-to-r from-leaf-50/90 via-sand-100/60 to-white p-5 sm:p-6">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-leaf-800">
                <ShoppingBag className="size-3.5 text-leaf-700" />
                NoMaze Saatgutservice · Händler-Vermittlung
              </span>
              <Badge tone="leaf">Original Züchtersaatgut</Badge>
              {schlagName && (
                <span className="rounded-full bg-leaf-100 px-2.5 py-0.5 text-xs font-semibold text-leaf-900 ring-1 ring-leaf-300">
                  Schlag: {schlagName}
                </span>
              )}
            </div>
            <h2 id="kauf-modal-title" className="text-2xl font-bold text-ink sm:text-3xl">
              {variety.name} bestellen
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
              <Building2 className="size-3.5 text-muted" />
              <span className="font-medium text-ink">{variety.zuechter || "Züchter unbekannt"}</span>
              <span>·</span>
              <span className="rounded bg-leaf-100/80 px-1.5 py-0.5 font-bold text-leaf-900">
                {reifeText}
              </span>
              {variety.korntyp && <span>· {variety.korntyp}</span>}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted transition hover:bg-white hover:text-ink hover:shadow-sm"
            aria-label="Dialog schließen"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 sm:p-6">
          {status === "fertig" ? (
            /* Success view with Spross integration */
            <div className="space-y-6 py-2 text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-leaf-100 text-leaf-700 ring-8 ring-leaf-50">
                <CheckCircle2 className="size-10" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-ink">
                  {anfrageTyp === "verbindlich"
                    ? "Saatgutanfrage & Händler-Vermittlung aufgenommen!"
                    : "Beratungswunsch erfolgreich übermittelt!"}
                </h3>
                <p className="text-sm text-muted max-w-md mx-auto">
                  Unser NoMaze-Saatgutteam prüft sofort die Züchterverfügbarkeit für{" "}
                  <strong className="text-ink">{variety.name}</strong> und leitet die Vermittlung
                  an deinen regionalen Saatguthändler ein. Wir melden uns{" "}
                  <span className="font-semibold text-ink">{zeitfenster.toLowerCase()}</span> unter{" "}
                  <span className="font-semibold text-ink">{telefon}</span>.
                </p>
              </div>

              {/* Order summary card */}
              <div className="rounded-2xl bg-sand-50 p-4 text-left ring-1 ring-line text-sm space-y-2">
                {schlagName && (
                  <div className="flex justify-between items-center border-b border-line pb-2">
                    <span className="text-muted">Schlag</span>
                    <span className="font-bold text-ink">{schlagName}</span>
                  </div>
                )}
                <div className="flex justify-between items-center border-b border-line pb-2">
                  <span className="text-muted">Gewählte Sorte</span>
                  <span className="font-bold text-ink">{variety.name} ({reifeText})</span>
                </div>
                <div className="flex justify-between items-center border-b border-line pb-2">
                  <span className="text-muted">Menge & Fläche</span>
                  <span className="font-bold text-leaf-800">
                    {einheiten} Einheiten ({num(flaecheHa)} ha)
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-line pb-2">
                  <span className="text-muted">Beizausstattung</span>
                  <span className="font-medium text-ink">{gewaehlteBeizung.name}</span>
                </div>
                <div className="flex justify-between items-center pt-1 text-xs text-muted">
                  <span>Gebindeform:</span>
                  <span>50.000 Korn / Einheit ({gesamtKoerner.toLocaleString("de-DE")} Körner gesamt)</span>
                </div>
              </div>

              {/* Farm memory and Spross confirmation */}
              <div className="rounded-2xl bg-gradient-to-br from-leaf-50 via-white to-leaf-100/40 p-4 ring-1 ring-leaf-200 text-left">
                <div className="flex items-start gap-3">
                  <SprossAvatar size={42} mood="freut" className="shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="text-xs font-bold uppercase tracking-wider text-leaf-800">
                      Im Hof-Gedächtnis gespeichert
                    </div>
                    <p className="text-xs text-ink/90 leading-relaxed">
                      Spross weiß jetzt, dass du <strong>{variety.name}</strong> für die kommende
                      Saison einplanst. Deine schlagbezogenen Ertragsprognosen und Tipps werden
                      automatisch darauf abgestimmt.
                    </p>
                  </div>
                </div>
              </div>

              {/* Completion actions */}
              <div className="flex flex-col gap-2.5 sm:flex-row pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onCloseAll) onCloseAll();
                    else onClose();
                    router.push("/hof");
                  }}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-leaf-600 px-5 py-3 font-semibold text-white shadow-lift transition hover:bg-leaf-700 cursor-pointer"
                >
                  <Building2 className="size-4" />
                  Weiter zu Mein Hof
                </button>
                <button
                  type="button"
                  onClick={handleMitSprossSprechen}
                  className="rounded-full px-5 py-3 font-semibold text-muted ring-1 ring-line hover:bg-sand-100 hover:text-ink transition cursor-pointer"
                >
                  <MessageCircle className="size-4" />
                  Mit Spross sprechen
                </button>
              </div>
            </div>
          ) : (
            /* Seed purchase inquiry form */
            <div className="space-y-6">
              {fehler && (
                <div className="rounded-2xl bg-poppy-soft/60 p-4 text-xs font-semibold text-poppy ring-1 ring-poppy/30">
                  {fehler}
                </div>
              )}

              {/* 1. Parcel area and volume calculator */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="flaeche-input" className="text-sm font-bold text-ink">
                    1. Geplante Anbaufläche
                  </label>
                  <span className="text-xs text-muted">
                    Basis: ca. 85.000 Korn/ha
                  </span>
                </div>

                {/* Input with stepper */}
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      id="flaeche-input"
                      type="number"
                      step="any"
                      min={0.5}
                      max={500}
                      value={flaecheHa}
                      onChange={(e) => handleFlaecheChange(Number(e.target.value))}
                      className="h-12 w-full rounded-2xl bg-sand-50 px-4 pr-12 text-lg font-bold text-ink ring-1 ring-line outline-none focus:ring-2 focus:ring-leaf-500"
                    />
                    <span className="pointer-events-none absolute right-4 top-3 text-sm font-bold text-muted">
                      ha
                    </span>
                  </div>

                  {/* Stepper buttons */}
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleFlaecheChange(flaecheHa - 5)}
                      className="flex size-12 items-center justify-center rounded-2xl bg-sand-100 font-bold text-ink ring-1 ring-line hover:bg-sand-200 transition"
                      title="5 ha weniger"
                      aria-label="5 ha abziehen"
                    >
                      <Minus className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFlaecheChange(flaecheHa + 5)}
                      className="flex size-12 items-center justify-center rounded-2xl bg-sand-100 font-bold text-ink ring-1 ring-line hover:bg-sand-200 transition"
                      title="5 ha mehr"
                      aria-label="5 ha hinzufügen"
                    >
                      <Plus className="size-4" />
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
                  className="w-full accent-leaf-600 cursor-pointer"
                  aria-label="Fläche per Schieberegler anpassen"
                />

                {/* Quick-selection chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(initialFlaecheHa && !FLAECHEN_PRESETS.includes(Math.round(initialFlaecheHa))
                    ? [Math.round(initialFlaecheHa * 10) / 10, ...FLAECHEN_PRESETS]
                    : FLAECHEN_PRESETS
                  ).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleFlaecheChange(p)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ring-1 ${
                        flaecheHa === p
                          ? "bg-leaf-700 text-white ring-leaf-700 shadow-sm"
                          : "bg-white text-muted ring-line hover:text-ink hover:ring-leaf-300"
                      }`}
                    >
                      {num(p)} ha{initialFlaecheHa && p === Math.round(initialFlaecheHa * 10) / 10 ? " (Schlag)" : ""}
                    </button>
                  ))}
                </div>

                {/* Automatically calculated seed requirements */}
                <div className="mt-2 flex items-center justify-between rounded-2xl bg-leaf-50/80 p-4 ring-1 ring-leaf-200">
                  <div>
                    <div className="text-xs font-semibold uppercase text-leaf-800">
                      Erforderliches Saatgut
                    </div>
                    <div className="text-xl font-bold text-ink">
                      {einheiten} Einheiten{" "}
                      <span className="text-xs font-normal text-muted">à 50.000 Korn</span>
                    </div>
                    <div className="text-xs text-muted">
                      ≈ {gesamtKoerner.toLocaleString("de-DE")} Körner gesamt
                    </div>
                  </div>

                  {/* Manual fine-tuning of seed units */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleEinheitenChange(-1)}
                      className="flex size-8 items-center justify-center rounded-full bg-white text-ink shadow-sm ring-1 ring-line hover:bg-leaf-100 transition text-sm font-bold"
                      title="1 Einheit abziehen"
                      aria-label="Eine Einheit abziehen"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm font-bold tabular text-ink">
                      {einheiten}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleEinheitenChange(1)}
                      className="flex size-8 items-center justify-center rounded-full bg-white text-ink shadow-sm ring-1 ring-line hover:bg-leaf-100 transition text-sm font-bold"
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
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-ink">2. Beizausstattung wählen</span>
                  <span className="text-xs text-leaf-800 font-semibold flex items-center gap-1">
                    <ShieldCheck className="size-3.5 text-leaf-600" />
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
                        className={`w-full rounded-2xl p-3.5 text-left transition ring-1 flex items-start gap-3 ${
                          isSelected
                            ? "bg-leaf-50/70 ring-2 ring-leaf-600 shadow-sm"
                            : "bg-white ring-line hover:ring-leaf-300"
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ring-1 ${
                            isSelected
                              ? "bg-leaf-600 text-white ring-leaf-600"
                              : "bg-white ring-line"
                          }`}
                        >
                          {isSelected && <Check className="size-3.5 stroke-[3]" />}
                        </div>

                        <div className="flex-1 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-ink">{b.name}</span>
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                isSelected
                                  ? "bg-leaf-200 text-leaf-900"
                                  : "bg-sand-200 text-muted"
                              }`}
                            >
                              {b.tag}
                            </span>
                          </div>
                          <p className="text-xs text-muted leading-relaxed">
                            {b.beschreibung}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Contact details and callback options */}
              <div className="space-y-3 rounded-2xl bg-sand-50 p-4 ring-1 ring-line">
                <div className="flex items-center justify-between">
                  <label htmlFor="kauf-tel-input" className="text-sm font-bold text-ink">
                    3. Deine Telefonnummer für Rückfragen
                  </label>
                  <span className="text-xs text-muted">Kostenfrei & unverbindlich</span>
                </div>

                <input
                  id="kauf-tel-input"
                  type="tel"
                  required
                  maxLength={35}
                  value={telefon}
                  onChange={(e) => setTelefon(e.target.value)}
                  placeholder="z. B. 0171 1234567 oder 0521 987654"
                  className="h-12 w-full rounded-xl bg-white px-4 text-base ring-1 ring-line outline-none focus:ring-2 focus:ring-leaf-500"
                />

                <div>
                  <span className="text-xs font-semibold text-muted block mb-1.5">
                    Wann passt dir ein kurzes Abstimmungsgespräch?
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {ZEITFENSTER.map((z) => (
                      <button
                        key={z}
                        type="button"
                        onClick={() => setZeitfenster(z)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition ring-1 ${
                          zeitfenster === z
                            ? "bg-leaf-800 text-white ring-leaf-800"
                            : "bg-white text-ink ring-line hover:ring-leaf-300"
                        }`}
                      >
                        {z}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-1">
                  <textarea
                    rows={2}
                    maxLength={400}
                    value={notiz}
                    onChange={(e) => setNotiz(e.target.value)}
                    placeholder="Optional: Wunsch-Lieferzeitpunkt, Schlagname oder Notiz"
                    className="w-full rounded-xl bg-white px-3 py-2 text-xs ring-1 ring-line outline-none focus:ring-2 focus:ring-leaf-500 resize-none"
                  />
                </div>
              </div>

              {/* 4. Submission action buttons */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  disabled={status === "sendet"}
                  onClick={() => handleAbsenden("verbindlich")}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-leaf-600 px-6 text-base font-bold text-white shadow-lift transition hover:bg-leaf-700 active:bg-leaf-800 disabled:opacity-50 cursor-pointer"
                >
                  {status === "sendet" && anfrageTyp === "verbindlich" ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      <span>Übermittle Saatgutanfrage...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-5" />
                      <span>Saatgut verbindlich anfragen / bestellen</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-3 text-xs text-muted justify-center">
                  <span className="h-px flex-1 bg-line" />
                  <span>oder direkt beraten lassen</span>
                  <span className="h-px flex-1 bg-line" />
                </div>

                <button
                  type="button"
                  disabled={status === "sendet"}
                  onClick={() => handleAbsenden("beratung")}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-ink ring-1 ring-line transition hover:bg-sand-100 hover:ring-leaf-300 disabled:opacity-50 cursor-pointer"
                >
                  {status === "sendet" && anfrageTyp === "beratung" ? (
                    <>
                      <Loader2 className="size-4 animate-spin text-leaf-800" />
                      <span>Fordere Rückruf an...</span>
                    </>
                  ) : (
                    <>
                      <Phone className="size-4 text-leaf-800" />
                      <span>Jetzt mit NoMaze-Saatgutteam sprechen ({TEAM.telefonAnzeige})</span>
                    </>
                  )}
                </button>

                <p className="text-center text-[11px] text-muted">
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
