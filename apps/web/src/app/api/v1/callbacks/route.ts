export const dynamic = "force-static";
import { z } from "zod";
import { fehler, json, parseBody, withUser } from "@/server/http";
import { requestCallback } from "@/server/services/callbacks";

/** Callback request endpoint for NoMaze team consultation. */
export async function POST(req: Request) {
  const body = await parseBody(
    req,
    z.object({ telefon: z.string().max(40), zeitfenster: z.string().max(40), anliegen: z.string().max(1000).optional(), seite: z.string().max(300).optional() }),
  );
  if (!body) return fehler("Bitte Telefonnummer und Zeitfenster angeben.");
  return withUser(async (user) => {
    const res = await requestCallback(user.id, body);
    return res.ok ? json(res) : fehler(res.fehler ?? "Das hat nicht geklappt.");
  });
}
