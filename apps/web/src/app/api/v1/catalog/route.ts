export const dynamic = "force-static";
import { json } from "@/server/http";
import { providers } from "@/server/providers";

/** Catalog endpoint supplying varieties and breeders for autocomplete and search. */
export async function GET() {
  const p = providers();
  return json({ zuechter: p.catalog.breeders(), sorten: p.catalog.varieties(), demodaten: p.demodaten });
}
