import "server-only";

/**
 * Central application configuration.
 */
export const config = {
  /** Target planning season evaluated by variety recommendation algorithms. */
  planungssaison: Number(process.env.PLANUNGSSAISON ?? 2027),

  /**
   * Reference date assumed as current day in "Your Field Today" demo views.
   * Enables reproducible in-season demonstrations.
   */
  demoHeute: process.env.DEMO_HEUTE ?? "2027-06-18",

  /** Default sowing date when unspecified by farmer. */
  standardAussaat: (saison: number) => `${saison}-04-25`,

  /** Directory path for local temporary and upload files. */
  datenVerzeichnis: process.env.DATA_DIR ?? ".data",

  /** LLM model identifier for Spross assistant. */
  sprossModell: process.env.SPROSS_MODELL ?? "scripted",
  sprossAktiv: false,

  /**
   * Visibility flag for demo settings and multi-brand switcher.
   */
  demoEinstellungen: process.env.NODE_ENV !== "production" || process.env.DEMO_EINSTELLUNGEN === "1",
} as const;
