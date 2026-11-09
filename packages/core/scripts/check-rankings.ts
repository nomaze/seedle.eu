// Verifies demo rankings across trial sites: Run via `npx tsx scripts/check-rankings.ts`
import { createDemoProviders, recommend } from "../src/index";
import { DEMO_SITES } from "../src/demo/sites";

const p = createDemoProviders();
for (const usage of ["koernermais", "silomais"] as const) {
  console.log(`\n== ${usage}`);
  for (const site of DEMO_SITES) {
    const env = p.environment.environmentAt(site.point);
    const r = await recommend(p, { id: site.id, point: site.point, env }, usage, 2027);
    const top = r.sorten.slice(0, 3).map((s) => `${s.variety.name} ${s.erwarteterWertEurHa}`).join(" | ");
    const dry = r.sorten.find((s) => s.rangJeSzenario["trocken-heiss"] === 1)?.variety.name;
    const p0 = r.sorten[0]!.predictions.find((x) => x.scenarioId === "normal")!;
    console.log(`${site.name.padEnd(14)} WS ${env.waermesumme} AZ ${env.ackerzahl} | ${top} | trocken#1 ${dry} | ${p0.kornertragDtHa ?? p0.trockenmasseDtHa} ${p0.kornfeuchteProzent ?? p0.staerkeProzent}`);
  }
}
