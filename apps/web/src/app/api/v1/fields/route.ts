export const dynamic = "force-static";
import { FieldStatusSchema, GeoPointSchema, PolygonSchema, UsageSchema } from "@seedle/core";
import { z } from "zod";
import { fehler, json, parseBody, withUser } from "@/server/http";
import { createField, listFields } from "@/server/services/fields";

export async function GET() {
  return withUser(async (user) => json({ felder: await listFields(user.id) }));
}

const CreateSchema = GeoPointSchema.extend({
  name: z.string().max(80).optional(),
  geometry: PolygonSchema.optional(),
  farmId: z.string().optional(),
  status: FieldStatusSchema.optional(),
  crop: z.string().optional(),
  usage: UsageSchema.optional(),
  varietyId: z.string().optional(),
  varietyText: z.string().optional(),
});

/** Creates a new field parcel from a coordinate point, auto-generating boundary geometry if omitted. */
export async function POST(req: Request) {
  const body = await parseBody(req, CreateSchema);
  if (!body) return fehler("Bitte einen gültigen Punkt (lat, lon) angeben.");
  return withUser(async (user) => {
    try {
      const feld = await createField(user.id, {
        point: { lat: body.lat, lon: body.lon },
        name: body.name,
        geometry: body.geometry,
        farmId: body.farmId,
        status: body.status,
        crop: (body.crop as "mais") ?? "mais",
        usage: body.usage,
        varietyId: body.varietyId,
        varietyText: body.varietyText,
      });
      return json(
        {
          feld,
          user: {
            id: user.id,
            emailVerified: user.emailVerified,
          },
        },
        201
      );
    } catch (err) {
      console.error("[POST /api/v1/fields] createField failed:", err);
      return fehler("Das Feld konnte nicht angelegt werden. Bitte versuche es erneut.", 500);
    }
  });
}
