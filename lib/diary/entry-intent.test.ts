import { describe, expect, it } from "vitest";
import { classifyEntryIntent } from "./entry-intent";

describe("classifyEntryIntent", () => {
  it("routes short routine logs to silent save", () => {
    expect(classifyEntryIntent("fui ao mercado e comprei arroz").intent).toBe("routine_log");
    expect(classifyEntryIntent("treinei hoje de manhã").intent).toBe("routine_log");
    expect(classifyEntryIntent("reunião com a equipe às 14h").intent).toBe("routine_log");
  });

  it("routes brief neutral entries to the save decision", () => {
    expect(classifyEntryIntent("testando").intent).toBe("routine_log");
    expect(classifyEntryIntent("teste rápido").intent).toBe("routine_log");
  });

  it("keeps emotional or decision-heavy entries in reflection", () => {
    expect(classifyEntryIntent("a reunião me deixou ansioso").intent).toBe("reflection");
    expect(classifyEntryIntent("não sei o que fazer depois da reunião").intent).toBe("reflection");
    expect(classifyEntryIntent("me ajuda a decidir isso").intent).toBe("reflection");
  });

  it("does not silently save risk signals", () => {
    expect(classifyEntryIntent("hoje eu pensei em morrer").intent).toBe("reflection");
    expect(classifyEntryIntent("não quero viver").intent).toBe("reflection");
  });
});
