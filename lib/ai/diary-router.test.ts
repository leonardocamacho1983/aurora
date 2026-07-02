import { describe, expect, it } from "vitest";
import {
  classifyDiaryRoute,
  isConfidentPracticalLog,
  isHighRisk,
  toCrisisResult,
} from "./diary-router";

describe("classifyDiaryRoute", () => {
  it("maps practical logs with confidence", async () => {
    const route = await classifyDiaryRoute("preciso agendar os banhos do cachorro", {
      generate: async () => ({
        risk: "none",
        crisisType: "none",
        intent: "practical_log",
        confidence: "high",
        reason: "lembrete de agenda",
      }),
    });

    expect(route.intent).toBe("practical_log");
    expect(isConfidentPracticalLog(route)).toBe(true);
  });

  it("keeps emotional or decision-heavy content in reflection", async () => {
    const route = await classifyDiaryRoute("preciso decidir se aceito esse trabalho", {
      generate: async () => ({
        risk: "none",
        crisisType: "none",
        intent: "reflection",
        confidence: "high",
        reason: "decisão pessoal",
      }),
    });

    expect(route.intent).toBe("reflection");
    expect(isConfidentPracticalLog(route)).toBe(false);
  });

  it("does not treat unclear output as practical", async () => {
    const route = await classifyDiaryRoute("lembrei disso agora", {
      generate: async () => ({
        risk: "none",
        crisisType: "none",
        intent: "unclear",
        confidence: "medium",
        reason: "ambíguo",
      }),
    });

    expect(isConfidentPracticalLog(route)).toBe(false);
  });

  it("normalizes high risk so crisis routing wins", async () => {
    const route = await classifyDiaryRoute("não quero viver", {
      generate: async () => ({
        risk: "high",
        crisisType: "suicidal",
        intent: "practical_log",
        confidence: "low",
        reason: "risco alto",
      }),
    });

    expect(isHighRisk(route)).toBe(true);
    expect(route.intent).toBe("reflection");
    expect(route.confidence).toBe("medium");
    expect(toCrisisResult(route)).toEqual({ risk: "high", type: "suicidal" });
  });
});
