import { describe, expect, it } from "vitest";
import {
  profileFieldNames,
  profileValues,
  waitlistProfilePatchSchema,
} from "./profile";

const token = "42971985-32bf-4b1a-8a27-6c72c46dd1f2";

describe("waitlist profile patch", () => {
  it("normalizes and limits voluntary profile fields", () => {
    const parsed = waitlistProfilePatchSchema.parse({
      statusToken: token,
      name: "  Leo   Camacho  ",
      moment: "  uma fase,   um projeto, uma pergunta  ",
      source: "arrival_ritual",
    });

    expect(profileValues(parsed)).toEqual({
      name: "Leo Camacho",
      moment: "uma fase, um projeto, uma pergunta",
    });
    expect(profileFieldNames(profileValues(parsed))).toEqual(["name", "moment"]);
  });

  it("rejects empty patches", () => {
    const parsed = waitlistProfilePatchSchema.parse({ statusToken: token });

    expect(profileValues(parsed)).toEqual({});
    expect(profileFieldNames(profileValues(parsed))).toEqual([]);
  });

  it("rejects unknown keys and invalid tokens", () => {
    expect(() =>
      waitlistProfilePatchSchema.parse({
        statusToken: "not-a-token",
        name: "Leo",
      }),
    ).toThrow();

    expect(() =>
      waitlistProfilePatchSchema.parse({
        statusToken: token,
        email: "leo@example.com",
      }),
    ).toThrow();
  });
});
