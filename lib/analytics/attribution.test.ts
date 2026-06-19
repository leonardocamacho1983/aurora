import { describe, expect, it } from "vitest";
import { classifyTrafficSource, sanitizeAnalyticsProperties } from "./attribution";

const allowed = new Set(["utm_source", "utm_medium", "referral_code", "referrer", "path"]);

describe("analytics attribution", () => {
  it("prioritizes referral codes over campaign data", () => {
    expect(
      classifyTrafficSource({
        referral_code: "abc123",
        utm_source: "newsletter",
        referrer: "https://google.com/search?q=aurora",
      }),
    ).toBe("invite");
  });

  it("classifies common acquisition sources", () => {
    expect(classifyTrafficSource({ utm_source: "newsletter" })).toBe("campaign");
    expect(classifyTrafficSource({ referrer: "https://www.google.com/search?q=diario" })).toBe("search");
    expect(classifyTrafficSource({ referrer: "https://instagram.com/p/abc" })).toBe("social");
    expect(classifyTrafficSource({ referrer: "https://example.com/post" })).toBe("referral");
    expect(classifyTrafficSource({})).toBe("direct");
  });

  it("keeps only safe allowed properties", () => {
    expect(
      sanitizeAnalyticsProperties(
        {
          path: "/manifesto",
          email: "private@example.com",
          referrer: "https://www.google.com/search?q=aurora",
        },
        allowed,
      ),
    ).toEqual({
      path: "/manifesto",
      referrer: "https://www.google.com/search?q=aurora",
      source_type: "search",
    });
  });
});
