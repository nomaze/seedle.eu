import { describe, expect, it } from "vitest";
import {
  ChatMessageSchema,
  CompanionRequestSchema,
  CompanionResponseSchema,
  FarmContextSchema,
  FarmFieldSummarySchema,
  FarmSchema,
  FieldStatusSchema,
  FieldYearSchema,
  FieldYearStatusSchema,
  KNOWLEDGE_TOPIC_LABEL,
  KnowledgeTopicSchema,
  PageViewStateSchema,
  SprossUiActionSchema,
  SprossUiActionTypeSchema,
} from "../index";

describe("Contracts & Schemas", () => {
  it("validates FieldStatusSchema correctly", () => {
    expect(FieldStatusSchema.parse("status-ok")).toBe("status-ok");
    expect(FieldStatusSchema.parse("status-action")).toBe("status-action");
    expect(FieldStatusSchema.parse("status-problem")).toBe("status-problem");
    expect(FieldStatusSchema.parse("status-urgent")).toBe("status-urgent");
    expect(() => FieldStatusSchema.parse("invalid-status")).toThrow();
  });

  it("validates FieldYearStatusSchema correctly", () => {
    expect(FieldYearStatusSchema.parse("geplant")).toBe("geplant");
    expect(FieldYearStatusSchema.parse("gewaehlt")).toBe("gewaehlt");
    expect(FieldYearStatusSchema.parse("gekauft")).toBe("gekauft");
    expect(() => FieldYearStatusSchema.parse("abgeerntet")).toThrow();
  });

  it("validates FarmSchema with required properties and coordinate bounds", () => {
    const validFarm = {
      id: "frm_123",
      userId: "usr_456",
      name: "Gut Sonnenhof",
      strasse: "Hauptstraße 1",
      plz: "39104",
      ort: "Magdeburg",
      lat: 52.13,
      lon: 11.62,
    };
    const parsed = FarmSchema.parse(validFarm);
    expect(parsed.name).toBe("Gut Sonnenhof");
    expect(parsed.lat).toBe(52.13);
    expect(parsed.lon).toBe(11.62);

    expect(() => FarmSchema.parse({ ...validFarm, id: 123 as unknown as string })).toThrow();
  });

  it("validates FieldYearSchema", () => {
    const validYear = {
      id: "fy_123",
      fieldId: "fld_456",
      jahr: 2027,
      crop: "mais",
      varietyId: "var_p8834",
      status: "gewaehlt",
      areaHa: 12.5,
    };
    const parsed = FieldYearSchema.parse(validYear);
    expect(parsed.jahr).toBe(2027);
    expect(parsed.status).toBe("gewaehlt");
    expect(parsed.areaHa).toBe(12.5);
  });

  it("supports FarmFieldSummary with backward-compatible farmId, status, and fieldYears", () => {
    const summary = {
      id: "fld_1",
      name: "Schlag 1",
      areaHa: 10.0,
      farmId: "frm_1",
      status: "status-ok" as const,
      fieldYears: [
        {
          id: "fy_1",
          fieldId: "fld_1",
          jahr: 2027,
          crop: "mais",
          status: "geplant" as const,
        },
      ],
    };
    const parsed = FarmFieldSummarySchema.parse(summary);
    expect(parsed.status).toBe("status-ok");
    expect(parsed.fieldYears?.length).toBe(1);
    expect(parsed.fieldYears?.[0]?.jahr).toBe(2027);
  });

  it("supports FarmContext with nested farm object", () => {
    const ctx = {
      userId: "usr_1",
      farm: {
        id: "frm_1",
        userId: "usr_1",
        name: "Hof Meier",
      },
      saison: 2027,
      heuteIso: "2027-05-15",
      fields: [],
      knownFacts: [],
    };
    const parsed = FarmContextSchema.parse(ctx);
    expect(parsed.farm?.name).toBe("Hof Meier");
    expect(parsed.saison).toBe(2027);
  });

  it("supports Spross KnowledgeTopics and labels", () => {
    expect(KnowledgeTopicSchema.parse("risikofokus")).toBe("risikofokus");
    expect(KnowledgeTopicSchema.parse("zuechter_insight")).toBe("zuechter_insight");
    expect(KNOWLEDGE_TOPIC_LABEL.risikofokus).toBe("Risikofokus");
    expect(KNOWLEDGE_TOPIC_LABEL.zuechter_insight).toBe("Züchterwissen");
  });

  it("validates SprossUiActionSchema and PageViewStateSchema", () => {
    const action = SprossUiActionSchema.parse({
      type: "set_filter",
      label: "Auf Silomais filtern",
      filterKey: "usage",
      filterValue: "silomais",
    });
    expect(action.type).toBe("set_filter");
    expect(SprossUiActionTypeSchema.parse("select_scenario")).toBe("select_scenario");
    expect(() => SprossUiActionTypeSchema.parse("invalid_action")).toThrow();

    const pageState = PageViewStateSchema.parse({
      route: "/sorten",
      stepLabel: "Sortenvergleich",
      nextBestAction: "Sorte für Schlag 1 auswählen",
      activeFilters: { usage: "silomais", zuechter: "ackerwerk" },
      activeScenario: "trockenjahr",
      visibleVarieties: ["AW Talkrone", "AW Lichtkorn"],
      availableTargets: ["filter-usage", "scenario-trocken"],
      missingInfo: ["Vorjahressorte fehlt"],
    });
    expect(pageState.activeScenario).toBe("trockenjahr");
    expect(pageState.visibleVarieties).toHaveLength(2);
  });

  it("validates extended CompanionRequest, ChatMessage, and CompanionResponse schemas", () => {
    const req = CompanionRequestSchema.parse({
      text: "Zeig mir trockentolerante Sorten",
      locale: "de",
      pageState: {
        route: "/feld/fld_1",
        visibleVarieties: ["AW Talkrone"],
      },
    });
    expect(req.locale).toBe("de");
    expect(req.pageState?.visibleVarieties).toEqual(["AW Talkrone"]);

    const msg = ChatMessageSchema.parse({
      id: "msg_1",
      role: "assistant",
      text: "Hier ist die Filterung.",
      uiActions: [{ type: "select_scenario", label: "Trockenjahr aktivieren", target: "trocken" }],
    });
    expect(msg.uiActions?.length).toBe(1);

    const res = CompanionResponseSchema.parse({
      messages: [msg],
      vorschlaege: ["Steckbrief öffnen"],
      modus: "ki",
      uiActions: msg.uiActions,
      knownFactsSummary: [
        { topic: "risikofokus", label: "Risikofokus", text: "Fokus auf Trockenstress", jahr: 2026 },
      ],
    });
    expect(res.knownFactsSummary?.[0]?.topic).toBe("risikofokus");
    expect(res.messages[0]?.id).toBe("msg_1");
  });
});
