import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { growthStage, type PhotoFinding } from "@seedle/core";
import { config } from "../config";
import { getDb, schema } from "../db/client";
import type { ObservationRow } from "../db/schema";
import { newId } from "../ids";
import { providers } from "../providers";
import type { Field } from "./fields";
import { heuteIso } from "./season";
import { track } from "./tracking";

const UPLOAD_DIR = () => path.join(process.cwd(), config.datenVerzeichnis, "uploads");
export const MAX_FOTO_BYTES = 12 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

/**
 * Validates binary magic bytes against declared MIME type to prevent malicious file uploads.
 */
export function hasValidImageMagicBytes(buffer: Uint8Array, mimeType: string): boolean {
  if (!buffer || buffer.length < 12) return false;

  // JPEG: FF D8 FF
  if (mimeType === "image/jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  // PNG: 89 50 4E 47 (\x89PNG)
  if (mimeType === "image/png") {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    );
  }

  // WebP: RIFF (bytes 0..3) ... WEBP (bytes 8..11)
  if (mimeType === "image/webp") {
    const isRiff =
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46;
    const isWebp =
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50;
    return isRiff && isWebp;
  }

  // HEIC / HEIF: bytes 4..7 === 'ftyp'
  if (mimeType === "image/heic" || mimeType === "image/heif") {
    return (
      buffer[4] === 0x66 && // 'f'
      buffer[5] === 0x74 && // 't'
      buffer[6] === 0x79 && // 'y'
      buffer[7] === 0x70    // 'p'
    );
  }

  return false;
}

/**
 * Saves a field observation photo, verifies integrity and magic bytes,
 * and triggers agricultural diagnostic analysis.
 */
export async function addPhoto(
  userId: string,
  field: Field,
  file: File,
  note?: string,
): Promise<{ observation: ObservationRow; finding: PhotoFinding }> {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error("Bitte ein Foto (JPG, PNG, WebP oder HEIC) wählen.");
  }
  if (file.size > MAX_FOTO_BYTES) {
    throw new Error("Das Foto ist größer als 12 MB.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasValidImageMagicBytes(bytes, file.type)) {
    throw new Error("Ungültiges Bildformat (ungültige Magic-Bytes).");
  }

  const id = newId("obs");
  const ext = file.type.split("/")[1] ?? "jpg";
  await mkdir(UPLOAD_DIR(), { recursive: true });
  const fileName = `${id}.${ext}`;
  await writeFile(path.join(UPLOAD_DIR(), fileName), bytes);

  const today = await heuteIso();
  const saisonJahr = Number.parseInt(today.slice(0, 4), 10) || field.saison || 2027;
  const aussaat = field.aussaat ? `${saisonJahr}-${field.aussaat.slice(5)}` : `${saisonJahr}-04-25`;
  const stadium = growthStage(aussaat, today);
  const finding = await providers().photos.analyze({ bytes, bbchErwartet: stadium.bbch, mimeType: file.type });

  const db = await getDb();
  const [observation] = await db
    .insert(schema.observations)
    .values({
      id,
      fieldId: field.id,
      userId,
      kind: "foto",
      photoPath: fileName,
      mimeType: file.type,
      note: note?.trim() || null,
      bbch: stadium.bbch,
      finding,
    })
    .returning();

  await track(userId, "foto_hochgeladen", { fieldId: field.id, kategorie: finding.kategorie });
  return { observation: observation!, finding };
}

export async function readPhoto(observation: ObservationRow): Promise<Buffer | null> {
  if (!observation.photoPath) return null;
  try {
    return await readFile(path.join(UPLOAD_DIR(), path.basename(observation.photoPath)));
  } catch {
    return null;
  }
}
