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
    <div className="space-y-4">
      <label className="flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-card border-2 border-dashed border-leaf-300 bg-white/85 text-center transition hover:bg-leaf-50">
        {vorschau ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={vorschau} alt="Vorschau" className="max-h-80 w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-2 px-6 py-12">
            <span className="flex size-16 items-center justify-center rounded-full bg-leaf-50 text-leaf-700">
              <Camera className="size-7" />
            </span>
            <span className="text-lg font-semibold">Foto machen oder auswählen</span>
            <span className="max-w-sm text-sm text-muted">{anleitung}</span>
          </span>
        )}
        <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => waehle(e.target.files?.[0])} />
      </label>

      {datei && !befund ? (
        <div className="space-y-3">
          <label className="block">
            <span className="text-sm text-muted">Was siehst du? (freiwillig)</span>
            <textarea
              value={notiz}
              onChange={(e) => setNotiz(e.target.value)}
              rows={2}
              placeholder="z. B. Flecken an den unteren Blättern"
              className="mt-1 w-full rounded-xl bg-white px-4 py-3 text-base ring-1 ring-line outline-none focus:ring-2 focus:ring-leaf-400"
            />
          </label>
          {fehler ? <p className="text-sm text-[#8a2a18]">{fehler}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button onClick={hochladen} disabled={busy}>
              <ImagePlus className="size-5" /> {busy ? "Wird angeschaut …" : "Foto auswerten"}
            </Button>
            <Button variant="quiet" onClick={nochEins}>
              Anderes Foto
            </Button>
          </div>
        </div>
      ) : null}

      {befund ? (
        <section className="animate-rise rounded-card bg-white/95 p-5 shadow-soft ring-1 ring-line">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={TON[befund.kategorie]}>{LABEL[befund.kategorie]}</Badge>
            <span className="text-xs text-muted">
              {Math.round(befund.sicherheit * 100)} % sicher{befund.demo ? " · Demo-Auswertung" : ""}
            </span>
          </div>
          <h2 className="mt-2 text-xl font-semibold">{befund.titel}</h2>
          <p className="mt-1 text-muted">{befund.text}</p>
          <p className="mt-3 flex gap-2 font-medium">
            <Check className="mt-0.5 size-5 shrink-0 text-leaf-600" /> {befund.empfehlung}
          </p>
          {befund.kategorie === "handeln" && teamAnruf ? (
            <button type="button" onClick={() => oeffne("anruf")} className={`${buttonClass("primary", "sm")} mt-4`}>
              <Phone className="size-4" /> NoMaze-Team anrufen
            </button>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
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
