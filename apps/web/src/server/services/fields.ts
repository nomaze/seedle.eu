import "server-only";

import {
  areaHa,
  autoFieldPolygon,
  centroid,
  type FieldContext,
  type GeoPoint,
  type Polygon,
  type SiteEnvironment,
  type Usage,
} from "@seedle/core";
import { config } from "../config";
import { inMemoryStore } from "../db/in-memory-store";
import type {
  FieldRow,
  FieldStatus,
  FieldYearRow,
  FieldYearStatus,
} from "../db/schema";
import { newId } from "../ids";
import { providers } from "../providers";
import { getOrCreateFarm } from "./farms";

export type Field = FieldRow;
export type { FieldStatus, FieldYearStatus, FieldYearRow };
export { getFarm, getOrCreateFarm, updateFarm, type Farm, type FarmPatch } from "./farms";

export async function listFields(userId: string): Promise<Field[]> {
  return inMemoryStore.listFields(userId);
}

export async function listFieldsForFarm(farmId?: string): Promise<Field[]> {
  void farmId;
  return inMemoryStore.listFields();
}

export async function getField(userId: string, fieldId: string): Promise<Field | null> {
  return inMemoryStore.getField(userId, fieldId);
}

export async function getFieldWithYears(
  userId: string,
  fieldId: string
): Promise<{ field: Field; years: FieldYearRow[] } | null> {
  const field = inMemoryStore.getField(userId, fieldId);
  if (!field) return null;
  const years = inMemoryStore.listFieldYears(fieldId);
  return { field, years };
}

export interface CreateFieldInput {
  id?: string;
  point?: GeoPoint;
  name?: string;
  geometry?: Polygon;
  farmId?: string;
  crop?: "mais";
  usage?: Usage;
  varietyId?: string;
  varietyText?: string;
  status?: FieldStatus;
}

const FALLBACK_ENV: SiteEnvironment = {
  region: "Tertiärhügelland",
  ackerzahl: 65,
  bodenart: "Lehm",
  niederschlagJahrMm: 800,
  niederschlagVegetationMm: 450,
  temperaturC: 8.9,
  waermesumme: 1100,
  hoeheM: 420,
};

const round1 = (n: number) => Math.round(n * 10) / 10;

export async function createField(userId: string, input: CreateFieldInput): Promise<Field> {
  const lat = Number(input.point?.lat);
  const lon = Number(input.point?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error("Ungültige Koordinaten für das Feld.");
  }
  const point: GeoPoint = { lat, lon };

  let geometry = input.geometry;
  if (!geometry) {
    try {
      geometry = autoFieldPolygon(point);
    } catch {
      const d = 0.002;
      geometry = {
        type: "Polygon",
        coordinates: [[
          [lon - d, lat - d],
          [lon + d, lat - d],
          [lon + d, lat + d],
          [lon - d, lat + d],
          [lon - d, lat - d],
        ]],
      };
    }
  }

  let env: SiteEnvironment;
  try {
    env = providers().environment.environmentAt(point);
  } catch {
    env = FALLBACK_ENV;
  }

  const anzahl = inMemoryStore.listFields(userId).length;
  const farm = await getOrCreateFarm(userId);
  const rawArea = areaHa(geometry);
  const safeArea = Number.isFinite(rawArea) && rawArea > 0 ? round1(rawArea) : 5.0;

  const fieldId = input.id || newId("fld");

  const now = new Date();
  const row: FieldRow = {
    id: fieldId,
    userId,
    farmId: farm.id,
    name: input.name?.trim().slice(0, 80) || (anzahl === 0 ? "Mein Feld" : `Feld ${anzahl + 1}`),
    lat: point.lat,
    lon: point.lon,
    geometry,
    areaHa: safeArea,
    env,
    status: input.status ?? "status-ok",
    crop: input.crop ?? "mais",
    usage: input.usage ?? null,
    previousVarietyId: null,
    previousVarietyText: null,
    selectedVarietyId: input.varietyId ?? null,
    saison: config.planungssaison,
    aussaat: null,
    createdAt: now,
    updatedAt: now,
  };

  inMemoryStore.setField(row);

  await setFieldYear(row.id, config.planungssaison, {
    crop: input.crop ?? "mais",
    usage: input.usage ?? null,
    varietyId: input.varietyId ?? null,
    varietyText: input.varietyText ?? null,
    status: input.varietyId ? "gewaehlt" : "geplant",
    areaHa: row.areaHa,
  });

  return row;
}

