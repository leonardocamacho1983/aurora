ALTER TABLE "waitlist" ADD COLUMN "referral_code" text;--> statement-breakpoint
ALTER TABLE "waitlist" ADD COLUMN "status_token" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "waitlist" ADD COLUMN "confirm_token" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "waitlist" ADD COLUMN "referred_by_code" text;--> statement-breakpoint
ALTER TABLE "waitlist" ADD COLUMN "confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "waitlist" ADD COLUMN "unlocked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "waitlist" ADD COLUMN "milestone_notified" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "waitlist" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
UPDATE "waitlist"
SET
  "referral_code" = lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  "confirmed_at" = "created_at"
WHERE "referral_code" IS NULL;--> statement-breakpoint
ALTER TABLE "waitlist" ALTER COLUMN "referral_code" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "waitlist_referred_by_code_idx" ON "waitlist" USING btree ("referred_by_code");--> statement-breakpoint
CREATE INDEX "waitlist_confirmed_referral_idx" ON "waitlist" USING btree ("referred_by_code","confirmed_at");--> statement-breakpoint
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_referral_code_unique" UNIQUE("referral_code");--> statement-breakpoint
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_status_token_unique" UNIQUE("status_token");--> statement-breakpoint
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_confirm_token_unique" UNIQUE("confirm_token");
