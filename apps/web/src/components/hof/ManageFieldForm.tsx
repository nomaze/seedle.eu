"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClass } from "@/components/ui/Button";

export function ManageFieldForm({ fieldId, defaultName }: { fieldId: string; defaultName: string }) {
  void fieldId;
  const router = useRouter();
  const [name, setName] = useState(defaultName);
  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-4 mt-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        }}
        className="flex flex-wrap items-end gap-3"
      >
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
            Name des Schlags
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-leaf-600 focus:outline-none"
          />
        </div>
        <button type="submit" className={buttonClass("secondary", "sm")}>
          {saved ? "Gespeichert" : "Umbenennen"}
        </button>
      </form>

      <div className="pt-3 border-t border-line flex items-center justify-between">
        <span className="text-sm text-muted">Diesen Schlag und alle zugehörigen Daten entfernen:</span>
        <button
          type="button"
          onClick={() => {
            router.push("/hof");
          }}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[#9a2e1b] hover:bg-poppy-soft transition"
        >
          <Trash2 className="size-3.5" /> Schlag löschen
        </button>
      </div>
    </div>
  );
}
