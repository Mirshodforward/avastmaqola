ALTER TABLE "articles" ADD COLUMN "venue_type" text;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "venue" text;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "volume" text;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "issue" text;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "pages" text;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "pub_year" smallint;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "doi" text;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_venue_type_valid" CHECK ("articles"."venue_type" in ('journal', 'conference'));--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_pub_year_valid" CHECK ("articles"."pub_year" between 1900 and 2100);--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_doi_format" CHECK ("articles"."doi" ~ '^10[.][0-9]{4,9}/[^[:space:]]+$');