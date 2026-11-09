// Stateless helper functions (No Server Actions)

import { updateTag } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { DEMO_STANDARD, MARKEN, type DemoEinstellungen, type Marke } from "@/lib/demo";
import { config } from "@/server/config";
import { DEMO_TAG, speichereDemoEinstellungen } from "@/server/demo";

/**
 * Persists demo settings (brand appearance, features, simulated date)
 * across the instance. Invalidate cache tags immediately so pages update.
 */
export async function speichereDemo(formData: FormData) {
  if (!config.demoEinstellungen) notFound();

  const aktion = formData.get("aktion");
  if (aktion === "standard") {
    await speichereDemoEinstellungen(DEMO_STANDARD);
    updateTag(DEMO_TAG);
    redirect("/demo?gespeichert=1");
  }

  const markeRaw = String(formData.get("marke") ?? "");
  const normalizedRaw = markeRaw === "seedle" ? "cream" : markeRaw;
  const marke: Marke = (MARKEN as readonly string[]).includes(normalizedRaw)
    ? (normalizedRaw as Marke)
    : DEMO_STANDARD.marke;

  // When a preset button is clicked directly, it takes precedence over freeform date input
  const presetDatum = formData.get("presetDatum");
  const datumRaw = String(presetDatum || formData.get("datum") || "").trim();
  const datumMatch = /^\d{4}-\d{2}-\d{2}$/.test(datumRaw) ? datumRaw : DEMO_STANDARD.datum;

  const authModusRaw = String(formData.get("authModus") ?? "");
  const authModus = authModusRaw === "auth0" ? "auth0" : "fake";

  const einstellungen: DemoEinstellungen = {
    marke,
    saatgutKauf: formData.get("saatgutKauf") === "an",
    spross: formData.get("spross") === "an",
    teamAnruf: formData.get("teamAnruf") === "an",
    stoebern: formData.get("stoebern") === "an",
    anmeldung: formData.get("anmeldung") === "an",
    showBackendStatusBadge: formData.has("showBackendStatusBadge")
      ? formData.get("showBackendStatusBadge") === "an"
      : DEMO_STANDARD.showBackendStatusBadge,
    datum: datumMatch,
    authModus,
  };

  await speichereDemoEinstellungen(einstellungen);
  updateTag(DEMO_TAG);
  redirect("/demo?gespeichert=1");
}
