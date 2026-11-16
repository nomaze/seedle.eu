"use client";

import { Check, Phone } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { buttonClass } from "@/components/ui/Button";
import { segmentClass } from "@/components/ui/Choice";
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
      icon={<Phone className="size-6 shrink-0 text-link" strokeWidth={1.8} aria-hidden />}
      titel={`Sprich mit dem ${TEAM.name}`}
      untertitel="Menschen aus Landwirtschaft und Züchtung"
    >
      <div className="space-y-6 px-5 py-6">
        <div>
          <a
            href={TEAM.telefonLink}
            className={buttonClass("primary", "md", "w-full tabular-nums")}
          >
            <Phone className="size-5" aria-hidden /> {TEAM.telefonAnzeige}
          </a>
          <p className="mt-2 text-center text-small text-fg-muted">{TEAM.erreichbar}</p>
        </div>

        <div className="flex items-center gap-3 text-small text-fg-muted">
          <span className="h-px flex-1 bg-divider" /> oder <span className="h-px flex-1 bg-divider" />
        </div>

        {status === "fertig" ? (
          <div className="border-t border-divider pt-5" role="status">
            <p className="flex items-center gap-2 text-subheading text-fg">
              <Check className="size-5 shrink-0 text-status-ok" aria-hidden />
              Wir rufen dich an: {zeit.toLowerCase()}.
            </p>
            <p className="mt-1 text-small text-fg-muted">Bis gleich!</p>
          </div>
        ) : (
          <form onSubmit={absenden} className="space-y-4">
            <div className="text-subheading text-fg">Wir rufen dich zurück</div>
            <label className="block">
              <span className="text-small font-semibold text-fg">Deine Telefonnummer</span>
              <input
                type="tel"
                required
                value={telefon}
                onChange={(e) => setTelefon(e.target.value)}
                placeholder="z. B. 0171 1234567"
                className="h-control mt-1.5 w-full rounded-control border border-control bg-surface px-4 text-body text-fg outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              />
            </label>
            <fieldset>
              <legend className="text-small font-semibold text-fg">Wann passt es dir?</legend>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                {ZEITFENSTER.map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => setZeit(z)}
                    aria-pressed={zeit === z}
                    className={segmentClass(zeit === z, "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus")}
                  >
                    {z}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="block">
              <span className="text-small font-semibold text-fg">Worum geht es? (freiwillig)</span>
              <textarea
                value={anliegen}
                onChange={(e) => setAnliegen(e.target.value)}
                rows={2}
                className="py-3 mt-1.5 w-full rounded-control border border-control bg-surface px-4 text-body text-fg outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              />
            </label>
            {fehler ? <p className="text-small font-semibold text-status-urgent-text">{fehler}</p> : null}
            <button
              type="submit"
              disabled={status === "sendet"}
              className={buttonClass("secondary", "md", "w-full")}
            >
              Rückruf anfordern
            </button>
          </form>
        )}
      </div>
    </Sheet>
  );
}
