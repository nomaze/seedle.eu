import "server-only";

import { lookupPlzOffline } from "@seedle/core";
import { inMemoryStore } from "../db/in-memory-store";
import type { FarmRow } from "../db/schema";

export type Farm = FarmRow;

export interface FarmPatch {
  name?: string;
  strasse?: string | null;
  plz?: string | null;
  ort?: string | null;
  lat?: number | null;
  lon?: number | null;
}

/**
 * Sucht den Hof des Nutzers im zustandslosen In-Memory-Modus.
 */
export async function getFarm(userId: string): Promise<Farm | null> {
  return inMemoryStore.getFarm(userId);
}

export async function getOrCreateFarm(userId: string): Promise<Farm> {
  return inMemoryStore.getFarm(userId);
}

export async function updateFarm(userId: string, patch: FarmPatch): Promise<Farm> {
  let lat = patch.lat ?? undefined;
  let lon = patch.lon ?? undefined;

  if (patch.plz && (lat === undefined || lon === undefined)) {
    const geo = lookupPlzOffline(patch.plz);
    if (geo) {
      lat = geo.lat;
      lon = geo.lon;
    }
  }

  return inMemoryStore.updateFarm(userId, {
    ...(patch.name !== undefined ? { name: patch.name } : {}),
    ...(patch.strasse !== undefined ? { strasse: patch.strasse } : {}),
    ...(patch.plz !== undefined ? { plz: patch.plz } : {}),
    ...(patch.ort !== undefined ? { ort: patch.ort } : {}),
    ...(lat !== undefined ? { lat } : {}),
    ...(lon !== undefined ? { lon } : {}),
  });
}
