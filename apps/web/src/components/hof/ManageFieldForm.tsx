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
    <div className="max-w-measure space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        }}
        className="flex flex-wrap items-end gap-3"
      >
        <div className="min-w-[200px] flex-1">
          <label htmlFor="field-name" className="block text-body font-semibold text-fg">
            Name des Schlags
          </label>
          <input
            id="field-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 h-control w-full rounded-control border border-control bg-surface px-3 text-body text-fg"
          />
        </div>
        <button type="submit" className={buttonClass("secondary", "md")}>
          {saved ? "Gespeichert" : "Umbenennen"}
        </button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-divider pt-4">
        <span className="text-small text-fg-muted">Diesen Schlag und alle zugehörigen Daten entfernen:</span>
        <button
          type="button"
          onClick={() => {
            router.push("/hof");
          }}
          className="inline-flex min-h-touch items-center gap-1.5 rounded-control px-3 text-small font-semibold text-status-urgent-text transition-colors hover:bg-status-urgent-soft"
        >
          <Trash2 className="size-4" aria-hidden /> Schlag löschen
        </button>
      </div>
    </div>
  );
}
