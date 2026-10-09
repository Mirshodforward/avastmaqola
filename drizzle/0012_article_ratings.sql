CREATE TABLE "article_ratings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "article_ratings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"article_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"stars" smallint NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	CONSTRAINT "article_ratings_status_valid" CHECK ("article_ratings"."status" in ('pending', 'approved', 'rejected')),
	CONSTRAINT "article_ratings_stars_valid" CHECK ("article_ratings"."stars" between 1 and 5)
);
--> statement-breakpoint
ALTER TABLE "article_ratings" ADD CONSTRAINT "article_ratings_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_ratings" ADD CONSTRAINT "article_ratings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "article_ratings_article_user_idx" ON "article_ratings" USING btree ("article_id","user_id");--> statement-breakpoint
CREATE INDEX "article_ratings_status_idx" ON "article_ratings" USING btree ("status","updated_at");