import "server-only";

import { KnowledgeFactSchema, type KnowledgeFact } from "@seedle/core";
import { inMemoryStore } from "../db/in-memory-store";
import type { KnowledgeRow } from "../db/schema";
import { newId } from "../ids";
import { track } from "./tracking";

/** Persists empirical agronomic knowledge provided by the farmer with source provenance. */
export async function saveFact(
  userId: string,
  fact: KnowledgeFact,
  source: "spross" | "formular",
  fieldId?: string | null,
): Promise<KnowledgeRow> {
  const parsed = KnowledgeFactSchema.parse(fact);
  const row: KnowledgeRow = {
    id: newId("kn"),
    userId,
    fieldId: fieldId ?? null,
    topic: parsed.topic,
    jahr: parsed.jahr ?? null,
    text: parsed.text,
    source,
    createdAt: new Date(),
  };
  inMemoryStore.addKnowledgeFact(row);
  await track(userId, "wissen_gespeichert", { topic: parsed.topic, source });
  return row;
}

export async function factsFor(userId: string): Promise<KnowledgeRow[]> {
  return inMemoryStore.getKnowledgeFacts(userId);
}
