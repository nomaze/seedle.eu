/**
 * Extended field agronomy and farmer preference store (`fieldAgronomyProfile`).
 * Persists soil characteristics, organic fertilization, tillage depth, crop rotation,
 * and variety strategy per parcel in browser `localStorage` with deterministic defaults
 * and strict field-by-field runtime schema validation.
 */

export type SoilTypeOption =
  | "sand"
  | "sandiger_lehm"
  | "lehm"
  | "toniger_lehm"
  | "moor";

export type TrafficabilityOption = "frueh" | "normal" | "spaet";

export type NutrientStatusOption =
  | "ausgewogen"
  | "pk_knapp"
  | "spurenelemente_mangel";

export type TillageOption = "pflug" | "grubber" | "direktsaat";

export type StrategyOption = "stabilitaet" | "high_performer" | "ausgewogen";

export type MaturityGroupOption =
  | "frueh"
  | "mittelfrueh"
  | "spaet"
  | "automatisch";

export type SowingWindowOption = "frueh" | "normal" | "spaet" | "frei";

export type HarvestWindowOption = "frueh" | "normal" | "frei";

export type PlantPriorityOption =
  | "standfestigkeit"
  | "trockenstress"
  | "jugendentwicklung"
  | "gesundheit_fusarium"
  | "staerke_energiedichte"
  | "stay_green";

export type AgronomyUsageOption = "koernermais" | "silomais" | "biogasmais";

export type RiskAppetiteOption = 1 | 2 | 3;

export interface FieldAgronomyProfile {
  fieldId: string;
  usage: AgronomyUsageOption;
  // Step 1: Soil & management (/boden)
  soilType: SoilTypeOption;
  humusPercent: number;
  nfkMm: number;
  trafficability: TrafficabilityOption;
  organicFertilizers: string[];
  nutrientStatus: NutrientStatusOption;
  tillage: TillageOption;
  irrigationPossible: boolean;
  irrigationPeriod: string;
  previousCrop: string;
  catchCrop: string;
  fieldNotes: string;
  // Step 2: Farmer priorities (/wichtig)
  strategy: StrategyOption;
  maturityGroup: MaturityGroupOption;
  sowingWindow: SowingWindowOption;
  harvestWindow: HarvestWindowOption;
  priorities: PlantPriorityOption[];
  referenceVariety: string;
  experienceNotes: string;
  riskAppetite: RiskAppetiteOption;
  updatedAt: string;
}

export const SOIL_TYPE_LABELS: Record<
  SoilTypeOption,
  { label: string; short: string; defaultHumus: number; defaultNfkMm: number; nfkText: string }
> = {
  sand: {
    label: "Sand (S / lS)",
    short: "Sandboden",
    defaultHumus: 1.5,
    defaultNfkMm: 95,
    nfkText: "Niedrig bis mittel (ca. 95 mm nFK)",
  },
  sandiger_lehm: {
    label: "Sandiger Lehm (sL)",
    short: "Sandiger Lehm",
    defaultHumus: 2.2,
    defaultNfkMm: 165,
    nfkText: "Mittel bis hoch (ca. 165 mm nFK)",
  },
  lehm: {
    label: "Lehm (L / uL)",
    short: "Lehmboden",
    defaultHumus: 2.6,
    defaultNfkMm: 195,
    nfkText: "Hoch (ca. 195 mm nFK)",
  },
  toniger_lehm: {
    label: "Toniger Lehm (tL / T)",
    short: "Toniger Lehm",
    defaultHumus: 2.9,
    defaultNfkMm: 180,
    nfkText: "Hoch, langsam erwärmend (ca. 180 mm nFK)",
  },
  moor: {
    label: "Moor / Anmoor",
    short: "Moorboden",
    defaultHumus: 8.5,
    defaultNfkMm: 220,
    nfkText: "Sehr hoch (ca. 220 mm nFK)",
  },
};

