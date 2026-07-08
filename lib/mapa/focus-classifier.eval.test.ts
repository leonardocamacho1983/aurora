import { describe, expect, it } from "vitest";
import { classifyEntryFocus, MAPA_FOCUS_REASON_STORAGE_MAX_LENGTH } from "./focus-classifier";

const hasKey = !!process.env.ANTHROPIC_API_KEY;

function expectConciseReason(reason: string) {
  expect(reason.length).toBeLessThanOrEqual(MAPA_FOCUS_REASON_STORAGE_MAX_LENGTH);
}

describe.skipIf(!hasKey)("classifyEntryFocus (eval real, Haiku 4.5)", () => {
  it(
    "classifica trabalho e direção sem depender de palavra isolada",
    async () => {
      const result = await classifyEntryFocus({
        transcript: "Voltei a pensar se continuo no projeto atual ou se preciso abrir espaço para outro tipo de trabalho.",
        reflection: "A Aurora percebeu uma pergunta sobre direção profissional e próximos passos.",
      });

      expect(result.focus).toBe("carreira-direcao");
      expect(result.confidence).not.toBe("low");
      expectConciseReason(result.reason);
    },
    30_000,
  );

  it(
    "prioriza carreira quando ha projeto, cliente e direcao profissional",
    async () => {
      const result = await classifyEntryFocus({
        transcript: "A reunião com o cliente mexeu comigo. Preciso decidir se continuo nesse projeto ou se reposiciono meu trabalho.",
        reflection: "A Aurora percebeu uma pergunta de direção profissional ligada ao projeto atual.",
      });

      expect(result.focus).toBe("carreira-direcao");
      expect(result.focus).not.toBe("fase-autoconhecimento");
      expect(result.confidence).not.toBe("low");
      expectConciseReason(result.reason);
    },
    30_000,
  );

  it(
    "prioriza foco e organizacao quando a demanda e rotina e proximo passo pratico",
    async () => {
      const result = await classifyEntryFocus({
        transcript: "Não estou perdido existencialmente, só preciso organizar a semana, proteger blocos de foco e escolher o próximo passo.",
        reflection: "A Aurora percebeu uma necessidade de clareza operacional para sair da intenção e agir.",
      });

      expect(result.focus).toBe("foco-organizacao");
      expect(result.focus).not.toBe("fase-autoconhecimento");
      expect(result.confidence).not.toBe("low");
      expectConciseReason(result.reason);
    },
    30_000,
  );

  it(
    "não transforma registro prático solto em foco",
    async () => {
      const result = await classifyEntryFocus({
        transcript: "Fui ao mercado, comprei arroz e passei na farmácia.",
      });

      expect(result.focus).toBe("none");
      expectConciseReason(result.reason);
    },
    30_000,
  );

  it(
    "mantem reflexao ampla fora do mapa quando nao ha padrao concreto",
    async () => {
      const result = await classifyEntryFocus({
        transcript: "Hoje fiquei pensativo sobre a vida, sem saber muito bem o que isso quer dizer.",
        reflection: "A Aurora percebeu uma sensação aberta, ainda sem tema ou repetição suficiente.",
      });

      expect(result.focus).toBe("none");
      expectConciseReason(result.reason);
    },
    30_000,
  );

  it(
    "usa fase e autoconhecimento quando ha padrao pessoal recorrente explicito",
    async () => {
      const result = await classifyEntryFocus({
        transcript: "Percebi de novo esse meu padrão de me adaptar demais. Parece uma fase de rever quem eu sou quando tento agradar.",
        reflection: "A Aurora percebeu um padrão pessoal recorrente e uma pergunta de identidade.",
      });

      expect(result.focus).toBe("fase-autoconhecimento");
      expect(result.confidence).toBe("high");
      expectConciseReason(result.reason);
    },
    30_000,
  );

  it(
    "classifica descanso quando o tema é regulação, não só uma palavra ampla",
    async () => {
      const result = await classifyEntryFocus({
        transcript: "Acordei cansado de novo e senti que meu corpo não desligou nem durante a noite.",
        reflection: "A Aurora percebeu que descanso e recuperação voltaram como necessidade.",
      });

      expect(result.focus).toBe("sono-descanso");
      expect(result.confidence).not.toBe("low");
      expectConciseReason(result.reason);
    },
    30_000,
  );
});
