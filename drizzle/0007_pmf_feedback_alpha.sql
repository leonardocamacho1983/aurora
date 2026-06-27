CREATE TABLE IF NOT EXISTS "product_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"entry_id" uuid,
	"kind" text NOT NULL,
	"action" text NOT NULL,
	"answer" text,
	"reason" text,
	"source" text,
	"variant" text DEFAULT 'alpha_pmf_v1' NOT NULL,
	"metadata" jsonb,
	"shown_at" timestamp with time zone,
	"answered_at" timestamp with time zone,
	"skipped_at" timestamp with time zone,
	"snoozed_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'product_feedback_user_id_users_id_fk'
	) THEN
		ALTER TABLE "product_feedback"
			ADD CONSTRAINT "product_feedback_user_id_users_id_fk"
			FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
			ON DELETE cascade ON UPDATE no action;
	END IF;
END
$$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'product_feedback_entry_id_entries_id_fk'
	) THEN
		ALTER TABLE "product_feedback"
			ADD CONSTRAINT "product_feedback_entry_id_entries_id_fk"
			FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id")
			ON DELETE set null ON UPDATE no action;
	END IF;
END
$$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_feedback_user_id_idx" ON "product_feedback" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_feedback_entry_id_idx" ON "product_feedback" USING btree ("entry_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_feedback_kind_idx" ON "product_feedback" USING btree ("kind");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_feedback_answer_idx" ON "product_feedback" USING btree ("answer");
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "product_feedback" TO authenticated;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "product_feedback" TO service_role;
--> statement-breakpoint
ALTER TABLE "product_feedback" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_policies
		WHERE schemaname = 'public'
			AND tablename = 'product_feedback'
			AND policyname = 'product_feedback_all_own'
	) THEN
		CREATE POLICY "product_feedback_all_own" ON "product_feedback"
			FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
	END IF;
END
$$;
