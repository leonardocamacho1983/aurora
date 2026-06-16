import { describe, it, expect, vi } from "vitest";
import {
  classifyCrisis,
  crisisSchema,
  CRISIS_MODEL,
  type ClassifyDeps,
  type CrisisResult,
} from "./crisis-classifier";

// Helper: cria deps falsos que retornam uma saída fixa do "modelo".
function fakeDeps(output: unknown): ClassifyDeps {
  return { generate: vi.fn(async () => output) };
}

describe("crisisSchema", () => {
  it("aceita um resultado válido", () => {
    const ok: CrisisResult = { risk: "high", type: "suicidal" };
    expect(crisisSchema.parse(ok)).toEqual(ok);
  });

  it("rejeita um risk fora do enum", () => {
    expect(() => crisisSchema.parse({ risk: "critical", type: "none" })).toThrow();
  });

  it("rejeita um type fora do enum", () => {
    expect(() => crisisSchema.parse({ risk: "low", type: "panic" })).toThrow();
  });

  it("rejeita objeto sem campos", () => {
    expect(() => crisisSchema.parse({})).toThrow();
  });
});

describe("classifyCrisis", () => {
  it("usa o modelo Claude Haiku 4.5", () => {
    expect(CRISIS_MODEL).toBe("claude-haiku-4-5");
  });

  it("retorna a classificação validada do modelo", async () => {
    const deps = fakeDeps({ risk: "high", type: "suicidal" });
    await expect(classifyCrisis("...", deps)).resolves.toEqual({
      risk: "high",
      type: "suicidal",
    });
  });

  it("propaga risk=none quando o modelo classifica como benigno", async () => {
    const deps = fakeDeps({ risk: "none", type: "none" });
    await expect(classifyCrisis("dia tranquilo", deps)).resolves.toEqual({
      risk: "none",
      type: "none",
    });
  });

  it("curto-circuita texto vazio para none, sem chamar o modelo", async () => {
    const deps = fakeDeps({ risk: "high", type: "suicidal" });
    const result = await classifyCrisis("   ", deps);
    expect(result).toEqual({ risk: "none", type: "none" });
    expect(deps.generate).not.toHaveBeenCalled();
  });

  it("falha alto (lança) se o modelo devolver algo fora do schema", async () => {
    const deps = fakeDeps({ risk: "maybe", type: "???" });
    await expect(classifyCrisis("texto", deps)).rejects.toThrow();
  });

  it("repassa o texto recebido ao gerador", async () => {
    const deps = fakeDeps({ risk: "none", type: "none" });
    await classifyCrisis("meu texto", deps);
    expect(deps.generate).toHaveBeenCalledWith("meu texto");
  });
});
