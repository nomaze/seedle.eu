import type {
  ChatMessage,
  FarmContext,
  KnowledgeFact,
  PageViewState,
} from "@seedle/contracts";
import { describe, expect, it } from "vitest";
import {
  extractImplicitFactsFromInteraction,
  getBreederInsightForVariety,
  getRelevantBreederKnowledge,
} from "../domain/breeder-knowledge";
import { SprossEngine } from "../engine/engine";
import { scriptedReply } from "../engine/scripted";
import type { SprossMessageMeta, SprossStoragePort } from "../ports/storage";

class V2MockStorage implements SprossStoragePort {
  public messages: ChatMessage[] = [];
  public facts: KnowledgeFact[] = [];

  async getFarmContext(
    userId: string,
    params?: {
      seite?: string;
      activeVariety?: string;
      activeRegion?: string;
      locale?: "de" | "en";
      pageState?: PageViewState;
    }
  ): Promise<FarmContext> {
    return {
      userId,
      saison: 2027,
      heuteIso: "2026-10-25",
      seite: params?.seite,
      activeVariety: params?.activeVariety,
      activeRegion: params?.activeRegion,
      locale: params?.locale,
      pageState: params?.pageState,
      fields: [
        {
          id: "fld_1",
          name: "Nordacker",
          areaHa: 18.5,
          bodenart: "Sandboden",
          usage: "silomais",
          topRecommendations: ["1. AW Talkrone (AckerWerk Genetik), erwartet 1420 €/ha"],
          fieldYears: [
            {
              id: "fy_1",
              fieldId: "fld_1",
              jahr: 2026,
              crop: "winterweizen",
              status: "gewaehlt",
            },
          ],
        },
      ],
      knownFacts: [...this.facts],
    };
  }

  async saveFact(_userId: string, fact: KnowledgeFact): Promise<void> {
    this.facts.push(fact);
  }

  async getHistory(_userId: string): Promise<ChatMessage[]> {
    return [...this.messages];
  }

  async saveMessage(
    _userId: string,
    msg: { role: "user" | "assistant"; text: string; meta?: SprossMessageMeta }
  ): Promise<ChatMessage> {
    const row: ChatMessage & { meta?: SprossMessageMeta } = {
      id: `msg-${this.messages.length + 1}`,
      role: msg.role,
      text: msg.text,
      savedFacts: msg.meta?.savedFacts,
      uiActions: msg.meta?.uiActions,
      createdAt: new Date().toISOString(),
      meta: msg.meta,
    };
    this.messages.push(row);
    return row;
  }

  async clearHistory(_userId: string): Promise<void> {
    this.messages = [];
  }
}

describe("Spross 2.0: Breeder Knowledge Engine", () => {
  it("delivers curated breeder insight profiles in German and English", () => {
    const de = getBreederInsightForVariety("AW Talkrone", "de");
    expect(de).not.toBeNull();
    expect(de?.profile.reifezahl).toBe(240);
    expect(de?.summary).toContain("AW Talkrone");
    expect(de?.details.kornTyp).toContain("Zahnmais");

    const en = getBreederInsightForVariety("AW Edelkorn", "en");
    expect(en).not.toBeNull();
    expect(en?.summary).toContain("FAO 230");
    expect(en?.details.kornTyp).toContain("Flint");
  });

  it("extracts relevant breeder knowledge from FarmContext, visible varieties, and farmer query", () => {
    const ctx: FarmContext = {
      userId: "u1",
      saison: 2027,
      heuteIso: "2026-10-25",
      pageState: {
        visibleVarieties: ["AW Riedstern", "AH 3418"],
        activeScenario: "trocken",
      },
      fields: [],
      knownFacts: [],
    };

    const insights = getRelevantBreederKnowledge(ctx, "Wie sieht es mit Dry-Down aus?");
    expect(insights.some((i) => i.includes("AW Riedstern"))).toBe(true);
    expect(insights.some((i) => i.includes("AH 3418"))).toBe(true);
    expect(insights.some((i) => i.includes("Dry-Down"))).toBe(true);
  });

  it("identifies implicit farm and risk facts idempotently without duplicate records", () => {
    const existing: KnowledgeFact[] = [];
    const extracted = extractImplicitFactsFromInteraction(
      {
        text: "Wir haben leichten Sandboden ohne Beregnung und hatten oft Trockenstress.",
      },
      existing
    );
    expect(extracted.some((f) => f.topic === "risikofokus")).toBe(true);
    expect(extracted.some((f) => f.topic === "bewirtschaftung")).toBe(true);
    expect(extracted.some((f) => f.topic === "boden")).toBe(true);

    const second = extractImplicitFactsFromInteraction(
      {
        text: "Wir haben leichten Sandboden ohne Beregnung und hatten oft Trockenstress.",
      },
      extracted
    );
    expect(second.length).toBe(0);
  });
});

describe("Spross 2.0: Live Page Co-Pilot & Deterministic Scripted Engine Integration", () => {
  it("generates UI actions for filter, scenario, and orientation questions in scripted mode (DE & EN)", () => {
    const deFilter = scriptedReply({
      text: "Zeig mir AckerWerk Sorten",
      saison: 2027,
      bekannteKeys: new Set(),
      locale: "de",
    });
    expect(deFilter.uiActions?.[0]?.type).toBe("set_filter");
    expect(deFilter.uiActions?.[0]?.filterValue).toBe("ackerwerk");

    const enNext = scriptedReply({
      text: "What should I do next on this page?",
      saison: 2027,
      bekannteKeys: new Set(),
      locale: "en",
      pageState: {
        route: "/sorten",
        stepLabel: "Variety Comparison",
        nextBestAction: "Select your favorite hybrid for Nordacker",
        availableTargets: ["ranking-table"],
      },
    });
    expect(enNext.text).toContain("Variety Comparison");
    expect(enNext.uiActions?.[0]?.type).toBe("highlight_target");
  });

  it("integrates FarmContext and provides deterministic recommendations in SprossEngine", async () => {
    const storage = new V2MockStorage();
    const engine = new SprossEngine(storage, {
      sprossAktiv: false,
      sprossModell: "scripted",
      planungssaison: 2027,
    });

    const res = await engine.sendMessage("user-1", {
      text: "Was empfiehlst du für Trockenheit?",
      locale: "de",
    });

    expect(res.messages.length).toBe(2);
    expect(res.messages[1]!.role).toBe("assistant");
    expect(res.messages[1]!.text).toContain("trockenen");
  });
});
