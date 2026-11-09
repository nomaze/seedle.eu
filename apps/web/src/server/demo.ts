import "server-only";
import { z } from "zod";
import { DEMO_STANDARD, MARKEN, type DemoEinstellungen, type Marke } from "@/lib/demo";

export const DEMO_TAG = "demo-einstellungen";
export const STANDARD_DEMO_EINSTELLUNGEN = DEMO_STANDARD;

const schema = z.object({
  marke: z
    .union([z.enum(MARKEN), z.literal("seedle")])
    .transform((val): Marke => (val === "seedle" ? "cream" : val))
    .catch(DEMO_STANDARD.marke),
  saatgutKauf: z.boolean().catch(DEMO_STANDARD.saatgutKauf),
  spross: z.boolean().catch(DEMO_STANDARD.spross),
  teamAnruf: z.boolean().catch(DEMO_STANDARD.teamAnruf),
  stoebern: z.boolean().catch(DEMO_STANDARD.stoebern),
  anmeldung: z.boolean().catch(DEMO_STANDARD.anmeldung),
  showBackendStatusBadge: z.boolean().catch(DEMO_STANDARD.showBackendStatusBadge),
  datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).catch(DEMO_STANDARD.datum),
  authModus: z.enum(["fake", "auth0"]).catch(DEMO_STANDARD.authModus),
});

let inMemorySettings: DemoEinstellungen = { ...DEMO_STANDARD };

export async function demoEinstellungen(): Promise<DemoEinstellungen> {
  return { ...inMemorySettings };
}

export async function speichereDemoEinstellungen(e: DemoEinstellungen): Promise<void> {
  inMemorySettings = schema.parse(e);
}
