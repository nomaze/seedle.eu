"use client";

import { Check, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { buttonClass } from "./Button";

interface Option {
  id: string;
  name: string;
  zuechter: string;
  reifezahl: number;
}

export function PreviousVarietyPicker({
  fieldId,
  optionen,
}: {
  fieldId: string;
  optionen: Option[];
  action?: unknown;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const treffer = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [];
    return optionen.filter((o) => o.name.toLowerCase().includes(s) || o.zuechter.toLowerCase().includes(s)).slice(0, 5);
  }, [q, optionen]);

  const select = (varietyId?: string, text?: string) => {
    const params = new URLSearchParams();
    if (varietyId) params.set("bisher", varietyId);
    if (text) params.set("bisherText", text);
    const qs = params.toString();
    router.push(`/feld/${fieldId}/ranking${qs ? `?${qs}` : ""}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-2xl bg-white px-4 shadow-soft ring-1 ring-line focus-within:ring-2 focus-within:ring-leaf-400">
        <Search className="size-5 shrink-0 text-muted" aria-hidden />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Sortenname, z. B. Kontinent"
          aria-label="Sorte suchen"
          autoFocus
          className="h-14 min-w-0 flex-1 bg-transparent text-lg outline-none"
        />
      </div>

      {treffer.length > 0 ? (
        <ul className="space-y-2">
          {treffer.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => select(o.id)}
                className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white/92 px-4 py-3.5 text-left ring-1 ring-line transition hover:ring-leaf-300"
              >
                <span>
                  <span className="font-semibold">{o.name}</span>
                  <span className="block text-sm text-muted">
                    {o.zuechter} · Reifezahl {o.reifezahl}
                  </span>
                </span>
                <Check className="size-5 text-leaf-600" />
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
          „{q.trim()}“ übernehmen
        </button>
      ) : null}

      <div className="pt-2">
        <button
          type="button"
          onClick={() => select()}
          className="w-full text-center text-sm font-medium text-muted transition hover:text-ink hover:underline"
        >
          Ich weiß es nicht / Keine Angabe
        </button>
      </div>
    </div>
  );
}
