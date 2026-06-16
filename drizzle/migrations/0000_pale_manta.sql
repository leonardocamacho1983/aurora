CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TABLE "consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(64) NOT NULL,
	"granted" boolean NOT NULL,
	"version" varchar(32) NOT NULL,
	"granted_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crisis_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"entry_id" uuid,
	"severity" varchar(32) NOT NULL,
	"detected_by" varchar(64) NOT NULL,
	"signals" jsonb,
	"acknowledged" boolean DEFAULT false NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" varchar(64) NOT NULL,
	"model" varchar(128) NOT NULL,
	"dimensions" integer NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"chunk_index" integer DEFAULT 0 NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"mood" varchar(64),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" varchar(64) NOT NULL,
	"provider_customer_id" varchar(256),
	"provider_subscription_id" varchar(256),
	"plan" varchar(64) NOT NULL,
	"status" varchar(32) NOT NULL,
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "crisis_events" ADD CONSTRAINT "crisis_events_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "consents_user_id_idx" ON "consents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "crisis_events_user_id_idx" ON "crisis_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "embeddings_user_id_idx" ON "embeddings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "embeddings_embedding_idx" ON "embeddings" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "entries_user_id_idx" ON "entries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions" USING btree ("user_id");