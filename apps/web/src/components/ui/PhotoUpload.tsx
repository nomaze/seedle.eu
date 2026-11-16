"use client";

import { Camera, Check, ImagePlus, Phone } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useDemo } from "../shell/DemoContext";
import { useOverlays } from "../shell/Overlays";
import { Badge } from "./Badge";
import { Button, buttonClass } from "./Button";

interface Befund {
  titel: string;
  text: string;
  empfehlung: string;
  sicherheit: number;
  kategorie: "gesund" | "beobachten" | "handeln";
  demo: boolean;
}

const TON = { gesund: "leaf", beobachten: "bee", handeln: "poppy" } as const;
const LABEL = { gesund: "Alles gut", beobachten: "Beobachten", handeln: "Mit dem Team besprechen" };

/** In-field photo observation: capture or select, upload, and review agronomic diagnosis. */
export function PhotoUpload({ fieldId, anleitung }: { fieldId: string; anleitung: string }) {
  const { oeffne } = useOverlays();
  const { teamAnruf } = useDemo();
  const [datei, setDatei] = useState<File | null>(null);
  const [vorschau, setVorschau] = useState<string | null>(null);
  const [notiz, setNotiz] = useState("");
  const [busy, setBusy] = useState(false);
  const [befund, setBefund] = useState<Befund | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);

  function waehle(f: File | undefined) {
    if (!f) return;
    setDatei(f);
    setBefund(null);
    setVorschau(URL.createObjectURL(f));
  }

  async function hochladen() {
    if (!datei) return;
    setBusy(true);
    setFehler(null);
    const fd = new FormData();
    fd.append("foto", datei);
    if (notiz.trim()) fd.append("notiz", notiz.trim());
    const res = await fetch(`/api/v1/fields/${fieldId}/photos`, { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setFehler(data.fehler ?? "Das Foto konnte nicht hochgeladen werden.");
    setBefund(data.befund);
  }

  function nochEins() {
    setDatei(null);
    setVorschau(null);
    setNotiz("");
    setBefund(null);
  }

  return (
    <div className="max-w-measure space-y-6">
      <label className="flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-panel border-2 border-dashed border-control bg-surface text-center transition-colors hover:bg-highlight">
        {vorschau ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={vorschau} alt="Vorschau" className="max-h-80 w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-2 px-6 py-12">
            <Camera className="size-8 text-link" strokeWidth={1.8} aria-hidden />
            <span className="text-subheading text-fg">Foto machen oder auswählen</span>
            <span className="max-w-sm text-small text-fg-muted">{anleitung}</span>
          </span>
        )}
        <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => waehle(e.target.files?.[0])} />
      </label>

      {datei && !befund ? (
        <div className="space-y-4">
          <label className="block">
            <span className="block text-body font-semibold text-fg">Was siehst du? (freiwillig)</span>
            <textarea
              value={notiz}
              onChange={(e) => setNotiz(e.target.value)}
              rows={2}
              placeholder="z. B. Flecken an den unteren Blättern"
              className="mt-2 w-full rounded-control border border-control bg-surface px-3 py-2.5 text-body text-fg"
            />
          </label>
          {fehler ? <p className="text-small font-semibold text-status-urgent-text">{fehler}</p> : null}
          <div className="flex flex-wrap gap-3">
            <Button onClick={hochladen} disabled={busy}>
              <ImagePlus className="size-5" aria-hidden /> {busy ? "Wird angeschaut …" : "Foto auswerten"}
            </Button>
            <Button variant="quiet" onClick={nochEins}>
              Anderes Foto
            </Button>
          </div>
        </div>
      ) : null}

      {befund ? (
        <section className="border-t border-divider pt-6">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <Badge tone={TON[befund.kategorie]}>{LABEL[befund.kategorie]}</Badge>
            <span className="text-caption text-fg-muted tabular-nums">
              {Math.round(befund.sicherheit * 100)} % sicher{befund.demo ? " · Demo-Auswertung" : ""}
            </span>
          </div>
          <h2 className="mt-2 text-heading text-fg">{befund.titel}</h2>
          <p className="mt-2 text-body text-fg-muted">{befund.text}</p>
          <p className="mt-4 flex gap-2 font-semibold text-fg">
            <Check className="mt-0.5 size-5 shrink-0 text-link" aria-hidden /> {befund.empfehlung}
          </p>
          {befund.kategorie === "handeln" && teamAnruf ? (
            <button type="button" onClick={() => oeffne("anruf")} className={`${buttonClass("primary", "sm")} mt-4`}>
              <Phone className="size-4" aria-hidden /> NoMaze-Team anrufen
            </button>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3 border-t border-divider pt-4">
            <Button variant="secondary" size="sm" onClick={nochEins}>
              Noch ein Foto
            </Button>
            <Link href={`/heute?feld=${fieldId}`} className={buttonClass("quiet", "sm")}>
              Zurück zu „Dein Feld heute“
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
