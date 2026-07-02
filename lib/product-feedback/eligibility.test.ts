import { describe, expect, it } from "vitest";
import { getProductFeedbackEligibility } from "./eligibility";

const NOW = new Date("2026-07-01T12:00:00.000Z");

const base = {
  reflectedEntries: 1,
  activeDays: 1,
  continuedEntries: 0,
  pmfTestEnabled: false,
  microAnsweredForEntry: 0,
  microShownToday: 0,
  microShownWithoutAnswer: 0,
  lastMicroShownAt: null,
  reflectionsSinceLastMicro: 0,
  pmfAnswered: 0,
  pmfSnoozed: 0,
  now: NOW,
};

describe("product feedback eligibility", () => {
  it("allows the first valid common microfeedback when there is no prior prompt", () => {
    expect(getProductFeedbackEligibility(base)).toMatchObject({
      reflectionMicroEligible: true,
      pmfEligible: false,
    });
  });

  it("blocks common microfeedback after it has already appeared today", () => {
    expect(
      getProductFeedbackEligibility({
        ...base,
        microShownToday: 1,
        lastMicroShownAt: new Date("2026-07-01T09:00:00.000Z"),
        reflectionsSinceLastMicro: 15,
      }),
    ).toMatchObject({
      reflectionMicroEligible: false,
      pmfEligible: false,
    });
  });

  it("blocks common microfeedback until both 5 days and 10 reflections have passed", () => {
    expect(
      getProductFeedbackEligibility({
        ...base,
        lastMicroShownAt: new Date("2026-06-25T12:00:00.000Z"),
        reflectionsSinceLastMicro: 9,
      }),
    ).toMatchObject({ reflectionMicroEligible: false });

    expect(
      getProductFeedbackEligibility({
        ...base,
        lastMicroShownAt: new Date("2026-06-29T12:00:00.000Z"),
        reflectionsSinceLastMicro: 10,
      }),
    ).toMatchObject({ reflectionMicroEligible: false });
  });

  it("allows common microfeedback after 5 days, 10 reflections, and no prompt today", () => {
    expect(
      getProductFeedbackEligibility({
        ...base,
        lastMicroShownAt: new Date("2026-06-25T12:00:00.000Z"),
        reflectionsSinceLastMicro: 10,
      }),
    ).toMatchObject({
      reflectionMicroEligible: true,
      pmfEligible: false,
    });
  });

  it("forces the microfeedback gate for PMF eligible users on the next eligible entry", () => {
    expect(
      getProductFeedbackEligibility({
        ...base,
        reflectedEntries: 2,
        microShownToday: 1,
        lastMicroShownAt: new Date("2026-07-01T09:00:00.000Z"),
      }),
    ).toMatchObject({
      reflectionMicroEligible: true,
      pmfEligible: true,
      directPmfEligible: false,
    });
  });

  it("opens PMF directly after repeated unanswered microfeedback for PMF eligible users", () => {
    expect(
      getProductFeedbackEligibility({
        ...base,
        reflectedEntries: 2,
        microShownToday: 1,
        lastMicroShownAt: new Date("2026-07-01T09:00:00.000Z"),
        microShownWithoutAnswer: 2,
      }),
    ).toMatchObject({
      reflectionMicroEligible: false,
      pmfEligible: true,
      directPmfEligible: true,
    });
  });

  it("does not ask again when the current entry already answered microfeedback", () => {
    expect(
      getProductFeedbackEligibility({
        ...base,
        reflectedEntries: 2,
        microAnsweredForEntry: 1,
      }),
    ).toMatchObject({
      reflectionMicroEligible: false,
      pmfEligible: true,
    });
  });

  it("stops PMF once the declared PMF question was answered", () => {
    expect(
      getProductFeedbackEligibility({
        ...base,
        reflectedEntries: 2,
        microShownToday: 1,
        pmfAnswered: 1,
      }),
    ).toMatchObject({
      reflectionMicroEligible: false,
      pmfEligible: false,
    });
  });

  it("supports explicit PMF test users after one reflected entry", () => {
    expect(
      getProductFeedbackEligibility({
        ...base,
        pmfTestEnabled: true,
      }),
    ).toMatchObject({
      reflectionMicroEligible: true,
      pmfEligible: true,
      testPmfEligible: true,
    });
  });
});
