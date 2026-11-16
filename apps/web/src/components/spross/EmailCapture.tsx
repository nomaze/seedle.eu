"use client";

import Link from "next/link";
import { useState } from "react";
import { useDemo } from "@/components/shell/DemoContext";
import { buttonClass } from "@/components/ui/Button";
import { SprossAvatar } from "./SprossAvatar";

/**
 * Progressive in-flow signup banner: prompts for email when variety ranking is generated.
 * Ranking data remains visible regardless of user action.
 */
export function EmailCapture() {
  const { anmeldung } = useDemo();
  const [email, setEmail] = useState("");
  const [zustand, setZustand] = useState<"frage" | "sendet" | "fertig" | "bekannt" | "spaeter">("frage");
  const [devCode, setDevCode] = useState<string | undefined>();
  const [fehler, setFehler] = useState<string | null>(null);

  if (!anmeldung || zustand === "spaeter") return null;

  async function senden(e: React.FormEvent) {
    e.preventDefault();
    setZustand("sendet");
    setFehler(null);
    const res = await fetch("/api/v1/auth/code", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setFehler(data.fehler ?? "Das hat nicht geklappt.");
      setZustand("frage");
      return;
    }
    setDevCode(data.devCode);
    setZustand(data.login ? "bekannt" : "fertig");
  }

  return (
    <div className="mb-8 flex items-start gap-4 border-y border-divider py-6">
      <SprossAvatar size={44} mood={zustand === "fertig" ? "freut" : "ruhig"} className="shrink-0" />
      <div className="min-w-0 max-w-measure flex-1">
        {zustand === "fertig" ? (
          <>
            <p className="text-subheading text-fg">Danke! Dein Ranking ist gespeichert.</p>
            <p className="mt-1 text-fg-muted">
              Wir haben dir einen Code an {email} geschickt. Damit meldest du dich auf jedem Gerät an.
            </p>
            {devCode ? <p className="mt-2 text-caption text-fg-muted">Demo ohne Mailversand: Dein Code ist {devCode}.</p> : null}
          </>
        ) : zustand === "bekannt" ? (
          <>
            <p className="text-subheading text-fg">Diese E-Mail kennen wir schon.</p>
            <p className="mt-1 text-fg-muted">
              Melde dich mit dem Code aus der Mail an, dann siehst du alle deine Felder.{" "}
              <Link
                href={`/anmelden?email=${encodeURIComponent(email)}`}
                className="font-semibold text-link underline decoration-link/40 underline-offset-4 hover:decoration-link"
              >
                Code eingeben
              </Link>
            </p>
            {devCode ? <p className="mt-2 text-caption text-fg-muted">Demo ohne Mailversand: Dein Code ist {devCode}.</p> : null}
          </>
        ) : (
          <form onSubmit={senden}>
            <p className="text-subheading text-fg">Soll ich dir das Ranking schicken?</p>
            <p className="mt-1 text-fg-muted">Dann findest du es jederzeit wieder, auch auf dem Handy. Nur deine E-Mail, sonst nichts.</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="deine@email.de"
                aria-label="E-Mail-Adresse"
                className="h-control w-full min-w-0 rounded-control border border-control bg-surface px-3 text-body text-fg placeholder:text-fg-muted sm:flex-1"
              />
              <button type="submit" disabled={zustand === "sendet"} className={buttonClass("primary")}>
                Schicken
              </button>
            </div>
            {fehler ? <p className="mt-2 text-small font-semibold text-status-urgent-text">{fehler}</p> : null}
            <button type="button" onClick={() => setZustand("spaeter")} className={buttonClass("quiet", "sm", "mt-2 -ml-4")}>
              Später
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
