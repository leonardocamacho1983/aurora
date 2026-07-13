import { describe, expect, it } from "vitest";
import { sanitizeUrl, scrubSentryEvent } from "./sentry-privacy";

describe("sentry privacy scrubber", () => {
  it("removes query strings and path tokens from product URLs", () => {
    expect(sanitizeUrl("https://www.faleaurora.com/admin?token=secret")).toBe("/admin");
    expect(sanitizeUrl("https://www.faleaurora.com/lista/a-very-long-token-value")).toBe("/lista/[token]");
    expect(sanitizeUrl("https://www.faleaurora.com/r/referral-code")).toBe("/r/[code]");
  });

  it("redacts sensitive request, user, extra and breadcrumb data", () => {
    const scrubbed = scrubSentryEvent({
      user: { email: "ana@example.com", id: "user_123" },
      request: {
        url: "https://www.faleaurora.com/api/reflect?token=secret",
        headers: { authorization: "Bearer secret" },
        cookies: { session: "secret" },
        data: { transcript: "texto intimo" },
      },
      extra: {
        reflection: "conteudo sensivel",
        safeFlag: true,
      },
      breadcrumbs: [
        {
          message: "failed for ana@example.com",
          data: { audioUrl: "https://storage/audio.wav", status: 500 },
        },
      ],
    });

    expect(scrubbed.user).toBeUndefined();
    expect(scrubbed.request?.url).toBe("/api/reflect");
    expect(scrubbed.request?.headers).toBeUndefined();
    expect(scrubbed.request?.cookies).toBeUndefined();
    expect(scrubbed.request?.data).toBeUndefined();
    expect(scrubbed.extra).toEqual({ reflection: "[Filtered by Aurora]", safeFlag: true });
    expect(scrubbed.breadcrumbs?.[0]?.message).toBe("failed for [Filtered by Aurora]");
    expect(scrubbed.breadcrumbs?.[0]?.data).toEqual({ audioUrl: "[Filtered by Aurora]", status: 500 });
  });
});
