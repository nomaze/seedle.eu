import "server-only";

import type {
  ChatMessage,
  FarmContext,
  FarmFieldSummary,
  KnowledgeFact,
  KnowledgeTopic,
  PageViewState,
} from "@seedle/contracts";
import type { SprossMessageMeta, SprossStoragePort } from "@seedle/spross";
import { config } from "../config";
import { inMemoryStore } from "../db/in-memory-store";
import { newId } from "../ids";
import { providers } from "../providers";
import { getOrCreateFarm, listFields, listFieldYears } from "../services/fields";
import { factsFor, saveFact } from "../services/knowledge";
import { recommendationFor } from "../services/recommendations";
import { heuteIso } from "../services/season";
import { track } from "../services/tracking";

export class SprossDrizzleAdapter implements SprossStoragePort {
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
    const rawFields = await listFields(userId);
    const rawFacts = await factsFor(userId);
    const varieties = new Map(providers().catalog.varieties().map((v) => [v.id, v]));

    const fields: FarmFieldSummary[] = [];
    for (const f of rawFields.slice(0, 5)) {
      const rec = await recommendationFor(f);
      const topRecs = rec
        ? rec.sorten
            .slice(0, 3)
            .map(
              (s) =>
                `${s.rang}. ${s.variety.name} (${s.breeder.name}, Platz ${s.rang})`
            )
        : undefined;

      const prev = f.previousVarietyId
        ? varieties.get(f.previousVarietyId)?.name
        : f.previousVarietyText;

      const rawYears = await listFieldYears(f.id);
      const fieldYears = rawYears.map((fy) => ({
        id: fy.id,
        fieldId: fy.fieldId,
        jahr: fy.jahr,
        crop: fy.crop,
        varietyId: fy.varietyId,
        varietyText:
          fy.varietyText ??
          (fy.varietyId ? varieties.get(fy.varietyId)?.name ?? null : null),
        usage: fy.usage,
        status: fy.status,
        areaHa: fy.areaHa,
        createdAt: fy.createdAt.toISOString(),
        updatedAt: fy.updatedAt.toISOString(),
      }));

      fields.push({
        id: f.id,
        name: f.name,
        areaHa: f.areaHa,
        farmId: f.farmId ?? undefined,
        status: f.status,
        region: f.env.region,
        ackerzahl: f.env.ackerzahl,
        bodenart: f.env.bodenart,
        niederschlagVegetationMm: f.env.niederschlagVegetationMm,
        temperaturC: f.env.temperaturC,
        waermesumme: f.env.waermesumme,
        hoeheM: f.env.hoeheM,
        usage: f.usage ?? undefined,
        previousVariety: prev ?? undefined,
        selectedVariety: f.selectedVarietyId
          ? varieties.get(f.selectedVarietyId)?.name
          : undefined,
        topRecommendations: topRecs,
        fieldYears,
      });
    }

    const knownFacts: KnowledgeFact[] = rawFacts.map((r) => ({
      topic: r.topic as KnowledgeTopic,
      jahr: r.jahr ?? undefined,
      text: r.text,
    }));

    const farm = await getOrCreateFarm(userId);

    return {
      userId,
      farm: {
        id: farm.id,
        userId: farm.userId,
        name: farm.name,
        strasse: farm.strasse,
        plz: farm.plz,
        ort: farm.ort,
        lat: farm.lat,
        lon: farm.lon,
      },
      saison: config.planungssaison,
      heuteIso: await heuteIso(),
      seite: params?.seite,
      activeVariety: params?.activeVariety,
      activeRegion: params?.activeRegion,
      locale: params?.locale,
      pageState: params?.pageState,
      fields,
      knownFacts,
    };
  }

  async saveFact(
    userId: string,
    fact: KnowledgeFact,
    source: string,
    fieldId?: string | null
  ): Promise<void> {
    await saveFact(userId, fact, source as "spross" | "formular", fieldId);
  }

  async getHistory(userId: string): Promise<ChatMessage[]> {
    return inMemoryStore.getChatMessages(userId);
  }

  async saveMessage(
    userId: string,
    msg: {
      role: "user" | "assistant";
      text: string;
      meta?: SprossMessageMeta;
    }
  ): Promise<ChatMessage> {
    const id = newId("msg");
    const row: ChatMessage = {
      id,
      role: msg.role,
      text: msg.text,
      savedFacts: msg.meta?.savedFacts,
      uiActions: msg.meta?.uiActions,
      createdAt: new Date().toISOString(),
      ...(msg.meta ? { meta: msg.meta } : {}),
    };
    inMemoryStore.addChatMessage(userId, row);
    return row;
  }

  async clearHistory(userId: string): Promise<void> {
    inMemoryStore.clearChatMessages(userId);
  }

  async trackInteraction(
    userId: string,
    event: string,
    meta: Record<string, unknown>
  ): Promise<void> {
    await track(userId, event, meta);
  }
}
