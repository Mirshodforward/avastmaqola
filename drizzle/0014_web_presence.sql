ALTER TABLE "ai_requests" ADD COLUMN "kind" text DEFAULT 'assistant' NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_requests" ADD COLUMN "web_searches" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_requests" ADD COLUMN "result" jsonb;--> statement-breakpoint
ALTER TABLE "ai_requests" ADD CONSTRAINT "ai_requests_kind_valid" CHECK ("ai_requests"."kind" in ('assistant', 'web'));