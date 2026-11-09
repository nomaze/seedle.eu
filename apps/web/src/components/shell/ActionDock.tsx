"use client";

import { Phone } from "lucide-react";
import { useLanguage } from "./LanguageContext";
import { useSpross } from "../spross/SprossContext";
import { useDemo } from "./DemoContext";
import { useOverlays } from "./Overlays";

/**
 * Support consultation action dock ("Call NoMaze Team") anchored bottom-right.
 */
export function ActionDock() {
  const { oeffne } = useOverlays();
  const { isChatOpen } = useSpross();
  const { spross, teamAnruf } = useDemo();
  const { t } = useLanguage();
  if (!teamAnruf) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-40 flex-col items-end gap-3 transition-opacity duration-300 ${
        spross ? "hidden lg:flex" : "flex"
      } ${isChatOpen && spross ? "pointer-events-none opacity-0" : "opacity-100"}`}
    >
      <button
        type="button"
        onClick={() => oeffne("anruf")}
        className="flex items-center gap-2.5 rounded-full bg-leaf-800 py-3 pl-4 pr-5 text-sm font-semibold text-white shadow-lift transition hover:-translate-y-0.5 hover:bg-leaf-900"
      >
        <Phone className="size-4" aria-hidden />
        {t.shell.callTeamDock}
      </button>
    </div>
  );
}
