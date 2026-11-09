"use client";

import { useState } from "react";
import { buttonClass } from "@/components/ui/Button";

interface FarmData {
  name: string;
  strasse?: string | null;
  plz?: string | null;
  ort?: string | null;
}

export function EditFarmForm({ farm }: { farm: FarmData }) {
  const [name, setName] = useState(farm.name);
  const [strasse, setStrasse] = useState(farm.strasse ?? "");
  const [plz, setPlz] = useState(farm.plz ?? "");
  const [ort, setOrt] = useState(farm.ort ?? "");
  const [saved, setSaved] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }}
      className="mt-3 space-y-3 max-w-md"
    >
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
          Betriebsname
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-leaf-600 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
          Straße & Hausnummer
        </label>
        <input
          value={strasse}
          onChange={(e) => setStrasse(e.target.value)}
          placeholder="z. B. Dorfstraße 12"
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-leaf-600 focus:outline-none"
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">PLZ</label>
          <input
            value={plz}
            onChange={(e) => setPlz(e.target.value)}
            placeholder="85354"
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-leaf-600 focus:outline-none"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">Ort</label>
          <input
            value={ort}
            onChange={(e) => setOrt(e.target.value)}
            placeholder="Freising"
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-leaf-600 focus:outline-none"
          />
        </div>
      </div>
      <button type="submit" className={buttonClass("primary", "sm")}>
        {saved ? "Gespeichert" : "Speichern"}
      </button>
    </form>
  );
}
