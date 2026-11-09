import { CompanionRequestSchema } from "@seedle/contracts";
import { SprossEngine } from "@seedle/spross";
import { checkRateLimit, fehler, json, parseBody, withUser } from "@/server/http";
import { config } from "@/server/config";
import { SprossDrizzleAdapter } from "@/server/adapters/spross-drizzle-adapter";

export const dynamic = "force-static";

const sprossEngine = new SprossEngine(new SprossDrizzleAdapter(), {
  sprossAktiv: config.sprossAktiv,
  sprossModell: config.sprossModell,
  planungssaison: config.planungssaison,
});

/**
 * Companion conversation endpoint.
 * GET: Retrieves chat history.
 * POST: Sends message with rate-limiting guard.
 * DELETE: Resets active conversation.
 */
export async function GET() {
  return withUser(async (user) =>
    json(await sprossEngine.getConversation(user.id, "de"))
  );
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  const rl = checkRateLimit(`companion:${ip}`, 30, 60_000);
  if (!rl.allowed) {
    return fehler("Zu viele Anfragen. Bitte kurz warten.", 429);
  }

  const body = await parseBody(req, CompanionRequestSchema);
  if (!body) return fehler("Bitte eine Nachricht schreiben.");

  return withUser(async (user) =>
    json(await sprossEngine.sendMessage(user.id, body))
  );
}

export async function DELETE() {
  return withUser(async (user) =>
    json(await sprossEngine.resetConversation(user.id, "de"))
  );
}
