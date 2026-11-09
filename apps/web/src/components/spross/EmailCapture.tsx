"use client";

import Link from "next/link";
import { useState } from "react";
import { useDemo } from "@/components/shell/DemoContext";
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
    <div className="mb-6 flex animate-rise items-start gap-3">
      <SprossAvatar size={44} mood={zustand === "fertig" ? "freut" : "ruhig"} className="mt-1 shrink-0" />
      <div className="flex-1 rounded-2xl rounded-tl-md bg-white/95 p-4 shadow-soft ring-1 ring-leaf-200">
        {zustand === "fertig" ? (
          <>
            <p className="font-medium">Danke! Dein Ranking ist gespeichert.</p>
            <p className="mt-1 text-sm text-muted">
              Wir haben dir einen Code an {email} geschickt. Damit meldest du dich auf jedem Gerät an.
            </p>
            {devCode ? <p className="mt-2 text-xs text-muted">Demo ohne Mailversand: Dein Code ist {devCode}.</p> : null}
          </>
        ) : zustand === "bekannt" ? (
          <>
            <p className="font-medium">Diese E-Mail kennen wir schon.</p>
            <p className="mt-1 text-sm text-muted">
              Melde dich mit dem Code aus der Mail an, dann siehst du alle deine Felder.{" "}
              <Link href={`/anmelden?email=${encodeURIComponent(email)}`} className="font-semibold text-leaf-700 hover:underline">
                Code eingeben
              </Link>
            </p>
            {devCode ? <p className="mt-2 text-xs text-muted">Demo ohne Mailversand: Dein Code ist {devCode}.</p> : null}
          </>
        ) : (
          <form onSubmit={senden}>
            <p className="font-medium">Soll ich dir das Ranking schicken?</p>
            <p className="mt-0.5 text-sm text-muted">Dann findest du es jederzeit wieder, auch auf dem Handy. Nur deine E-Mail, sonst nichts.</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="deine@email.de"
                aria-label="E-Mail-Adresse"
                className="h-11 w-full min-w-0 rounded-full bg-white px-4 text-base ring-1 ring-line outline-none focus:ring-2 focus:ring-leaf-400 sm:flex-1"
              />
              <button type="submit" disabled={zustand === "sendet"} className="h-11 rounded-full bg-leaf-600 px-5 text-sm font-semibold text-white disabled:opacity-50">
                Schicken
              </button>
            </div>
            {fehler ? <p className="mt-2 text-sm text-[#8a2a18]">{fehler}</p> : null}
            <button type="button" onClick={() => setZustand("spaeter")} className="mt-2 text-xs font-medium text-muted hover:text-ink">
              Später
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
