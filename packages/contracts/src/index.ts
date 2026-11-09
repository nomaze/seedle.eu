import { z } from "zod";

/**
 * Permitted format for regional codes (e.g., "NI", "BY", "A21 Sande", "SH").
 */
export const REGION_CODE_REGEX = /^[A-Z0-9\s-]{1,10}$/;

/**
 * Knowledge domains structured and tracked by Spross.
 */
export const KnowledgeTopicSchema = z.enum([
  "fruchtfolge",
  "sorte",
  "ertrag",
  "erfahrung",
  "boden",
  "bewirtschaftung",
  "betrieb",
  "risikofokus",
  "zuechter_insight",
  "sonstiges",
]);
export type KnowledgeTopic = z.infer<typeof KnowledgeTopicSchema>;

export const KNOWLEDGE_TOPIC_LABEL: Record<KnowledgeTopic, string> = {
  fruchtfolge: "Fruchtfolge",
  sorte: "Sorten",
  ertrag: "Erträge",
  erfahrung: "Erfahrungen",
  boden: "Boden",
  bewirtschaftung: "Bewirtschaftung",
  betrieb: "Betrieb",
  risikofokus: "Risikofokus",
  zuechter_insight: "Züchterwissen",
  sonstiges: "Sonstiges",
};

/**
 * UI actions executable by Spross on the active client page.
 */
export const SprossUiActionTypeSchema = z.enum([
  "set_filter",
  "select_scenario",
  "open_variety_detail",
  "highlight_target",
  "navigate",
]);
export type SprossUiActionType = z.infer<typeof SprossUiActionTypeSchema>;

export const SprossUiActionSchema = z.object({
  type: SprossUiActionTypeSchema,
  label: z.string().min(1).max(120),
  target: z.string().max(100).optional(),
  href: z.string().max(300).optional(),
  varietyId: z.string().max(100).optional(),
  filterKey: z.enum(["usage", "reifegruppe", "zuechter", "suchbegriff", "tab", "sortierung"]).optional(),
  filterValue: z.string().max(100).optional(),
});
export type SprossUiAction = z.infer<typeof SprossUiActionSchema>;

/**
 * Live client page state passed from the frontend to Spross.
 */
export const PageViewStateSchema = z.object({
  route: z.string().max(300).optional(),
  stepLabel: z.string().max(150).optional(),
  nextBestAction: z.string().max(200).optional(),
  activeFilters: z.record(z.string(), z.string()).optional(),
  activeScenario: z.string().max(80).optional(),
  visibleVarieties: z.array(z.string().max(100)).max(15).optional(),
  availableTargets: z.array(z.string().max(100)).max(30).optional(),
  missingInfo: z.array(z.string().max(120)).max(10).optional(),
});
export type PageViewState = z.infer<typeof PageViewStateSchema>;

/**
 * Concrete empirical farm knowledge or observation.
 */
export const KnowledgeFactSchema = z.object({
  topic: KnowledgeTopicSchema,
  /** Season year referenced by this knowledge item, if applicable. */
  jahr: z.number().int().min(1990).max(2100).optional(),
  /** Single-sentence empirical knowledge in the farmer's terms. */
  text: z.string().min(2).max(500),
});
export type KnowledgeFact = z.infer<typeof KnowledgeFactSchema>;

/**
 * Inbound client message dispatched to the companion service.
 */
export const CompanionRequestSchema = z.object({
  text: z.string().min(1).max(2000),
  seite: z.string().max(300).optional(),
  activeVariety: z.string().max(100).optional(),
  activeRegion: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => !v || REGION_CODE_REGEX.test(v), {
      message: "Ungültiges Format für activeRegion",
    })
    .optional(),
  locale: z.enum(["de", "en"]).optional(),
  pageState: PageViewStateSchema.optional(),
});
export type CompanionRequest = z.infer<typeof CompanionRequestSchema>;

/**
 * Single chat message within the conversation history.
 */