export const TRAFFICABILITY_LABELS: Record<TrafficabilityOption, string> = {
  frueh: "Früh & leicht befahrbar (Aussaat ab Anfang/Mitte April)",
  normal: "Gut befahrbar (Aussaat ab Mitte April möglich)",
  spaet: "Spät & schwerer Boden (langsame Erwärmung im Frühjahr)",
};

export const NUTRIENT_STATUS_KEYS: Record<NutrientStatusOption, true> = {
  ausgewogen: true,
  pk_knapp: true,
  spurenelemente_mangel: true,
};

export const MATURITY_GROUP_KEYS: Record<MaturityGroupOption, true> = {
  frueh: true,
  mittelfrueh: true,
  spaet: true,
  automatisch: true,
};

export const SOWING_WINDOW_KEYS: Record<SowingWindowOption, true> = {
  frueh: true,
  normal: true,
  spaet: true,
  frei: true,
};

export const HARVEST_WINDOW_KEYS: Record<HarvestWindowOption, true> = {
  frueh: true,
  normal: true,
  frei: true,
};

export const TILLAGE_BIOLOGY_HINT: Record<
  TillageOption,
  { label: string; biologyHint: string }
> = {
  pflug: {
    label: "Pflug (wendend, 20–25 cm)",
    biologyHint:
      "Sauberes Saatbett und schnelle Bodenerwärmung; mittlere Regenwurm-Aktivität – schnelle Jugendentwicklung hilft gegen Verschlämmung.",
  },
  grubber: {
    label: "Grubber (Mulchsaat, 12–18 cm)",
    biologyHint:
      "Hohe Bodenlebewesen- & Regenwurm-Aktivität durch Mulchauflage; guter Verdunstungsschutz im Sommer, erfordert frohwüchsige Sorten mit guter Fusarium-Toleranz.",
  },
  direktsaat: {
    label: "Flach / Strip-Till / Direktsaat (< 8 cm)",
    biologyHint:
      "Maximale Regenwurm-Aktivität und stabile Makroporen für beste Wasserinfiltration; kühlerer Boden im April verlangt höchste Kältetoleranz in der Jugend.",
  },
};

export const STRATEGY_LABELS: Record<StrategyOption, { title: string; short: string; desc: string }> = {
  stabilitaet: {
    title: "Stabilität (Sichere Bank)",
    short: "Stabilität",
    desc: "Umweltstabil und ertragstreu auf dem Feld: sichere Leistung auch in Stress- und Trockenjahren.",
  },
  high_performer: {
    title: "Plastizität (High-Performer)",
    short: "Plastizität (High-Performer)",
    desc: "Hohe Plastizität auf guten Böden und bei guter Wasserführung: nutzt Top-Bedingungen für Spitzenerträge maximal aus.",
  },
  ausgewogen: {
    title: "Ausgewogener Mix",
    short: "Ausgewogener Mix",
    desc: "Kombination aus hoher Umweltstabilität und guter Reaktion auf leistungsstarke Standorte.",
  },
};

export const PLANT_PRIORITY_LABELS: Record<PlantPriorityOption, string> = {
  standfestigkeit: "Standfestigkeit (Kein Lager vor der Ernte)",
  trockenstress: "Trockenstress- & Hitzetoleranz",
  jugendentwicklung: "Schnelle Jugendentwicklung (Kältetoleranz im Frühjahr)",
  gesundheit_fusarium: "Gesundheit & Kolbenfusarium-Resistenz",
  staerke_energiedichte: "Hoher Stärkegehalt / Energiedichte (MJ NEL)",
  stay_green: "Stay-Green (Langes Erntefenster)",
};

const STORAGE_KEY_PREFIX = "seedle_agronomy_profile_v1_";

export function normalizeAgronomyUsage(raw?: string | null): AgronomyUsageOption {
  if (raw === "koernermais") return "koernermais";
  if (raw === "biogasmais" || raw === "biogas") return "biogasmais";
  return "silomais";
}

export function getAgronomyUsageLabel(usage?: string | null): string {
  const norm = normalizeAgronomyUsage(usage);
  if (norm === "koernermais") return "Körnermais";
  if (norm === "biogasmais") return "Biogasmais";
  return "Silomais";
}

