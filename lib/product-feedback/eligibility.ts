export const MICROFEEDBACK_RECENCY_DAYS = 5;
export const MICROFEEDBACK_REFLECTION_INTERVAL = 10;
export const PMF_DIRECT_MICRO_UNANSWERED_THRESHOLD = 2;

export type ProductFeedbackEligibilityInput = {
  reflectedEntries: number;
  activeDays: number;
  continuedEntries: number;
  pmfTestEnabled: boolean;
  microAnsweredForEntry: number;
  microShownToday: number;
  microShownWithoutAnswer: number;
  lastMicroShownAt: Date | null;
  reflectionsSinceLastMicro: number;
  pmfAnswered: number;
  pmfSnoozed: number;
  now?: Date;
};

export type ProductFeedbackEligibility = {
  reflectionMicroEligible: boolean;
  pmfEligible: boolean;
  directPmfEligible: boolean;
  normalPmfEligible: boolean;
  testPmfEligible: boolean;
};

export function getProductFeedbackEligibility({
  reflectedEntries,
  activeDays,
  continuedEntries,
  pmfTestEnabled,
  microAnsweredForEntry,
  microShownToday,
  microShownWithoutAnswer,
  lastMicroShownAt,
  reflectionsSinceLastMicro,
  pmfAnswered,
  pmfSnoozed,
  now = new Date(),
}: ProductFeedbackEligibilityInput): ProductFeedbackEligibility {
  const normalPmfEligible =
    reflectedEntries >= 2 || activeDays >= 2 || continuedEntries >= 1;
  const testPmfEligible = pmfTestEnabled && reflectedEntries >= 1;
  const pmfEligible =
    (normalPmfEligible || testPmfEligible) && pmfAnswered === 0 && pmfSnoozed === 0;
  const directPmfEligible =
    pmfEligible && microShownWithoutAnswer >= PMF_DIRECT_MICRO_UNANSWERED_THRESHOLD;
  const daysSinceLastMicro = lastMicroShownAt
    ? (now.getTime() - lastMicroShownAt.getTime()) / (24 * 60 * 60 * 1000)
    : Number.POSITIVE_INFINITY;
  const commonMicroEligible =
    microShownToday === 0 &&
    daysSinceLastMicro >= MICROFEEDBACK_RECENCY_DAYS &&
    (
      !lastMicroShownAt ||
      reflectionsSinceLastMicro >= MICROFEEDBACK_REFLECTION_INTERVAL
    );
  const reflectionMicroEligible =
    microAnsweredForEntry === 0 && !directPmfEligible && (pmfEligible || commonMicroEligible);

  return {
    reflectionMicroEligible,
    pmfEligible,
    directPmfEligible,
    normalPmfEligible,
    testPmfEligible,
  };
}
