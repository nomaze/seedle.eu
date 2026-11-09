export const dynamic = "force-static";
import { z } from "zod";
import { fehler, json, parseBody, withUser } from "@/server/http";
import { getOrCreateFarm, updateFarm } from "@/server/services/farms";

export async function GET() {
  return withUser(async (user) => json({ farm: await getOrCreateFarm(user.id) }));
}

const FarmPatchSchema = z.object({
  name: z.string().max(120).optional(),
  strasse: z.string().max(120).nullable().optional(),
  plz: z.string().max(20).nullable().optional(),
  ort: z.string().max(100).nullable().optional(),
  lat: z.number().nullable().optional(),
  lon: z.number().nullable().optional(),
});

export async function PATCH(req: Request) {
  const body = await parseBody(req, FarmPatchSchema);
  if (!body) return fehler("Ungültige Angaben.");
  return withUser(async (user) => json({ farm: await updateFarm(user.id, body) }));
}
