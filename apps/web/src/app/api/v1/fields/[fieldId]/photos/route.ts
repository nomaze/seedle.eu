export const dynamic = "force-static";
export { generateFieldStaticParams as generateStaticParams } from "@/server/static-params";
import { checkRateLimit, fehler, json, withUser } from "@/server/http";
import { getField } from "@/server/services/fields";
import { addPhoto } from "@/server/services/photos";

/**
 * Uploads an in-field observation photo with rate limiting and magic-byte integrity verification.
 */
export async function POST(req: Request, ctx: RouteContext<"/api/v1/fields/[fieldId]/photos">) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  const rl = checkRateLimit(`photo_upload:${ip}`, 20, 600_000);
  if (!rl.allowed) {
    return fehler("Zu viele Uploads. Bitte etwas warten.", 429);
  }

  const { fieldId } = await ctx.params;
  const form = await req.formData().catch(() => null);
  const file = form?.get("foto");
  if (!(file instanceof File)) return fehler("Bitte ein Foto mitschicken.");
  const notiz = typeof form?.get("notiz") === "string" ? (form!.get("notiz") as string) : undefined;
  return withUser(async (user) => {
    const feld = await getField(user.id, fieldId);
    if (!feld) return fehler("Feld nicht gefunden.", 404);
    try {
      const { observation, finding } = await addPhoto(user.id, feld, file, notiz);
      return json({ beobachtung: observation, befund: finding }, 201);
    } catch (err) {
      return fehler(err instanceof Error ? err.message : "Foto konnte nicht gespeichert werden.");
    }
  });
}
