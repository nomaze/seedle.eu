export const dynamic = "force-static";
import { z } from "zod";
import { checkRateLimit, fehler, json, parseBody, withUser } from "@/server/http";
import { requestCode } from "@/server/services/auth";

const schema = z.object({
  email: z.string().max(200),
  telefon: z.string().max(50).optional(),
  kanal: z.enum(["email", "sms"]).optional(),
});

/**
 * Requests a one-time authentication code via email or SMS with rate limiting.
 */
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  const rl = checkRateLimit(`auth_code:${ip}`, 5, 300_000);
  if (!rl.allowed) {
    return fehler("Zu viele Code-Anfragen. Bitte später erneut versuchen.", 429);
  }

  const body = await parseBody(req, schema);
  if (!body) return fehler("Bitte eine gültige E-Mail-Adresse angeben.");
  return withUser(async (user) => {
    const res = await requestCode(user, body.email, body.telefon, body.kanal ?? "email");
    return res.ok ? json(res) : fehler(res.fehler ?? "Das hat nicht geklappt.");
  });
}
