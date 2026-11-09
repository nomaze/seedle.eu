// Stateless helper functions (Server Actions)

/**
 * Server Actions for the web app. They call the same domain services
 * as the REST API under /api/v1; allowing progressive enhancement without JavaScript.
 */
import { centroid, type Polygon, PolygonSchema, UsageSchema } from "@seedle/core";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { providers } from "@/server/providers";
import { currentUser, endSession } from "@/server/session";
import {
  createField as createFieldService,
  deleteField as deleteFieldService,
  renameField as renameFieldService,
  setFieldYear,
  updateFarm,
  updateField,
} from "@/server/services/fields";
import { saveFact } from "@/server/services/knowledge";
import { selectVariety } from "@/server/services/season";
import { track } from "@/server/services/tracking";

const str = (fd: FormData, key: string, maxLen = 120): string => {
  const v = fd.get(key);
  if (typeof v !== "string") return "";
  return v.trim().slice(0, maxLen);
};

/**
 * Creates a new agricultural field (Server Action).
 */
export async function createField(fd: FormData): Promise<void> {
  const user = await currentUser();
  const rawLatStr = str(fd, "lat", 50);
  const rawLonStr = str(fd, "lon", 50);
  const rawLat = rawLatStr ? Number(rawLatStr) : Number.NaN;
  const rawLon = rawLonStr ? Number(rawLonStr) : Number.NaN;
  const lat =
    Number.isFinite(rawLat) && rawLat >= -90 && rawLat <= 90 ? rawLat : Number.NaN;
  const lon =
    Number.isFinite(rawLon) && rawLon >= -180 && rawLon <= 180 ? rawLon : Number.NaN;
  const name = str(fd, "name", 120) || undefined;
  const farmId = str(fd, "farmId", 120) || undefined;
  const geomRaw = str(fd, "geometry", 200_000);

  let geometry: Polygon | undefined;
  if (geomRaw) {
    try {
      const parsed = JSON.parse(geomRaw);
      const parsedPoly = PolygonSchema.safeParse(parsed);
      if (parsedPoly.success) {
        const coords = parsedPoly.data.coordinates;
        const validCoords = coords.every((ring) =>
          ring.every(
            ([pLon, pLat]) =>
              Number.isFinite(pLon) &&
              Number.isFinite(pLat) &&
              pLon >= -180 &&
              pLon <= 180 &&
              pLat >= -90 &&
              pLat <= 90
          )
        );
        if (validCoords) {
          geometry = parsedPoly.data;
        }
      }
    } catch {
      geometry = undefined;
    }
  }

  let pointLat = lat;
  let pointLon = lon;
  if ((!Number.isFinite(pointLat) || !Number.isFinite(pointLon)) && geometry) {
    const c = centroid(geometry);
    pointLat = c.lat;
    pointLon = c.lon;
  }

  if (
    !Number.isFinite(pointLat) ||
    !Number.isFinite(pointLon) ||
    pointLat < -90 ||
    pointLat > 90 ||
    pointLon < -180 ||
    pointLon > 180
  ) {
    redirect("/feld/neu");
  }

  const f = await createFieldService(user.id, {
    point: { lat: pointLat, lon: pointLon },
    name,
    geometry,
    farmId,
  });

  if (!user.emailVerified) {
    redirect(`/anmelden?ziel=/feld/${f.id}/anbau`);
  } else {
    redirect(`/feld/${f.id}/anbau`);
  }
}

/**
 * Renames an existing field (Server Action).
 */
export async function renameField(fd: FormData): Promise<void> {
  const user = await currentUser();
  const fieldId = str(fd, "fieldId", 120);
  const name = str(fd, "name", 120);
  if (fieldId && name) {
    await renameFieldService(user.id, fieldId, name);
  }
  redirect(`/feld/${fieldId}`);
}

/**
 * Deletes an existing field (Server Action).
 */
export async function deleteField(fd: FormData): Promise<void> {
  const user = await currentUser();
  const fieldId = str(fd, "fieldId", 120);
  if (fieldId) {
    await deleteFieldService(user.id, fieldId);
  }
  redirect("/hof");
}

/**
 * Saves farm master data (Server Action).
 */
