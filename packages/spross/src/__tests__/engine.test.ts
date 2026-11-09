import type { ChatMessage, FarmContext, KnowledgeFact } from "@seedle/contracts";
import { describe, expect, it } from "vitest";
import { SprossEngine } from "../engine/engine";
import type { SprossMessageMeta, SprossStoragePort } from "../ports/storage";

class InMemoryMockStorage implements SprossStoragePort {
  public messages: ChatMessage[] = [];
  public facts: KnowledgeFact[] = [];
  public events: { event: string; meta: Record<string, unknown> }[] = [];

  async getFarmContext(userId: string): Promise<FarmContext> {
    return {
      userId,
      saison: 2027,
      heuteIso: "2026-10-15",
      fields: [],
      knownFacts: this.facts,
    };
  }

  async saveFact(_userId: string, fact: KnowledgeFact): Promise<void> {
    this.facts.push(fact);
  }

  async getHistory(_userId: string): Promise<ChatMessage[]> {
    return [...this.messages];
  }

  async saveMessage(_userId: string, msg: { role: "user" | "assistant"; text: string; meta?: SprossMessageMeta }): Promise<ChatMessage> {
    const row: ChatMessage & { meta?: SprossMessageMeta } = {
      id: `msg-${this.messages.length + 1}`,
      role: msg.role,
      text: msg.text,
      createdAt: new Date().toISOString(),
      meta: msg.meta,
    };
    this.messages.push(row);
    return row;
  }

  async trackInteraction(_userId: string, event: string, meta: Record<string, unknown>): Promise<void> {
    this.events.push({ event, meta });
  }
}

describe("SprossEngine (Isolated without Next.js / Drizzle)", () => {
  it("creates initial welcome greeting on empty conversation history", async () => {
    const storage = new InMemoryMockStorage();
    const engine = new SprossEngine(storage, {
      sprossAktiv: false,
      sprossModell: "scripted",
      planungssaison: 2027,
    });

    const conv = await engine.getConversation("user-1");
    expect(conv.messages.length).toBe(1);
    expect(conv.messages[0]!.role).toBe("assistant");
    expect(conv.messages[0]!.text).toContain("Hallo, ich bin Spross");
    expect(conv.modus).toBe("skript");
  });

  it("deterministically processes user replies and persists extracted agronomic facts in scripted mode", async () => {
    const storage = new InMemoryMockStorage();
    const engine = new SprossEngine(storage, {
      sprossAktiv: false,
      sprossModell: "scripted",
      planungssaison: 2027,
    });

    await engine.getConversation("user-1");
    const updated = await engine.sendMessage("user-1", { text: "Winterweizen" });

    expect(updated.messages.length).toBe(3);
    expect(updated.messages[1]!.role).toBe("user");
    expect(updated.messages[2]!.role).toBe("assistant");
    expect(storage.facts.length).toBe(1);
    expect(storage.facts[0]!.topic).toBe("fruchtfolge");
  });
});
