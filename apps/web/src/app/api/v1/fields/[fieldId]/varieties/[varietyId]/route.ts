export const dynamic = "force-static";
export { generateFieldVarietyStaticParams as generateStaticParams } from "@/server/static-params";
import { fehler, json, withUser } from "@/server/http";
import { getField } from "@/server/services/fields";
import { explanationFor } from "@/server/services/recommendations";

/** Detailed variety explanation endpoint: 5-year hindcast, similar trial sites, and agronomic justification. */
export async function GET(_req: Request, ctx: RouteContext<"/api/v1/fields/[fieldId]/varieties/[varietyId]">) {
  const { fieldId, varietyId } = await ctx.params;
  return withUser(async (user) => {
    const feld = await getField(user.id, fieldId);
    if (!feld) return fehler("Feld nicht gefunden.", 404);
    const erklaerung = await explanationFor(feld, varietyId);
    return erklaerung ? json({ erklaerung }) : fehler("Sorte oder Nutzungsrichtung fehlt.", 404);
  });
}
