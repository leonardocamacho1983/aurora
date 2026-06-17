import { randomInt } from "crypto";
import { eq } from "drizzle-orm";
import type { db as dbProxy } from "@/lib/db";
import { waitlist } from "@/lib/db/schema";

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const CODE_LENGTH = 8;

type Db = typeof dbProxy;

export function generateReferralCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += ALPHABET[randomInt(0, ALPHABET.length)];
  }
  return code;
}

export async function createUniqueReferralCode(db: Db): Promise<string> {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const code = generateReferralCode();
    const existing = await db
      .select({ id: waitlist.id })
      .from(waitlist)
      .where(eq(waitlist.referralCode, code))
      .limit(1);
    if (existing.length === 0) return code;
  }

  throw new Error("referral_code_collision");
}
