export const dynamic = "force-static";
export { generateFieldStaticParams as generateStaticParams } from "@/server/static-params";
import { FieldStatusSchema, PolygonSchema, UsageSchema } from "@seedle/core";
import { z } from "zod";
import { fehler, json, parseBody, withUser } from "@/server/http";
import { deleteField, getField, updateField } from "@/server/services/fields";

export async function GET(_req: Request, ctx: RouteContext<"/api/v1/fields/[fieldId]">) {
  const { fieldId } = await ctx.params;
  return withUser(async (user) => {
    const feld = await getField(user.id, fieldId);
    return feld ? json({ feld }) : fehler("Feld nicht gefunden.", 404);
  });
}

const PatchSchema = z.object({
  name: z.string().max(80).optional(),
  geometry: PolygonSchema.optional(),
  status: FieldStatusSchema.optional(),
  crop: z.literal("mais").optional(),
  usage: UsageSchema.optional(),
  previousVarietyId: z.string().nullable().optional(),
  previousVarietyText: z.string().max(120).nullable().optional(),
});

export async function PATCH(req: Request, ctx: RouteContext<"/api/v1/fields/[fieldId]">) {
  const { fieldId } = await ctx.params;
  const body = await parseBody(req, PatchSchema);
  if (!body) return fehler("Ungültige Angaben.");
  return withUser(async (user) => {
    const feld = await updateField(user.id, fieldId, body);
    return feld ? json({ feld }) : fehler("Feld nicht gefunden.", 404);
  });
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/v1/fields/[fieldId]">) {
  const { fieldId } = await ctx.params;
  return withUser(async (user) => {
    const ok = await deleteField(user.id, fieldId);
    return ok ? json({ geloescht: true }) : fehler("Feld nicht gefunden.", 404);
  });
}
