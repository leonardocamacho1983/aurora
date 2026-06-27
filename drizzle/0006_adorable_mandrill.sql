CREATE TABLE "entry_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"root_entry_id" uuid,
	"title" text,
	"summary" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "entries" ADD COLUMN "thread_id" uuid;--> statement-breakpoint
ALTER TABLE "entries" ADD COLUMN "thread_position" integer;--> statement-breakpoint
ALTER TABLE "entries" ADD COLUMN "continued_from_entry_id" uuid;--> statement-breakpoint
ALTER TABLE "entries" ADD COLUMN "entry_mode" text DEFAULT 'new' NOT NULL;--> statement-breakpoint
ALTER TABLE "entry_threads" ADD CONSTRAINT "entry_threads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "entry_threads_user_id_idx" ON "entry_threads" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "entry_threads_root_entry_id_idx" ON "entry_threads" USING btree ("root_entry_id");--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_thread_id_entry_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."entry_threads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_continued_from_entry_id_entries_id_fk" FOREIGN KEY ("continued_from_entry_id") REFERENCES "public"."entries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "entries_thread_id_idx" ON "entries" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "entries_continued_from_entry_id_idx" ON "entries" USING btree ("continued_from_entry_id");--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "entry_threads" TO authenticated;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "entry_threads" TO service_role;--> statement-breakpoint
ALTER TABLE "entry_threads" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "entry_threads_all_own" ON "entry_threads"
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
