import "server-only";

import { getDb, schema } from "../db/client";
import { newId } from "../ids";

/**
 * Agronomic telemetry events tracking farmer actions (e.g., `feld_angelegt`, `sorte_gewaehlt`).
 * Event catalog documented in docs/ARCHITECTURE.md.
 */
export async function track(userId: string | null, name: string, props?: Record<string, unknown>): Promise<void> {
  try {
    const db = await getDb();
    await db.insert(schema.events).values({ id: newId("evt"), userId, name, props: props ?? null });
  } catch (err) {
    // Telemetry errors must never disrupt user transactions
    console.warn("[tracking] Event not saved:", name, err);
  }
}
