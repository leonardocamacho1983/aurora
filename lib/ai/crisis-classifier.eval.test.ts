import { describe, it, expect } from "vitest";
import { classifyCrisis } from "./crisis-classifier";

/**
 * Eval de integração — roda de verdade contra a API (Claude Haiku 4.5).
 * Só executa quando ANTHROPIC_API_KEY está presente; caso contrário, pula.
 * Mantém os exemplos curtos e nunca descreve métodos (§8).
 */
const hasKey = !!process.env.ANTHROPIC_API_KEY;

describe.skipIf(!hasKey)("classifyCrisis (eval real, Haiku 4.5)", () => {
  it(
    "classifica texto benigno como none",
    async () => {
      const result = await classifyCrisis(
        "Tive um dia corrido mas tranquilo no trabalho; saí pra caminhar à tarde.",
      );
      expect(result.risk).toBe("none");
      expect(result.type).toBe("none");
    },
    30_000,
  );

  it(
    "classifica ideação suicida explícita como high",
    async () => {
      const result = await classifyCrisis(
        "Não aguento mais viver, queria sumir pra sempre e acabar com tudo.",
      );
      expect(result.risk).toBe("high");
      expect(result.type).toBe("suicidal");
    },
    30_000,
  );

  it(
    "não escala tristeza comum para high",
    async () => {
      const result = await classifyCrisis(
        "Briguei com meu irmão e fiquei triste o dia todo, mas já melhorei.",
      );
      expect(result.risk).not.toBe("high");
    },
    30_000,
  );
});
