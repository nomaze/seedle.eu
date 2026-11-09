export const dynamic = "force-static";
export { generateFieldStaticParams as generateStaticParams } from "@/server/static-params";
import { FieldYearStatusSchema } from "@seedle/contracts";
import { z } from "zod";
import { fehler, json, parseBody, withUser } from "@/server/http";
import { getField, listFieldYears, setFieldYear } from "@/server/services/fields";

export async function GET(_req: Request, ctx: RouteContext<"/api/v1/fields/[fieldId]/years">) {
  const { fieldId } = await ctx.params;
  return withUser(async (user) => {
    const field = await getField(user.id, fieldId);
    if (!field) return fehler("Feld nicht gefunden.", 404);
    return json({ fieldYears: await listFieldYears(fieldId) });
  });
}

const YearSchema = z.object({
  jahr: z.number().int().min(2000).max(2100),
  crop: z.enum(["mais", "winterweizen", "silomais", "koernermais", "brache"]).optional(),
  usage: z.enum(["silomais", "koernermais", "biogas"]).nullable().optional(),
  varietyId: z.string().nullable().optional(),
  varietyText: z.string().nullable().optional(),
  status: FieldYearStatusSchema.optional(),
  areaHa: z.number().nullable().optional(),
});

export async function POST(req: Request, ctx: RouteContext<"/api/v1/fields/[fieldId]/years">) {
  const { fieldId } = await ctx.params;
  const body = await parseBody(req, YearSchema);
  if (!body) return fehler("Ungültige Angaben.");
  return withUser(async (user) => {
    const field = await getField(user.id, fieldId);
    if (!field) return fehler("Feld nicht gefunden.", 404);
    const yearRow = await setFieldYear(fieldId, body.jahr, {
      crop: body.crop,
      usage: body.usage,
      varietyId: body.varietyId,
      varietyText: body.varietyText,
      status: body.status,
      areaHa: body.areaHa,
    });
    return json({ fieldYear: yearRow }, 201);
  });
}
