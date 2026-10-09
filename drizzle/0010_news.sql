CREATE TABLE "news" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "news_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" text DEFAULT '' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"image_key" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "news_complete_if_published" CHECK ("news"."published_at" is null or (btrim("news"."title") <> '' and btrim("news"."body") <> ''))
);
--> statement-breakpoint
CREATE INDEX "news_published_at_idx" ON "news" USING btree ("published_at");