export const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  text: z.string(),
  savedFacts: z.array(z.string()).optional(),
  uiActions: z.array(SprossUiActionSchema).optional(),
  createdAt: z.string().optional(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const KnownFactSummarySchema = z.object({
  topic: KnowledgeTopicSchema,
  label: z.string(),
  text: z.string(),
  jahr: z.number().optional(),
});
export type KnownFactSummary = z.infer<typeof KnownFactSummarySchema>;

/**
 * Outbound response from the companion to the client.
 */
export const CompanionResponseSchema = z.object({
  messages: z.array(ChatMessageSchema),
  vorschlaege: z.array(z.string()),
  modus: z.enum(["ki", "skript"]),
  uiActions: z.array(SprossUiActionSchema).optional(),
  knownFactsSummary: z.array(KnownFactSummarySchema).optional(),
});
export type CompanionResponse = z.infer<typeof CompanionResponseSchema>;

/**
 * Status indicators for agricultural fields.
 */
export const FieldStatusSchema = z.enum([
  "status-ok",
  "status-action",
  "status-problem",
  "status-urgent",
]);
export type FieldStatus = z.infer<typeof FieldStatusSchema>;

/**
 * Cultivation plan status for a field season.
 */
export const FieldYearStatusSchema = z.enum(["geplant", "gewaehlt", "gekauft"]);
export type FieldYearStatus = z.infer<typeof FieldYearStatusSchema>;

/**
 * Farm master record containing geographic and operational data.
 */
export const FarmSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  strasse: z.string().nullable().optional(),
  plz: z.string().nullable().optional(),
  ort: z.string().nullable().optional(),
  lat: z.number().nullable().optional(),
  lon: z.number().nullable().optional(),
  createdAt: z.union([z.string(), z.date()]).optional(),
  updatedAt: z.union([z.string(), z.date()]).optional(),
});
export type Farm = z.infer<typeof FarmSchema>;

/**
 * Cultivation record for a single field and calendar year.
 */
export const FieldYearSchema = z.object({
  id: z.string(),
  fieldId: z.string(),
  jahr: z.number().int(),
  crop: z.string(),
  varietyId: z.string().nullable().optional(),
  varietyText: z.string().nullable().optional(),
  usage: z.string().nullable().optional(),
  status: FieldYearStatusSchema,
  areaHa: z.number().nullable().optional(),
  createdAt: z.union([z.string(), z.date()]).optional(),
  updatedAt: z.union([z.string(), z.date()]).optional(),
});
export type FieldYear = z.infer<typeof FieldYearSchema>;

/**
 * Summarized field profile in the agricultural context.
 */
export const FarmFieldSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  areaHa: z.number(),
  farmId: z.string().nullable().optional(),
  status: FieldStatusSchema.optional(),
  region: z.string().optional(),
  ackerzahl: z.number().optional(),
  bodenart: z.string().optional(),
  niederschlagVegetationMm: z.number().optional(),
  temperaturC: z.number().optional(),
  waermesumme: z.number().optional(),
  hoeheM: z.number().optional(),
  usage: z.string().optional(),
  previousVariety: z.string().optional(),
  selectedVariety: z.string().optional(),
  topRecommendations: z.array(z.string()).optional(),
  fieldYears: z.array(FieldYearSchema).optional(),
});
export type FarmFieldSummary = z.infer<typeof FarmFieldSummarySchema>;

/**
 * Aggregated farm context for prompt assembly and domain heuristics.
 */
export const FarmContextSchema = z.object({
  userId: z.string(),
  farm: FarmSchema.optional(),
  saison: z.number(),
  heuteIso: z.string(),
  seite: z.string().optional(),
  activeVariety: z.string().optional(),
  activeRegion: z.string().optional(),
  locale: z.enum(["de", "en"]).optional(),
  pageState: PageViewStateSchema.optional(),
  fields: z.array(FarmFieldSummarySchema),
  knownFacts: z.array(KnowledgeFactSchema),
});
export type FarmContext = z.infer<typeof FarmContextSchema>;