export async function saveFarm(fd: FormData): Promise<void> {
  const user = await currentUser();
  const name = str(fd, "name", 120);
  const strasse = str(fd, "strasse", 120);
  const plz = str(fd, "plz", 20);
  const ort = str(fd, "ort", 120);
  const latStr = str(fd, "lat", 50);
  const lonStr = str(fd, "lon", 50);

  const rawLat = latStr ? Number(latStr) : undefined;
  const rawLon = lonStr ? Number(lonStr) : undefined;

  const validLat =
    rawLat !== undefined && Number.isFinite(rawLat) && rawLat >= -90 && rawLat <= 90
      ? rawLat
      : undefined;
  const validLon =
    rawLon !== undefined && Number.isFinite(rawLon) && rawLon >= -180 && rawLon <= 180
      ? rawLon
      : undefined;

  await updateFarm(user.id, {
    name: name || undefined,
    strasse: strasse || null,
    plz: plz || null,
    ort: ort || null,
    lat: validLat,
    lon: validLon,
  });
  redirect("/hof");
}

/**
 * Sets crop and intended usage for season 2027 (Server Action).
 */
export async function chooseAnbau(fd: FormData): Promise<void> {
  const user = await currentUser();
  const fieldId = str(fd, "fieldId", 120);
  const crop = "mais" as const;
  const usageRaw = str(fd, "usage", 50);
  const usage = UsageSchema.safeParse(usageRaw);
  if (!usage.success) redirect(`/feld/${fieldId}/anbau`);

  await updateField(user.id, fieldId, { crop, usage: usage.data });
  await setFieldYear(fieldId, 2027, {
    crop,
    usage: usage.data,
    status: "geplant",
  });
  await track(user.id, "anbau_gewaehlt", { fieldId, crop, usage: usage.data });
  redirect(`/feld/${fieldId}/ranking`);
}

export async function chooseCrop(fd: FormData): Promise<void> {
  const fieldId = str(fd, "fieldId", 120);
  redirect(`/feld/${fieldId}/anbau`);
}

export async function chooseUsage(fd: FormData): Promise<void> {
  const user = await currentUser();
  const fieldId = str(fd, "fieldId", 120);
  const usage = UsageSchema.safeParse(str(fd, "usage", 50));
  if (!usage.success) redirect(`/feld/${fieldId}/anbau`);
  await updateField(user.id, fieldId, { crop: "mais", usage: usage.data });
  await setFieldYear(fieldId, 2027, {
    crop: "mais",
    usage: usage.data,
    status: "geplant",
  });
  await track(user.id, "nutzung_gewaehlt", { fieldId, usage: usage.data });
  redirect(`/feld/${fieldId}/ranking`);
}

/**
 * Records the previously cultivated variety (from catalog, free text, or unknown).
 */
export async function choosePrevious(fd: FormData): Promise<void> {
  const user = await currentUser();
  const fieldId = str(fd, "fieldId", 120);
  const varietyId = str(fd, "varietyId", 120);
  const text = str(fd, "text", 500);
  const known = providers().catalog.varieties().find((v) => v.id === varietyId);

  if (known) {
    await updateField(user.id, fieldId, {
      previousVarietyId: known.id,
      previousVarietyText: null,
    });
    await saveFact(
      user.id,
      { topic: "sorte", text: `Bisherige Maissorte auf dem Feld: ${known.name}` },
      "formular",
      fieldId
    );
  } else if (text) {
    await updateField(user.id, fieldId, {
      previousVarietyId: null,
      previousVarietyText: text,
    });
    await saveFact(
      user.id,
      { topic: "sorte", text: `Bisherige Maissorte auf dem Feld: ${text}` },
      "formular",
      fieldId
    );
  } else {
    await updateField(user.id, fieldId, {
      previousVarietyId: null,
      previousVarietyText: "unbekannt",
    });
  }
  await track(user.id, "bisherige_sorte", {
    fieldId,
    bekannt: Boolean(known),
    frei: Boolean(text && !known),
  });
  redirect(`/feld/${fieldId}/ranking`);
}

export async function chooseVariety(fd: FormData): Promise<void> {
  const user = await currentUser();
  const fieldId = str(fd, "fieldId", 120);
  const varietyId = str(fd, "varietyId", 120);
  await selectVariety(user.id, fieldId, varietyId);
  redirect("/hof");
}

/**
 * Answers a field-level contextual question (Server Action).
 */
export async function answerQuestion(fd: FormData): Promise<void> {
  const user = await currentUser();
  const fieldId = str(fd, "fieldId", 120);
  const thema = str(fd, "thema", 120);
  const antwort = str(fd, "antwort", 500);
  if (thema === "beregnung" && antwort) {
    await saveFact(
      user.id,
      { topic: "bewirtschaftung", text: `Beregnung möglich: ${antwort}` },
      "formular",
      fieldId
    );
  }
  refresh();
}

export async function logout(): Promise<void> {
  await endSession();
  redirect("/");
}
