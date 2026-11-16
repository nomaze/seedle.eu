"use client";

import { useState } from "react";
import { buttonClass } from "@/components/ui/Button";

const inputClass =
  "mt-2 h-control w-full rounded-control border border-control bg-surface px-3 text-body text-fg";

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
      className="mt-4 max-w-measure space-y-5"
    >
      <div>
        <label htmlFor="farm-name" className="block text-body font-semibold text-fg">
          Betriebsname
        </label>
        <input
          id="farm-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="farm-strasse" className="block text-body font-semibold text-fg">
          Straße & Hausnummer
        </label>
        <input
          id="farm-strasse"
          value={strasse}
          onChange={(e) => setStrasse(e.target.value)}
          placeholder="z. B. Dorfstraße 12"
          className={inputClass}
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label htmlFor="farm-plz" className="block text-body font-semibold text-fg">
            PLZ
          </label>
          <input
            id="farm-plz"
            value={plz}
            onChange={(e) => setPlz(e.target.value)}
            placeholder="85354"
            className={inputClass}
          />
        </div>
        <div className="col-span-2">
          <label htmlFor="farm-ort" className="block text-body font-semibold text-fg">
            Ort
          </label>
          <input
            id="farm-ort"
            value={ort}
            onChange={(e) => setOrt(e.target.value)}
            placeholder="Freising"
            className={inputClass}
          />
        </div>
      </div>
      <button type="submit" className={buttonClass("primary", "md")}>
        {saved ? "Gespeichert" : "Speichern"}
      </button>
    </form>
  );
}