export interface FieldPatch {
  name?: string;
  geometry?: Polygon;
  crop?: "mais";
  usage?: Usage;
  status?: FieldStatus;
  farmId?: string | null;
  previousVarietyId?: string | null;
  previousVarietyText?: string | null;
  selectedVarietyId?: string | null;
  saison?: number;
  aussaat?: string | null;
}

export async function renameField(userId: string, fieldId: string, name: string): Promise<Field | null> {
  const clean = name.trim().slice(0, 80);
  if (!clean) return null;
  return updateField(userId, fieldId, { name: clean });
}

export async function updateField(userId: string, fieldId: string, patch: FieldPatch): Promise<Field | null> {
  const existing = inMemoryStore.getField(userId, fieldId);
  if (!existing) return null;

  const updated: FieldRow = {
    ...existing,
    ...(patch.name !== undefined ? { name: patch.name } : {}),
    ...(patch.crop !== undefined ? { crop: patch.crop } : {}),
    ...(patch.usage !== undefined ? { usage: patch.usage } : {}),
    ...(patch.status !== undefined ? { status: patch.status } : {}),
    ...(patch.previousVarietyId !== undefined ? { previousVarietyId: patch.previousVarietyId } : {}),
    ...(patch.previousVarietyText !== undefined ? { previousVarietyText: patch.previousVarietyText } : {}),
    ...(patch.selectedVarietyId !== undefined ? { selectedVarietyId: patch.selectedVarietyId } : {}),
    ...(patch.saison !== undefined ? { saison: patch.saison } : {}),
    ...(patch.aussaat !== undefined ? { aussaat: patch.aussaat } : {}),
    updatedAt: new Date(),
  };

  inMemoryStore.setField(updated);
  return updated;
}

export async function deleteField(userId: string, fieldId: string): Promise<boolean> {
  return inMemoryStore.deleteField(userId, fieldId);
}

export async function listFieldYears(fieldId: string): Promise<FieldYearRow[]> {
  return inMemoryStore.listFieldYears(fieldId);
}

export async function getFieldYear(fieldId: string, jahr: number): Promise<FieldYearRow | null> {
  const years = inMemoryStore.listFieldYears(fieldId);
  return years.find((y) => y.jahr === jahr) ?? null;
}

export interface FieldYearInput {
  crop?: "mais" | "winterweizen" | "silomais" | "koernermais" | "brache";
  varietyId?: string | null;
  varietyText?: string | null;
  usage?: "silomais" | "koernermais" | "biogas" | null;
  status?: FieldYearStatus;
  areaHa?: number | null;
}

export async function setFieldYear(
  fieldId: string,
  jahr: number,
  input: FieldYearInput
): Promise<FieldYearRow> {
  const now = new Date();
  const row: FieldYearRow = {
    id: `fy_${fieldId}_${jahr}`,
    fieldId,
    jahr,
    crop: input.crop ?? "mais",
    varietyId: input.varietyId ?? null,
    varietyText: input.varietyText ?? null,
    usage: input.usage ?? null,
    status: input.status ?? "geplant",
    areaHa: input.areaHa ?? null,
    createdAt: now,
    updatedAt: now,
  };

  return inMemoryStore.setFieldYear(fieldId, jahr, row);
}

export async function deleteFieldYear(fieldId: string, jahr: number): Promise<boolean> {
  return inMemoryStore.deleteFieldYear(fieldId, jahr);
}

export function toFieldContext(field: Field): FieldContext {
  const pt = centroid(field.geometry);
  return {
    id: field.id,
    point: pt,
    env: field.env,
  };
}
