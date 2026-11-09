"use client";

import { Check, Phone } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { TEAM } from "@/lib/team";
import { Sheet } from "./Sheet";
import { useOverlays } from "./Overlays";

const ZEITFENSTER = ["Heute Vormittag", "Heute Nachmittag", "Morgen früh", "Wann es passt"];

/** Personal team contact modal: call directly or request an advisory callback. */
export function CallSheet() {
  const { offen, schliesse } = useOverlays();
  const pathname = usePathname();
  const [telefon, setTelefon] = useState("");
  const [zeit, setZeit] = useState(ZEITFENSTER[0]!);
  const [anliegen, setAnliegen] = useState("");
  const [status, setStatus] = useState<"offen" | "sendet" | "fertig">("offen");
  const [fehler, setFehler] = useState<string | null>(null);

  async function absenden(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sendet");
    setFehler(null);
    const res = await fetch("/api/v1/callbacks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ telefon, zeitfenster: zeit, anliegen, seite: pathname }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok) setStatus("fertig");
    else {
      setFehler(data.fehler ?? "Das hat nicht geklappt. Ruf uns gern direkt an.");
      setStatus("offen");
    }
  }

  return (
    <Sheet
      offen={offen === "anruf"}
      onClose={schliesse}
      lage="mitte"
      icon={
        <span className="flex size-11 items-center justify-center rounded-full bg-leaf-100 text-leaf-800">
          <Phone className="size-5" />
        </span>
      }
      titel={`Sprich mit dem ${TEAM.name}`}
      untertitel="Menschen aus Landwirtschaft und Züchtung"
    >
      <div className="space-y-6 px-5 py-6">
        <div>
          <a
            href={TEAM.telefonLink}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-leaf-800 text-lg font-semibold text-white shadow-soft hover:bg-leaf-900"
          >
            <Phone className="size-5" /> {TEAM.telefonAnzeige}
          </a>
          <p className="mt-2 text-center text-sm text-muted">{TEAM.erreichbar}</p>
        </div>

        <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-muted">
          <span className="h-px flex-1 bg-line" /> oder <span className="h-px flex-1 bg-line" />
        </div>

        {status === "fertig" ? (
          <div className="rounded-2xl bg-leaf-50 p-5 text-center ring-1 ring-leaf-200">
            <Check className="mx-auto size-8 text-leaf-600" />
            <p className="mt-2 font-semibold text-ink">Wir rufen dich an: {zeit.toLowerCase()}.</p>
            <p className="mt-1 text-sm text-muted">Bis gleich!</p>
          </div>
        ) : (
          <form onSubmit={absenden} className="space-y-4">
            <div className="font-semibold text-ink">Wir rufen dich zurück</div>
            <label className="block">
              <span className="text-sm text-muted">Deine Telefonnummer</span>
              <input
                type="tel"
                required
                value={telefon}
                onChange={(e) => setTelefon(e.target.value)}
                placeholder="z. B. 0171 1234567"
                className="mt-1 h-12 w-full rounded-xl bg-white px-4 text-base ring-1 ring-line outline-none focus:ring-2 focus:ring-leaf-500"
              />
            </label>
            <fieldset>
              <legend className="text-sm text-muted">Wann passt es dir?</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {ZEITFENSTER.map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => setZeit(z)}
                    aria-pressed={zeit === z}
                    className={`rounded-full px-3.5 py-2 text-sm font-medium ring-1 transition ${
                      zeit === z ? "bg-leaf-800 text-white ring-leaf-800" : "bg-white text-ink ring-line hover:ring-leaf-300"
                    }`}
                  >
                    {z}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="block">
              <span className="text-sm text-muted">Worum geht es? (freiwillig)</span>
              <textarea
                value={anliegen}
                onChange={(e) => setAnliegen(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-xl bg-white px-4 py-3 text-base ring-1 ring-line outline-none focus:ring-2 focus:ring-leaf-500"
              />
            </label>
            {fehler ? <p className="text-sm text-[#8a2a18]">{fehler}</p> : null}
            <button
              type="submit"
              disabled={status === "sendet"}
              className="h-12 w-full rounded-full bg-white font-semibold text-leaf-800 ring-1 ring-leaf-300 hover:bg-sand-100 disabled:opacity-50"
            >
              Rückruf anfordern
            </button>
          </form>
        )}
      </div>
    </Sheet>
  );
}
