export const dynamic = "force-static";
export { generateFieldStaticParams as generateStaticParams } from "@/server/static-params";
import { fehler, json, withUser } from "@/server/http";
import { getField } from "@/server/services/fields";
import { recommendationFor } from "@/server/services/recommendations";

/** Field-level variety recommendation ranking endpoint. */
export async function GET(_req: Request, ctx: RouteContext<"/api/v1/fields/[fieldId]/recommendation">) {
  const { fieldId } = await ctx.params;
  return withUser(async (user) => {
    const feld = await getField(user.id, fieldId);
    if (!feld) return fehler("Feld nicht gefunden.", 404);
    const empfehlung = await recommendationFor(feld, "gewichtet");
    if (!empfehlung) return fehler("Bitte zuerst die Nutzungsrichtung wählen.", 409);
    return json({ empfehlung });
  });
}
