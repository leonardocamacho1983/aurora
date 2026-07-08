import { describe, expect, it, vi } from "vitest";
import {
  classifyEntryFocus,
  focusClassificationToStorageValues,
  focusClassificationToSignal,
  formatEntryFocusPrompt,
  MAPA_FOCUS_REASON_STORAGE_MAX_LENGTH,
  MAPA_FOCUS_MODEL,
  mapaFocusClassificationSchema,
} from "./focus-classifier";

describe("mapa official focus classifier", () => {
  it("uses the official lightweight classification model", () => {
    expect(MAPA_FOCUS_MODEL).toBe("claude-haiku-4-5");
  });

  it("formats the entry and Aurora response for semantic classification", () => {
    expect(
      formatEntryFocusPrompt({
        transcript: "  Estou tentando decidir sobre o trabalho.  ",
        reflection: " A Aurora percebeu uma tensão entre segurança e direção. ",
        mood: "ansioso",
      }),
    ).toBe(
      "Entrada: Estou tentando decidir sobre o trabalho.\nResposta da Aurora: A Aurora percebeu uma tensão entre segurança e direção.\nHumor sugerido: ansioso",
    );
  });

  it("does not call the model for empty input", async () => {
    const generate = vi.fn();

    await expect(classifyEntryFocus({ transcript: "  " }, { generate })).resolves.toEqual({
      focus: "none",
      confidence: "low",
      reason: "empty_text",
      evidence: [],
    });
    expect(generate).not.toHaveBeenCalled();
  });

  it("does not call the model when only mood is present", async () => {
    const generate = vi.fn();

    await expect(classifyEntryFocus({ mood: "ansioso" }, { generate })).resolves.toMatchObject({
      focus: "none",
      confidence: "low",
      reason: "empty_text",
    });
    expect(generate).not.toHaveBeenCalled();
  });

  it("validates and returns a structured model classification", async () => {
    await expect(
      classifyEntryFocus(
        {
          transcript: "Estou pensando no trabalho e em que direção seguir.",
          reflection: "A Aurora percebeu uma busca de próximo passo.",
        },
        {
          generate: async () => ({
            focus: "carreira-direcao",
            confidence: "high",
            reason: "trabalho e direção aparecem como tema central",
            evidence: ["trabalho", "direção"],
          }),
        },
      ),
    ).resolves.toMatchObject({
      focus: "carreira-direcao",
      confidence: "high",
    });
  });

  it("keeps returned reasons inside the product storage limit", async () => {
    const result = await classifyEntryFocus(
      { transcript: "Estou cansado e tentando regular meu corpo antes de dormir." },
      {
        generate: async () => ({
          focus: "sono-descanso",
          confidence: "high",
          reason: "sono, descanso e regulação aparecem como tema central do registro".repeat(3),
          evidence: ["sono", "regulação"],
        }),
      },
    );

    expect(result.reason).toHaveLength(MAPA_FOCUS_REASON_STORAGE_MAX_LENGTH);
  });

  it("hides low-confidence non-none classifications from the product signal", async () => {
    const result = await classifyEntryFocus(
      { transcript: "Pensei no tempo hoje." },
      {
        generate: async () => ({
          focus: "foco-organizacao",
          confidence: "low",
          reason: "palavra ampla sem contexto suficiente",
          evidence: ["tempo"],
        }),
      },
    );

    expect(result.focus).toBe("none");
    expect(focusClassificationToSignal(result)).toBeNull();
  });

  it("normalizes none classifications to low confidence", async () => {
    const result = await classifyEntryFocus(
      { transcript: "Comprei arroz e passei na farmácia." },
      {
        generate: async () => ({
          focus: "none",
          confidence: "high",
          reason: "registro prático solto sem tema suficiente para o mapa",
          evidence: [],
        }),
      },
    );

    expect(result).toMatchObject({
      focus: "none",
      confidence: "low",
    });
  });

  it("accepts longer model reasons but truncates storage values", () => {
    const values = focusClassificationToStorageValues({
      focus: "sono-descanso",
      confidence: "medium",
      reason: "x".repeat(220),
      evidence: ["y".repeat(140)],
    });

    expect(values.focusReason).toHaveLength(MAPA_FOCUS_REASON_STORAGE_MAX_LENGTH);
    expect(values.focusEvidence?.[0]).toHaveLength(120);
  });

  it("keeps broad reflection as none when confidence is weak", async () => {
    const result = await classifyEntryFocus(
      { transcript: "Hoje fiquei pensando na vida e em como tudo anda meio aberto." },
      {
        generate: async () => ({
          focus: "fase-autoconhecimento",
          confidence: "low",
          reason: "reflexão ampla sem padrão concreto",
          evidence: ["reflexão ampla"],
        }),
      },
    );

    expect(result.focus).toBe("none");
    expect(focusClassificationToSignal(result)).toBeNull();
  });

  it("returns empty storage values when official classification fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const { classifyEntryFocusForStorage } = await import("./focus-classifier");
    const result = await classifyEntryFocusForStorage(
      {
        transcript: "texto",
        reflection: "resposta",
        mood: "calmo",
      },
      {
        generate: async () => {
          throw new Error("model unavailable");
        },
      },
    );

    expect(result).toMatchObject({
      focusKey: null,
      focusConfidence: null,
      focusReason: null,
      focusEvidence: null,
      focusClassifiedAt: null,
    });
    consoleError.mockRestore();
  });

  it("converts confident official classifications to timeline/mapa signals", () => {
    expect(
      focusClassificationToSignal({
        focus: "sono-descanso",
        confidence: "medium",
        reason: "sono e descanso são centrais",
        evidence: ["sono"],
      }),
    ).toMatchObject({
      key: "sono-descanso",
      label: "Sono e descanso",
      score: 2,
    });
  });

  it("converts official classifications to entry storage values", () => {
    const classifiedAt = new Date("2026-07-05T10:00:00.000Z");

    expect(
      focusClassificationToStorageValues(
        {
          focus: "foco-organizacao",
          confidence: "medium",
          reason: "rotina e clareza são o tema central",
          evidence: ["rotina"],
        },
        classifiedAt,
      ),
    ).toEqual({
      focusKey: "foco-organizacao",
      focusConfidence: "medium",
      focusReason: "rotina e clareza são o tema central",
      focusEvidence: ["rotina"],
      focusClassifiedAt: classifiedAt,
    });
  });

  it("stores none classifications without a focus key", () => {
    const values = focusClassificationToStorageValues({
      focus: "none",
      confidence: "low",
      reason: "sem tema suficiente",
      evidence: [],
    });

    expect(values).toMatchObject({
      focusKey: null,
      focusConfidence: "low",
      focusReason: "sem tema suficiente",
      focusEvidence: null,
    });
    expect(values.focusClassifiedAt).toBeInstanceOf(Date);
  });

  it("rejects model output outside the official schema", () => {
    expect(() =>
      mapaFocusClassificationSchema.parse({
        focus: "financas",
        confidence: "high",
        reason: "fora do contrato",
      }),
    ).toThrow();
  });
});
