import { describe, expect, it } from "vitest";
import { classifyRitualIntent } from "@/lib/email/ritual-intent";

describe("classifyRitualIntent", () => {
  it("classifies practical project and task intent", () => {
    expect(
      classifyRitualIntent({
        moment: "Preciso organizar tarefas, projetos e decisoes de trabalho.",
        value: "Quero mais clareza para priorizar.",
      }),
    ).toBe("tasks_projects");
  });

  it("prioritizes hard moments when distress is present", () => {
    expect(
      classifyRitualIntent({
        moment: "Estou ansioso e com sono ruim em uma fase pesada.",
        value: "Quero conseguir nomear o que esta dificil.",
      }),
    ).toBe("hard_moments");
  });

  it("classifies self-understanding intent", () => {
    expect(
      classifyRitualIntent({
        moment: "Quero entender meus padroes e sentimentos com mais clareza.",
      }),
    ).toBe("self_understanding");
  });

  it("classifies diary practice and habit intent", () => {
    expect(
      classifyRitualIntent({
        rhythm: "De manha",
        value: "Quero criar o habito de diario com constancia.",
      }),
    ).toBe("habit_practice");
  });

  it("returns unknown without a clear repeated intent", () => {
    expect(classifyRitualIntent({ moment: "Estou chegando agora." })).toBe("unknown");
  });
});