export function createDefaultAgronomyProfile(
  fieldId: string,
  usage: AgronomyUsageOption = "silomais",
): FieldAgronomyProfile {
  return {
    fieldId,
    usage: normalizeAgronomyUsage(usage),
    soilType: "sandiger_lehm",
    humusPercent: 2.2,
    nfkMm: 165,
    trafficability: "normal",
    organicFertilizers: ["Rindergülle"],
    nutrientStatus: "ausgewogen",
    tillage: "grubber",
    irrigationPossible: false,
    irrigationPeriod: "Juni–August (Blüte & Kornausbildung)",
    previousCrop: "Winterweizen",
    catchCrop: "Senf / Ölrettich / Phacelia",
    fieldNotes: "",
    strategy: "ausgewogen",
    maturityGroup: "automatisch",
    sowingWindow: "normal",
    harvestWindow: "normal",
    priorities: ["standfestigkeit", "trockenstress"],
    referenceVariety: "AW Talkrone",
    experienceNotes: "",
    riskAppetite: 2,
    updatedAt: new Date().toISOString(),
  };
}

export function loadFieldAgronomyProfile(
  fieldId: string,
  usage: AgronomyUsageOption = "silomais",
): FieldAgronomyProfile {
  const fallback = createDefaultAgronomyProfile(fieldId, usage);
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${fieldId}`);
    if (!raw) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return fallback;
    }
    const r = parsed as Record<string, unknown>;

    const validUsage: AgronomyUsageOption =
      r.usage === "koernermais" || r.usage === "silomais" || r.usage === "biogasmais"
        ? r.usage
        : fallback.usage;

    const validSoilType: SoilTypeOption =
      typeof r.soilType === "string" && r.soilType in SOIL_TYPE_LABELS
        ? (r.soilType as SoilTypeOption)
        : fallback.soilType;

    const validHumus =
      typeof r.humusPercent === "number" && Number.isFinite(r.humusPercent) && r.humusPercent >= 0
        ? r.humusPercent
        : fallback.humusPercent;

    const validNfk =
      typeof r.nfkMm === "number" && Number.isFinite(r.nfkMm) && r.nfkMm >= 0
        ? r.nfkMm
        : fallback.nfkMm;

    const validTrafficability: TrafficabilityOption =
      typeof r.trafficability === "string" && r.trafficability in TRAFFICABILITY_LABELS
        ? (r.trafficability as TrafficabilityOption)
        : fallback.trafficability;

    const validOrganicFertilizers = Array.isArray(r.organicFertilizers)
      ? r.organicFertilizers.filter((x): x is string => typeof x === "string")
      : fallback.organicFertilizers;

    const validNutrientStatus: NutrientStatusOption =
      typeof r.nutrientStatus === "string" && r.nutrientStatus in NUTRIENT_STATUS_KEYS
        ? (r.nutrientStatus as NutrientStatusOption)
        : fallback.nutrientStatus;

    const validTillage: TillageOption =
      typeof r.tillage === "string" && r.tillage in TILLAGE_BIOLOGY_HINT
        ? (r.tillage as TillageOption)
        : fallback.tillage;

    const validIrrigationPossible =
      typeof r.irrigationPossible === "boolean"
        ? r.irrigationPossible
        : fallback.irrigationPossible;

    const validIrrigationPeriod =
      typeof r.irrigationPeriod === "string" && r.irrigationPeriod.trim().length > 0
        ? r.irrigationPeriod
        : fallback.irrigationPeriod;

    const validPreviousCrop =
      typeof r.previousCrop === "string" && r.previousCrop.trim().length > 0
        ? r.previousCrop
        : fallback.previousCrop;

    const validCatchCrop =
      typeof r.catchCrop === "string" && r.catchCrop.trim().length > 0
        ? r.catchCrop
        : fallback.catchCrop;

    const validFieldNotes =
      typeof r.fieldNotes === "string" ? r.fieldNotes.slice(0, 240) : fallback.fieldNotes;

    const validStrategy: StrategyOption =
      typeof r.strategy === "string" && r.strategy in STRATEGY_LABELS
        ? (r.strategy as StrategyOption)
        : fallback.strategy;

    const validMaturityGroup: MaturityGroupOption =
      typeof r.maturityGroup === "string" && r.maturityGroup in MATURITY_GROUP_KEYS
        ? (r.maturityGroup as MaturityGroupOption)
        : fallback.maturityGroup;

    const validSowingWindow: SowingWindowOption =
      typeof r.sowingWindow === "string" && r.sowingWindow in SOWING_WINDOW_KEYS
        ? (r.sowingWindow as SowingWindowOption)
        : fallback.sowingWindow;

    const validHarvestWindow: HarvestWindowOption =
      typeof r.harvestWindow === "string" && r.harvestWindow in HARVEST_WINDOW_KEYS
        ? (r.harvestWindow as HarvestWindowOption)
        : fallback.harvestWindow;

    const validPriorities: PlantPriorityOption[] = Array.isArray(r.priorities)
      ? r.priorities.filter(
          (x): x is PlantPriorityOption =>
            typeof x === "string" && x in PLANT_PRIORITY_LABELS,
        )
      : fallback.priorities;

    const validReferenceVariety =
      typeof r.referenceVariety === "string"
        ? r.referenceVariety.slice(0, 80)
        : fallback.referenceVariety;

    const validExperienceNotes =
      typeof r.experienceNotes === "string"
        ? r.experienceNotes.slice(0, 240)
        : fallback.experienceNotes;

    const validRiskAppetite: RiskAppetiteOption =
      r.riskAppetite === 1 || r.riskAppetite === 2 || r.riskAppetite === 3
        ? r.riskAppetite
        : fallback.riskAppetite;

    const validUpdatedAt =
      typeof r.updatedAt === "string" && r.updatedAt.length > 0
        ? r.updatedAt
        : fallback.updatedAt;

    return {
      fieldId,
      usage: validUsage,
      soilType: validSoilType,
      humusPercent: validHumus,
      nfkMm: validNfk,
      trafficability: validTrafficability,
      organicFertilizers: validOrganicFertilizers,
      nutrientStatus: validNutrientStatus,
      tillage: validTillage,
      irrigationPossible: validIrrigationPossible,
      irrigationPeriod: validIrrigationPeriod,
      previousCrop: validPreviousCrop,
      catchCrop: validCatchCrop,
      fieldNotes: validFieldNotes,
      strategy: validStrategy,
      maturityGroup: validMaturityGroup,
      sowingWindow: validSowingWindow,
      harvestWindow: validHarvestWindow,
      priorities: validPriorities,
      referenceVariety: validReferenceVariety,
      experienceNotes: validExperienceNotes,
      riskAppetite: validRiskAppetite,
      updatedAt: validUpdatedAt,
    };
  } catch {
    return fallback;
  }
}

export function saveFieldAgronomyProfile(profile: FieldAgronomyProfile): void {
  if (typeof window === "undefined") return;
  try {
    const next: FieldAgronomyProfile = {
      ...profile,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${profile.fieldId}`, JSON.stringify(next));
  } catch {
    // Ignore storage quota errors in restricted browsing modes
  }
}

export function formatAgronomyRecapSummary(profile: FieldAgronomyProfile): string {
  const soil = SOIL_TYPE_LABELS[profile.soilType]?.short ?? "Sandiger Lehm";
  const traffic =
    profile.trafficability === "frueh"
      ? "Früh befahrbar"
      : profile.trafficability === "spaet"
        ? "Spät befahrbar"
        : "Gute Befahrbarkeit";
  const water = profile.irrigationPossible ? "Bewässerung möglich" : "Regenfeldbau";
  const strat = STRATEGY_LABELS[profile.strategy]?.short ?? "Ausgewogener Mix";
  return `${soil} · ${traffic} · ${water} · Fokus: ${strat}`;
}
