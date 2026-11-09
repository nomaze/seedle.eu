import "server-only";

import { explain, recommend, type Explanation, type Recommendation, type ScenarioId, type Usage } from "@seedle/core";
import { config } from "../config";
import { providers } from "../providers";
import { toFieldContext, type Field } from "./fields";

export async function recommendationFor(
  field: Field,
  sortierung: ScenarioId | "gewichtet" = "gewichtet",
): Promise<Recommendation | null> {
  const effectiveUsage: Usage =
    field.usage === "koernermais" ? "koernermais" : "silomais";
  return recommend(providers(), toFieldContext(field), effectiveUsage, config.planungssaison, sortierung);
}

export async function explanationFor(field: Field, varietyId: string): Promise<Explanation | null> {
  const effectiveUsage: Usage =
    field.usage === "koernermais" ? "koernermais" : "silomais";
  try {
    return await explain(providers(), {
      field: toFieldContext(field),
      varietyId,
      usage: effectiveUsage,
      bisherigeSorteId: field.previousVarietyId ?? undefined,
      saison: config.planungssaison,
    });
  } catch {
    return null;
  }
}

/** Total count of empirical trial observations for landing page statistics. */
export function trialResultCount(): number {
  return providers().trials.results({}).length;
}
