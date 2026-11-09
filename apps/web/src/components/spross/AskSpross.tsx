"use client";

import type { ReactNode } from "react";
import { useDemo } from "../shell/DemoContext";
import { useOverlays } from "../shell/Overlays";
import { useSpross } from "./SprossContext";

/** Button opening Spross companion with an optional pre-seeded question. */
export function AskSprossButton({ frage, children, className = "" }: { frage?: string; children: ReactNode; className?: string }) {
  const { askSpross, focusInput, setIsChatOpen, setIsMinimized } = useSpross();
  if (!useDemo().spross) return null;
  return (
    <button
      type="button"
      onClick={() => {
        setIsMinimized(false);
        if (frage) {
          askSpross(frage);
        } else {
          setIsChatOpen(true);
          focusInput();
        }
      }}
      className={className}
    >
      {children}
    </button>
  );
}

/** Button opening the team phone consultation sheet modal. */
export function CallTeamButton({ children, className = "" }: { children: ReactNode; className?: string }) {
  const { oeffne } = useOverlays();
  if (!useDemo().teamAnruf) return null;
  return (
    <button type="button" onClick={() => oeffne("anruf")} className={className}>
      {children}
    </button>
  );
}
