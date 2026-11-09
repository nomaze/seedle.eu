export const dynamic = "force-static";
export { generateFieldStaticParams as generateStaticParams } from "@/server/static-params";
import { z } from "zod";
import { fehler, json, parseBody, withUser } from "@/server/http";
import { selectVariety } from "@/server/services/season";

/** Selects a variety for the target field, initializing seasonal monitoring. */
export async function POST(req: Request, ctx: RouteContext<"/api/v1/fields/[fieldId]/selection">) {
  const { fieldId } = await ctx.params;
  const body = await parseBody(req, z.object({ varietyId: z.string() }));
  if (!body) return fehler("Bitte eine Sorte angeben.");
  return withUser(async (user) => {
    const feld = await selectVariety(user.id, fieldId, body.varietyId);
    return feld ? json({ feld }) : fehler("Feld oder Sorte nicht gefunden.", 404);
  });
}
