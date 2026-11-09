export const dynamic = "force-static";
export function generateStaticParams() {
  return [{ observationId: "obs_demo_1" }, { observationId: "obs_demo_2" }];
}
import { currentUser } from "@/server/session";
import { getObservation } from "@/server/services/season";
import { readPhoto } from "@/server/services/photos";

/** Retrieves an in-field journal observation photo, restricted to the owning user. */
export async function GET(_req: Request, ctx: RouteContext<"/api/v1/observations/[observationId]/photo">) {
  const { observationId } = await ctx.params;
  const user = await currentUser();
  const obs = await getObservation(user.id, observationId);
  const bytes = obs ? await readPhoto(obs) : null;
  if (!obs || !bytes) return new Response("Nicht gefunden", { status: 404 });
  return new Response(new Uint8Array(bytes), {
    headers: { "content-type": obs.mimeType ?? "image/jpeg", "cache-control": "private, max-age=31536000, immutable" },
  });
}
