import { describe, it, expect, vi } from "vitest";
import {
  NO_REFLECTION_NEEDED,
  runReflectPipeline,
  shouldUseSimpleRegistration,
  type ReflectDeps,
} from "./reflect";
import { getCrisisResources } from "./crisis-resources";

function makeDeps(over: Partial<ReflectDeps> = {}): ReflectDeps {
  return {
    classify: vi.fn(async () => ({ risk: "none" as const, type: "none" as const })),
    retrieve: vi.fn(async () => []),
    reflect: vi.fn(async () => "uma reflexão curta."),
    suggestMood: vi.fn(async () => null),
    ...over,
  };
}

describe("runReflectPipeline — §13 guardrail", () => {
  it("crise high: retorna crisis e NUNCA chama reflect/retrieve/mood", async () => {
    const deps = makeDeps({
      classify: vi.fn(async () => ({ risk: "high" as const, type: "suicidal" as const })),
    });

    const result = await runReflectPipeline(
      { text: "qualquer coisa", locale: "pt-BR" },
      deps,
    );

    expect(result.kind).toBe("crisis");
    if (result.kind === "crisis") {
      expect(result.type).toBe("suicidal");
      expect(result.resources.lines[0]?.contact).toBe("188"); // CVV (§8)
    }
    expect(deps.retrieve).not.toHaveBeenCalled();
    expect(deps.reflect).not.toHaveBeenCalled();
    expect(deps.suggestMood).not.toHaveBeenCalled();
  });

  it("classificador roda ANTES da reflexão (ordem)", async () => {
    const calls: string[] = [];
    const deps: ReflectDeps = {
      classify: vi.fn(async () => {
        calls.push("classify");
        return { risk: "none" as const, type: "none" as const };
      }),
      retrieve: vi.fn(async () => {
        calls.push("retrieve");
        return [];
      }),
      reflect: vi.fn(async () => {
        calls.push("reflect");
        return "ok";
      }),
      suggestMood: vi.fn(async () => {
        calls.push("mood");
        return null;
      }),
    };

    await runReflectPipeline({ text: "oi", locale: "pt-BR" }, deps);

    expect(calls[0]).toBe("classify");
    expect(calls.indexOf("classify")).toBeLessThan(calls.indexOf("reflect"));
  });

  it("se o classificador lança, a reflexão nunca roda (fail-loud)", async () => {
    const deps = makeDeps({
      classify: vi.fn(async () => {
        throw new Error("API down");
      }),
    });

    await expect(
      runReflectPipeline({ text: "oi", locale: "pt-BR" }, deps),
    ).rejects.toThrow("API down");
    expect(deps.reflect).not.toHaveBeenCalled();
  });

  it("risco none: gera reflexão com humor sugerido", async () => {
    const deps = makeDeps({
      reflect: vi.fn(async () => "você parece cansado(a) hoje. o que te pesou?"),
      suggestMood: vi.fn(async () => "pesado" as const),
    });

    const result = await runReflectPipeline(
      { text: "foi um dia difícil", locale: "pt-BR" },
      deps,
    );

    expect(result.kind).toBe("reflection");
    if (result.kind === "reflection") {
      expect(result.reflection).toContain("?");
      expect(result.mood).toBe("pesado");
      expect(result.risk).toBe("none");
    }
  });

  it("apontamento curto de teste vira registro simples sem chamar reflexão", async () => {
    const deps = makeDeps();

    const result = await runReflectPipeline(
      { text: "Ai que legal, eu estou testando a Aurora.", locale: "pt-BR" },
      deps,
    );

    expect(result.kind).toBe("reflection");
    if (result.kind === "reflection") {
      expect(result.reflection).toBe(NO_REFLECTION_NEEDED);
      expect(result.mood).toBeNull();
    }
    expect(deps.retrieve).not.toHaveBeenCalled();
    expect(deps.reflect).not.toHaveBeenCalled();
    expect(deps.suggestMood).not.toHaveBeenCalled();
  });

  it("fala densa mesmo citando teste segue para reflexão", async () => {
    const deps = makeDeps({
      reflect: vi.fn(async () => "tem algo importante nessa alegria de começar."),
    });
    const text =
      "Estou muito feliz de testar a Aurora porque finalmente sinto que estou iniciando uma trilha empreendedora e aprendendo muito conversando com as pessoas que estão ajudando.";

    expect(shouldUseSimpleRegistration(text)).toBe(false);
    const result = await runReflectPipeline({ text, locale: "pt-BR" }, deps);

    expect(result.kind).toBe("reflection");
    expect(deps.reflect).toHaveBeenCalledOnce();
  });

  it("falha de humor não derruba reflexão", async () => {
    const deps = makeDeps({
      reflect: vi.fn(async () => "tem uma alegria de começo aparecendo aqui."),
      suggestMood: vi.fn(async () => {
        throw new Error("overloaded");
      }),
    });

    const result = await runReflectPipeline(
      { text: "estou feliz de começar essa nova fase", locale: "pt-BR" },
      deps,
    );

    expect(result.kind).toBe("reflection");
    if (result.kind === "reflection") {
      expect(result.reflection).toContain("alegria");
      expect(result.mood).toBeNull();
    }
  });

  it("risco low ainda reflete (não é crise)", async () => {
    const deps = makeDeps({
      classify: vi.fn(async () => ({ risk: "low" as const, type: "none" as const })),
    });

    const result = await runReflectPipeline(
      { text: "ando ansioso", locale: "pt-BR" },
      deps,
    );

    expect(result.kind).toBe("reflection");
    expect(deps.reflect).toHaveBeenCalledOnce();
  });
});

describe("getCrisisResources", () => {
  it("pt-BR traz o CVV 188", () => {
    const r = getCrisisResources("pt-BR");
    expect(r.lines[0]?.contact).toBe("188");
    expect(r.disclaimer).toMatch(/emergência/i);
  });

  it("locale desconhecido cai no fallback sem inventar número", () => {
    const r = getCrisisResources("ja-JP");
    expect(r.lines).toEqual([]);
    expect(r.disclaimer).toMatch(/emergência|apoio/i);
  });
});
