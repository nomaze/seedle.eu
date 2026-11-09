"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type Overlay = "spross" | "anruf" | null;

interface OverlayApi {
  offen: Overlay;
  oeffne: (o: Exclude<Overlay, null>, sprossFrage?: string) => void;
  schliesse: () => void;
  /** Pre-seeded question supplied to Spross on modal open (e.g. "Why this variety?"). */
  sprossFrage?: string;
  frageVerbraucht: () => void;
}

const Ctx = createContext<OverlayApi | null>(null);

/** Manages open state for overlay sheets (Spross companion and support phone call modal). */
export function OverlayProvider({ children }: { children: ReactNode }) {
  const [offen, setOffen] = useState<Overlay>(null);
  const [sprossFrage, setSprossFrage] = useState<string | undefined>();
  const oeffne = useCallback((o: Exclude<Overlay, null>, frage?: string) => {
    setSprossFrage(frage);
    setOffen(o);
  }, []);
  const schliesse = useCallback(() => setOffen(null), []);
  const frageVerbraucht = useCallback(() => setSprossFrage(undefined), []);
  const api = useMemo(
    () => ({ offen, oeffne, schliesse, sprossFrage, frageVerbraucht }),
    [offen, oeffne, schliesse, sprossFrage, frageVerbraucht],
  );
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useOverlays(): OverlayApi {
  const api = useContext(Ctx);
  if (!api) throw new Error("useOverlays außerhalb von OverlayProvider");
  return api;
}
