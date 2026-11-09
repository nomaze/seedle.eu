import type {
  ChatMessage,
  FarmContext,
  KnowledgeFact,
  PageViewState,
  SprossUiAction,
} from "@seedle/contracts";

export interface SprossMessageMeta {
  askedTopic?: string;
  savedFacts?: string[];
  vorschlaege?: string[];
  uiActions?: SprossUiAction[];
}

/**
 * Hexagonal storage port for Spross companion engine.
 * Decouples persistence mechanisms (Drizzle, PGlite, in-memory test mocks).
 */
export interface SprossStoragePort {
  /** Loads aggregated agricultural farm and field context for the given user. */
  getFarmContext(
    userId: string,
    params?: {
      seite?: string;
      activeVariety?: string;
      activeRegion?: string;
      locale?: "de" | "en";
      pageState?: PageViewState;
    }
  ): Promise<FarmContext>;

  /** Persists empirical agronomic knowledge fact extracted by Spross or heuristics. */
  saveFact(
    userId: string,
    fact: KnowledgeFact,
    source: string,
    fieldId?: string | null
  ): Promise<void>;

  /** Retrieves chat message history in ascending chronological order. */
  getHistory(userId: string): Promise<ChatMessage[]>;

  /** Persists a newly exchanged message and returns the stored domain object. */
  saveMessage(
    userId: string,
    message: {
      role: "user" | "assistant";
      text: string;
      meta?: SprossMessageMeta;
    }
  ): Promise<ChatMessage>;

  /** Resets chat history (for testing or user resets) while retaining stored farm knowledge. */
  clearHistory?(userId: string): Promise<void>;

  /** Optional telemetry tracking hook for user interaction analytics. */
  trackInteraction?(
    userId: string,
    event: string,
    meta: Record<string, unknown>
  ): Promise<void>;
}
