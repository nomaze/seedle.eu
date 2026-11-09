import { z } from "zod";
import { fehler, json, withUser } from "@/server/http";
import { track } from "@/server/services/tracking";

const EventSchema = z.object({ name: z.string().regex(/^[a-z_]{3,40}$/), props: z.record(z.string(), z.unknown()).optional() });

/** Client telemetry event endpoint (e.g., page views). Responds promptly. */
export const dynamic = "force-static";

export async function POST(req: Request) {
  const raw = await req.text();
  let parsed;
  try {
    parsed = EventSchema.safeParse(JSON.parse(raw));
  } catch {
    return fehler("Ungültiges Ereignis.");
  }
  if (!parsed.success) return fehler("Ungültiges Ereignis.");
  const event = parsed.data;
  return withUser(async (user) => {
    await track(user.id, event.name, event.props);
    return json({ ok: true });
  });
}
