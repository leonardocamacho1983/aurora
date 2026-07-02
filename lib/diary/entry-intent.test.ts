import { describe, expect, it } from "vitest";
import { classifyEntryIntent, classifyEntryIntentHeuristic } from "./entry-intent";

describe("classifyEntryIntentHeuristic", () => {
  it("routes short routine logs to silent save", () => {
    expect(classifyEntryIntentHeuristic("fui ao mercado e comprei arroz").intent).toBe("routine_log");
    expect(classifyEntryIntentHeuristic("treinei hoje de manhã").intent).toBe("routine_log");
    expect(classifyEntryIntentHeuristic("reunião com a equipe às 14h").intent).toBe("routine_log");
    expect(classifyEntryIntentHeuristic("preciso comprar pão e tomar remédio").intent).toBe("routine_log");
    expect(classifyEntryIntentHeuristic("preciso pagar o banco e buscar o exame").intent).toBe("routine_log");
    expect(classifyEntryIntentHeuristic("lembrei que preciso agendar os banhos do cachorro").intent).toBe("routine_log");
    expect(classifyEntryIntentHeuristic("preciso marcar o veterinário do pet").intent).toBe("routine_log");
  });

  it("routes brief neutral entries to the save decision", () => {
    expect(classifyEntryIntentHeuristic("testando").intent).toBe("routine_log");
    expect(classifyEntryIntentHeuristic("teste rápido").intent).toBe("routine_log");
  });

  it("keeps emotional or decision-heavy entries in reflection", () => {
    expect(classifyEntryIntentHeuristic("a reunião me deixou ansioso").intent).toBe("reflection");
    expect(classifyEntryIntentHeuristic("não sei o que fazer depois da reunião").intent).toBe("reflection");
    expect(classifyEntryIntentHeuristic("me ajuda a decidir isso").intent).toBe("reflection");
    expect(classifyEntryIntentHeuristic("preciso decidir se aceito esse trabalho").intent).toBe("reflection");
    expect(classifyEntryIntentHeuristic("preciso entender por que fiquei com medo").intent).toBe("reflection");
  });

  it("does not silently save risk signals", () => {
    expect(classifyEntryIntentHeuristic("hoje eu pensei em morrer").intent).toBe("reflection");
    expect(classifyEntryIntentHeuristic("não quero viver").intent).toBe("reflection");
  });
});

describe("classifyEntryIntent", () => {
  it("maps confident model practical logs to routine_log", async () => {
    await expect(
      classifyEntryIntent("lembrei que preciso agendar os banhos", {
        generate: async () => ({
          intent: "practical_log",
          confidence: "high",
          reason: "lembrete de agenda",
        }),
      }),
    ).resolves.toMatchObject({
      intent: "routine_log",
      confidence: "high",
    });
  });

  it("keeps model reflection and unclear outputs in reflection", async () => {
    await expect(
      classifyEntryIntent("preciso entender por que fiquei assim", {
        generate: async () => ({
          intent: "reflection",
          confidence: "high",
          reason: "elaboração emocional",
        }),
      }),
    ).resolves.toMatchObject({ intent: "reflection" });

    await expect(
      classifyEntryIntent("lembrei disso agora", {
        generate: async () => ({
          intent: "unclear",
          confidence: "medium",
          reason: "ambíguo",
        }),
      }),
    ).resolves.toMatchObject({
      intent: "reflection",
      reason: "model_unclear",
    });
  });

  it("falls back conservatively to reflection when the model fails", async () => {
    await expect(
      classifyEntryIntent("comprar pão", {
        generate: async () => {
          throw new Error("model unavailable");
        },
      }),
    ).resolves.toMatchObject({
      intent: "reflection",
      reason: "intent_classifier_failed",
    });
  });
});
