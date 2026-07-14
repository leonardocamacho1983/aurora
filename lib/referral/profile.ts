import { z } from "zod";

const textField = (max: number) =>
  z
    .string()
    .trim()
    .transform((value) => value.replace(/\s+/g, " ").slice(0, max))
    .refine((value) => value.length > 0, "empty")
    .optional();

export const waitlistProfilePatchSchema = z
  .object({
    statusToken: z.uuid().optional(),
    email: z.string().trim().toLowerCase().pipe(z.email()).optional(),
    source: z.string().trim().max(40).optional(),
    name: textField(40),
    moment: textField(140),
    rhythm: textField(40),
    presence: textField(40),
    value: textField(160),
  })
  .strict()
  .refine((input) => Boolean(input.statusToken || input.email), "identity required");

export type WaitlistProfilePatch = z.infer<typeof waitlistProfilePatchSchema>;

const PROFILE_FIELDS = ["name", "moment", "rhythm", "presence", "value"] as const;

export function profileValues(input: WaitlistProfilePatch) {
  const values: Partial<Record<(typeof PROFILE_FIELDS)[number], string>> = {};
  for (const key of PROFILE_FIELDS) {
    const value = input[key];
    if (value) values[key] = value;
  }
  return values;
}

export function profileFieldNames(input: Record<string, unknown>) {
  return PROFILE_FIELDS.filter((key) => typeof input[key] === "string" && input[key]);
}
