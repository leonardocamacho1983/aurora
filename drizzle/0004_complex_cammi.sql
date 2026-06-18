CREATE TABLE "waitlist_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"waitlist_id" uuid,
	"event_name" text NOT NULL,
	"source" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "waitlist_profile" (
	"waitlist_id" uuid PRIMARY KEY NOT NULL,
	"name" text,
	"moment" text,
	"rhythm" text,
	"presence" text,
	"value" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "waitlist_events" ADD CONSTRAINT "waitlist_events_waitlist_id_waitlist_id_fk" FOREIGN KEY ("waitlist_id") REFERENCES "public"."waitlist"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist_profile" ADD CONSTRAINT "waitlist_profile_waitlist_id_waitlist_id_fk" FOREIGN KEY ("waitlist_id") REFERENCES "public"."waitlist"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "waitlist_events_waitlist_id_idx" ON "waitlist_events" USING btree ("waitlist_id");--> statement-breakpoint
CREATE INDEX "waitlist_events_event_name_idx" ON "waitlist_events" USING btree ("event_name");--> statement-breakpoint
ALTER TABLE "waitlist_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "waitlist_profile" ENABLE ROW LEVEL SECURITY;
