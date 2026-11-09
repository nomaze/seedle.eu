export const dynamic = "force-static";
import { json, withUser } from "@/server/http";

/** Returns the active user profile and verification status. */
export async function GET() {
  return withUser(async (user) =>
    json({
      id: user.id,
      name: user.name,
      email: user.email,
      emailBestaetigt: user.emailVerified,
      telefon: user.telefon,
    }),
  );
}
