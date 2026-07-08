ALTER TABLE "entries" ADD COLUMN IF NOT EXISTS "focus_key" text;--> statement-breakpoint
ALTER TABLE "entries" ADD COLUMN IF NOT EXISTS "focus_confidence" text;--> statement-breakpoint
ALTER TABLE "entries" ADD COLUMN IF NOT EXISTS "focus_reason" text;--> statement-breakpoint
ALTER TABLE "entries" ADD COLUMN IF NOT EXISTS "focus_evidence" jsonb;--> statement-breakpoint
ALTER TABLE "entries" ADD COLUMN IF NOT EXISTS "focus_classified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "entries" ADD COLUMN IF NOT EXISTS "entry_mode" text DEFAULT 'new' NOT NULL;--> statement-breakpoint
ALTER TABLE "entries" ADD COLUMN IF NOT EXISTS "continued_from_entry_id" uuid;--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'entries_continued_from_entry_id_entries_id_fk'
  ) THEN
    ALTER TABLE "entries"
      ADD CONSTRAINT "entries_continued_from_entry_id_entries_id_fk"
      FOREIGN KEY ("continued_from_entry_id")
      REFERENCES "public"."entries"("id")
      ON DELETE set null
      ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "entries_user_focus_idx" ON "entries" USING btree ("user_id","focus_key");
