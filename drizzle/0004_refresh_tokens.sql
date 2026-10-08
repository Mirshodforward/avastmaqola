ALTER TABLE "sessions" ADD COLUMN "prev_token_hash" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "rotated_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "sessions_prev_token_hash_idx" ON "sessions" USING btree ("prev_token_hash");