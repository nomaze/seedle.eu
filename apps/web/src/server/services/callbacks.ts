import "server-only";

import { eq } from "drizzle-orm";
import { getDb, schema } from "../db/client";
import { newId } from "../ids";
import { track } from "./tracking";

/**
 * Records callback requests for consultation by the NoMaze advisory team.
 */
export async function requestCallback(
  userId: string,
  input: { telefon: string; zeitfenster: string; anliegen?: string; seite?: string },
): Promise<{ ok: boolean; fehler?: string }> {
  const telefon = input.telefon.replace(/[^\d+ ]/g, "").trim();
  if (telefon.replace(/\D/g, "").length < 6) return { ok: false, fehler: "Bitte gib eine Telefonnummer an, unter der wir dich erreichen." };
  const db = await getDb();
  await db.insert(schema.callbackRequests).values({
    id: newId("cb"),
    userId,
    telefon,
    zeitfenster: input.zeitfenster,
    anliegen: input.anliegen?.trim() || null,
    seite: input.seite ?? null,
  });
  await db.update(schema.users).set({ telefon }).where(eq(schema.users.id, userId));
  await track(userId, "rueckruf_angefordert", { zeitfenster: input.zeitfenster });
  console.info(`[Callback request] ${telefon} · ${input.zeitfenster} · ${input.anliegen ?? ""}`);
  return { ok: true };
}
