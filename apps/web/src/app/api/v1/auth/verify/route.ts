export const dynamic = "force-static";
import { z } from "zod";
import { fehler, json, parseBody, withUser } from "@/server/http";
import { verifyCode } from "@/server/services/auth";

const schema = z.object({
  email: z.string().max(200),
  code: z.string().max(100).optional().default(""),
});

export async function POST(req: Request) {
  const body = await parseBody(req, schema);
  if (!body) return fehler("Bitte eine E-Mail-Adresse angeben.");

  // Handles code verification and switches session to authenticated profile
  return withUser(async (user) => {
    const res = await verifyCode(user, body.email, body.code);
    return res.ok ? json(res) : fehler(res.fehler ?? "Anmeldung fehlgeschlagen.");
  });
}
