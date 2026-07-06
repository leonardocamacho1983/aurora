import { describe, expect, it } from "vitest";
import { FOCUS_KEYS, focusDefinitions, getFocusDefinition } from "./focus";

describe("mapa focus definitions", () => {
  it("keeps one definition for each official focus key", () => {
    expect(focusDefinitions().map((focus) => focus.key)).toEqual([...FOCUS_KEYS]);
  });

  it("returns null for unknown focus keys", () => {
    expect(getFocusDefinition("inexistente")).toBeNull();
  });

  it("exposes product metadata without matcher internals", () => {
    const firstDefinition = focusDefinitions()[0];

    expect(firstDefinition).toMatchObject({
      key: "carreira-direcao",
      label: "Carreira e direção",
      description: expect.any(String),
    });
    expect(firstDefinition).not.toHaveProperty("keywords");
    expect(firstDefinition).not.toHaveProperty("strongSignals");
    expect(firstDefinition).not.toHaveProperty("supportingSignals");
  });
});
