export const dynamic = "force-static";
import { KnowledgeFactSchema } from "@seedle/core";
import { z } from "zod";
import { fehler, json, parseBody, withUser } from "@/server/http";
import { factsFor, saveFact } from "@/server/services/knowledge";

/** Retrieves empirical farm knowledge facts shared by the farmer. */
export async function GET() {
  return withUser(async (user) => json({ wissen: await factsFor(user.id) }));
}

export async function POST(req: Request) {
  const body = await parseBody(req, KnowledgeFactSchema.extend({ fieldId: z.string().optional() }));
  if (!body) return fehler("Ungültige Angabe.");
  return withUser(async (user) => json({ wissen: await saveFact(user.id, body, "formular", body.fieldId) }, 201));
}
