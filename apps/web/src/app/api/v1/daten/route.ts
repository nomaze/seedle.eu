import { json } from "@/server/http";
import { getBreedersList, getDmkRegions } from "@/server/services/dmk";

export const dynamic = "force-static";

export async function GET() {
  const regions = getDmkRegions();
  const breeders = getBreedersList();
  return json({ regions, breeders });
}
