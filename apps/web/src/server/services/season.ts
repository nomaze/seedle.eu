import "server-only";

import {
  growthStage,
  hintsForToday,
  photoTask,
  type BenchmarkResult,
  type FieldHint,
  type GrowthStage,
  type Variety,
  type WeatherDay,
} from "@seedle/core";
import { and, desc, eq } from "drizzle-orm";
import { config } from "../config";
import { getDb, schema } from "../db/client";
import type { ObservationRow } from "../db/schema";
import { demoEinstellungen } from "../demo";
import { providers } from "../providers";
import { getField, setFieldYear, updateField, type Field } from "./fields";
import { track } from "./tracking";

/** Selects a variety for the target field and activates seasonal accompaniment. */
export async function selectVariety(userId: string, fieldId: string, varietyId: string): Promise<Field | null> {
  const field = await getField(userId, fieldId);
  const variety = providers().catalog.varieties().find((v) => v.id === varietyId);
  if (!field || !variety) return null;

  const updated = await updateField(userId, fieldId, {
    selectedVarietyId: varietyId,
    saison: config.planungssaison,
    aussaat: field.aussaat ?? config.standardAussaat(config.planungssaison),
  });

  await setFieldYear(fieldId, config.planungssaison, {
    crop: (field.crop as "mais") ?? "mais",
    usage: (field.usage as "silomais" | "koernermais" | "biogas" | null) ?? null,
    varietyId: variety.id,
    varietyText: variety.name,
    status: "gewaehlt",
    areaHa: field.areaHa,
  });
  await track(userId, "sorte_gewaehlt", { fieldId, varietyId });
  return updated;
}

export async function heuteIso(): Promise<string> {
  if (config.demoEinstellungen) {
    try {
      const demo = await demoEinstellungen();
      if (demo.datum) return demo.datum;
    } catch {
      // fallback
    }
  }
  return config.demoHeute || new Date().toISOString().slice(0, 10);
}

export interface TodayView {
  field: Field;
  variety: Variety;
  heute: string;
  stadium: GrowthStage;
  wetter: WeatherDay[];
  hinweise: FieldHint[];
  fotoAuftrag: { titel: string; anleitung: string };
  vergleich: BenchmarkResult;
  tagebuch: ObservationRow[];
  demo: boolean;
}

export async function todayView(field: Field): Promise<TodayView | null> {
  const variety = providers().catalog.varieties().find((v) => v.id === field.selectedVarietyId);
  if (!variety) return null;
  const heute = await heuteIso();
  const saisonJahr = Number.parseInt(heute.slice(0, 4), 10) || config.planungssaison;
  let aussaat = field.aussaat;
  if (aussaat) {
    aussaat = `${saisonJahr}-${aussaat.slice(5)}`;
  } else {
    aussaat = config.standardAussaat(saisonJahr);
  }
  const stadium = growthStage(aussaat, heute);
  const wetter = providers().weather.forecast({ lat: field.lat, lon: field.lon }, heute, 7);
  const tagebuch = await observationsFor(field.id);
  return {
    field,
    variety,
    heute,
    stadium,
    wetter,
    hinweise: hintsForToday({ heuteIso: heute, stadium, vorhersage: wetter }),
    fotoAuftrag: photoTask(stadium),
    vergleich: providers().benchmark.benchmark({ fieldId: field.id, env: field.env, eintraege: tagebuch.length }),
    tagebuch,
    demo: Boolean(config.demoHeute || config.demoEinstellungen),
  };
}

export async function observationsFor(fieldId: string): Promise<ObservationRow[]> {
  const db = await getDb();
  return db
    .select()
    .from(schema.observations)
    .where(eq(schema.observations.fieldId, fieldId))
    .orderBy(desc(schema.observations.createdAt))
    .limit(20);
}

export async function getObservation(userId: string, id: string): Promise<ObservationRow | null> {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(schema.observations)
    .where(and(eq(schema.observations.id, id), eq(schema.observations.userId, userId)))
    .limit(1);
  return row ?? null;
}
