export const dynamic = "force-static";
export { generateFieldStaticParams as generateStaticParams } from "@/server/static-params";
import { fehler, json, withUser } from "@/server/http";
import { getField } from "@/server/services/fields";
import { todayView } from "@/server/services/season";

/** "Your Field Today" endpoint: phenological stage, weather, daily hints, photo tasks, and journal. */
export async function GET(_req: Request, ctx: RouteContext<"/api/v1/fields/[fieldId]/today">) {
  const { fieldId } = await ctx.params;
  return withUser(async (user) => {
    const feld = await getField(user.id, fieldId);
    if (!feld) return fehler("Feld nicht gefunden.", 404);
    const heute = await todayView(feld);
    return heute ? json({ heute }) : fehler("Für dieses Feld ist noch keine Sorte gewählt.", 409);
  });
}
