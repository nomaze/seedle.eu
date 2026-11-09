import type {
  ChatMessage,
  CompanionRequest,
  CompanionResponse,
  KnowledgeFact,
  KnowledgeTopic,
  SprossUiAction,
} from "@seedle/contracts";
import { KNOWLEDGE_TOPIC_LABEL } from "@seedle/contracts";
import { sanitizeVariety, validateRegion } from "../domain/sanitizer";
import type { SprossMessageMeta, SprossStoragePort } from "../ports/storage";
import {
  knownKeysFromFacts,
  openingMessage,
  scriptedReply,
  scriptQuestions,
  type ScriptQuestion,
} from "./scripted";

export interface SprossEngineConfig {
  sprossAktiv: boolean;
  sprossModell?: string;
  planungssaison: number;
}

const factLabel = (f: KnowledgeFact) =>
  `${KNOWLEDGE_TOPIC_LABEL[f.topic as KnowledgeTopic] ?? f.topic}${f.jahr ? ` ${f.jahr}` : ""}: ${f.text}`;

export class SprossEngine {
  constructor(
    private readonly storage: SprossStoragePort,
    private readonly config: SprossEngineConfig,
    _client?: unknown
  ) {}

  public async getConversation(
    userId: string,
    locale?: "de" | "en"
  ): Promise<CompanionResponse> {
    let rows = await this.storage.getHistory(userId);
    const context = await this.storage.getFarmContext(userId, { locale });

    if (rows.length === 0) {
      const opening = openingMessage(
        this.config.planungssaison,
        knownKeysFromFacts(context.knownFacts, this.config.planungssaison),
        locale ?? context.locale ?? "de"
      );

      await this.storage.saveMessage(userId, {
        role: "assistant",
        text: opening.text,
        meta: {
          askedTopic: opening.askedKey,
          vorschlaege: opening.vorschlaege,
          uiActions: opening.uiActions,
        },
      });
      rows = await this.storage.getHistory(userId);
    }

    const enrichedRows: ChatMessage[] = rows.map((r) => {
      const meta = (r as { meta?: SprossMessageMeta }).meta;
      return {
        ...r,
        ...(meta?.uiActions && !r.uiActions ? { uiActions: meta.uiActions } : {}),
      };
    });

    const last = enrichedRows[enrichedRows.length - 1];
    const lastMeta = (last as { meta?: SprossMessageMeta } | undefined)?.meta;
    const asked = scriptQuestions(this.config.planungssaison).find(
      (q: ScriptQuestion) => q.key === lastMeta?.askedTopic
    );

    const vorschlaege =
      last?.role === "assistant"
        ? (lastMeta?.vorschlaege ?? asked?.vorschlaege ?? [])
        : [];
    const uiActions =
      last?.role === "assistant"
        ? (last.uiActions ?? lastMeta?.uiActions ?? [])
        : [];

    const knownFactsSummary = context.knownFacts.map((f) => ({
      topic: f.topic,
      label: KNOWLEDGE_TOPIC_LABEL[f.topic as KnowledgeTopic] ?? f.topic,
      text: f.text,
      ...(f.jahr !== undefined ? { jahr: f.jahr } : {}),
    }));

    return {
      messages: enrichedRows,
      vorschlaege,
      modus: "skript",
      uiActions,
      knownFactsSummary,
    };
  }

  public async resetConversation(
    userId: string,
    locale?: "de" | "en"
  ): Promise<CompanionResponse> {
    if (this.storage.clearHistory) {
      await this.storage.clearHistory(userId);
    }
    return this.getConversation(userId, locale);
  }

  public async sendMessage(
    userId: string,
    req: CompanionRequest
  ): Promise<CompanionResponse> {
    const clean = req.text.trim().slice(0, 2000);
    if (!clean) return this.getConversation(userId, req.locale);

    const safeKontext = {
      activeVariety: sanitizeVariety(req.activeVariety),
      activeRegion: validateRegion(req.activeRegion),
    };

    const history = await this.storage.getHistory(userId);
    const lastAssistant = [...history].reverse().find((m) => m.role === "assistant");
    const lastMetaAsked = (lastAssistant as { meta?: SprossMessageMeta } | undefined)?.meta
      ?.askedTopic;

    await this.storage.saveMessage(userId, {
      role: "user",
      text: clean,
    });

    const fieldId =
      (req.pageState?.route ?? req.seite)?.match(/\/feld\/(fld_[\w-]+)/)?.[1] ?? null;
    const rawFarmContext = await this.storage.getFarmContext(userId, {
      seite: req.pageState?.route ?? req.seite,
      activeVariety: safeKontext.activeVariety,
      activeRegion: safeKontext.activeRegion,
      locale: req.locale,
      pageState: req.pageState,
    });

    const farmContext = {
      ...rawFarmContext,
      knownFacts: [...rawFarmContext.knownFacts],
      seite: req.pageState?.route ?? req.seite ?? rawFarmContext.seite,
      activeVariety: safeKontext.activeVariety ?? rawFarmContext.activeVariety,
      activeRegion: safeKontext.activeRegion ?? rawFarmContext.activeRegion,
      locale: req.locale ?? rawFarmContext.locale,
      pageState: req.pageState ?? rawFarmContext.pageState,
    };

    if (this.storage.trackInteraction) {
      await this.storage.trackInteraction(userId, "spross_nachricht", {
        seite: farmContext.seite,
        activeVariety: safeKontext.activeVariety,
        activeRegion: safeKontext.activeRegion,
        locale: farmContext.locale,
        modus: "skript",
      });
    }

    const bekannteKeys = knownKeysFromFacts(
      farmContext.knownFacts,
      this.config.planungssaison
    );

    let replyText: string;
    let askedKey: string | undefined;
    let replyVorschlaege: string[] | undefined;
    let replyUiActions: SprossUiAction[] | undefined;
    const saved: KnowledgeFact[] = [];

    const saveSingleFact = async (fact: KnowledgeFact) => {
      const isDuplicate =
        farmContext.knownFacts.some(
          (kf) => kf.topic === fact.topic && kf.text === fact.text
        ) || saved.some((sf) => sf.topic === fact.topic && sf.text === fact.text);
      if (!isDuplicate) {
        await this.storage.saveFact(userId, fact, "spross", fieldId);
        saved.push(fact);
        farmContext.knownFacts.unshift(fact);
      }
    };

    const runScripted = async () => {
      const r = scriptedReply({
        text: clean,
        saison: this.config.planungssaison,
        askedKey: lastMetaAsked,
        bekannteKeys,
        activeVariety: safeKontext.activeVariety,
        activeRegion: safeKontext.activeRegion,
        locale: farmContext.locale,
        pageState: farmContext.pageState,
        knownFacts: farmContext.knownFacts,
      });

      if (r.fact) {
        await saveSingleFact(r.fact);
      }
      if (r.extraFacts) {
        for (const ef of r.extraFacts) {
          await saveSingleFact(ef);
        }
      }
      replyText = r.text;
      askedKey = r.askedKey;
      replyVorschlaege = r.vorschlaege;
      replyUiActions = r.uiActions;
    };

    await runScripted();

    await this.storage.saveMessage(userId, {
      role: "assistant",
      text: replyText!,
      meta: {
        askedTopic: askedKey,
        savedFacts: saved.map(factLabel),
        ...(replyVorschlaege !== undefined ? { vorschlaege: replyVorschlaege } : {}),
        ...(replyUiActions !== undefined ? { uiActions: replyUiActions } : {}),
      },
    });

    return this.getConversation(userId, farmContext.locale);
  }
}
