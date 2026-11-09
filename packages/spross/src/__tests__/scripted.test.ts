import { describe, expect, it } from "vitest";
import { openingMessage, scriptedReply, scriptQuestions } from "../engine/scripted";

describe("Spross Scripted Heuristics", () => {
  it("generates opening welcome greeting with next pending farm question", () => {
    const opening = openingMessage(2027, new Set());
    expect(opening.text).toContain("Hallo, ich bin Spross");
    expect(opening.askedKey).toBe("fruchtfolge:2026");
    expect(opening.vorschlaege.length).toBeGreaterThan(0);
  });

  it("identifies advisory and telephone consultation requests and answers directly without question loops", () => {
    const reply = scriptedReply({
      text: "Ich möchte mit einem Berater sprechen",
      saison: 2027,
      bekannteKeys: new Set(),
    });
    expect(reply.text).toContain("NoMaze-Team");
    expect(reply.vorschlaege).toEqual([]);
    expect(reply.fact).toBeUndefined();
  });

  it("answers variety comparison queries contextualized to the active variety", () => {
    const reply = scriptedReply({
      text: "Wie schneidet sie bei Trockenheit ab?",
      saison: 2027,
      activeVariety: "LG 31.218",
      bekannteKeys: new Set(),
    });
    expect(reply.text).toContain("LG 31.218");
    expect(reply.text).toContain("Stresstoleranz");
  });

  it("provides seasonal agronomic question catalogue for target season", () => {
    const questions = scriptQuestions(2027);
    expect(questions.length).toBeGreaterThan(5);
    expect(questions[0]!.jahr).toBe(2026);
    expect(questions[1]!.jahr).toBe(2025);
  });
});
